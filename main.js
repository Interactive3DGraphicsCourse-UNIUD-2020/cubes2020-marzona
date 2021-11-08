import * as THREE from './three/build/three.module.js';
import Stats from './three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from './three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from './three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Terrain } from './obj/Terrain.js';
import { Flame } from './obj/Flame.js';
import config from './obj/vegetationData.js';
import { Bonfire } from './obj/Bonfire.js';
import { colorGradient } from './obj/Helpers.js';
import { bloom_fs, bloom_vs } from './modules/shaders.js'; // glsl shaders
import { CSM } from './three/examples/jsm/csm/CSM.js';
import { CSMHelper } from './three/examples/jsm/csm/CSMHelper.js';
import { GUI } from './three/examples/jsm/libs/dat.gui.module.js';

/*
    // This is a tentative to integrate Cascaded Shadow Maps
    // the class is missing from official documentation
    //
    // see this: https://github.com/vHawk/three-csm
*/

var BLOOM_SCENE = 1;
var bloomComposer, bloomPass, renderPass, finalPass, finalComposer, darkMaterial, materials;
var scene, camera, renderer, clearColor, bloomLayer, params, controls, stats, clock, delta;
var ambientLight, csm, csmHelper, terrain;
var flame, flameMesh, bonfire, bonfireMesh;
var ground, groundGeo, groundMat;


// these are used to set-up orthographic camera
var viewSize = 40; // in world units
var aspectRatio = window.innerWidth / window.innerHeight;
var cameraOffset = 10; // used to shift camera on the Y axis

// sky color & ambient light fading
var lightDirection = (new THREE.Vector3(1, -1.75, 1)).normalize();
var lightFadeTime = 1.5; // expressed in second
var alpha = 1.0;
var alphaUpdate = 1.0 / lightFadeTime; // used for linear interpolation
var skyColorDay = new THREE.Color( 0.57, 0.88, 1.00); // day sky color
var skyColorNight = new THREE.Color( 0.09, 0.09, 0.14 ); // night sky color
// var skyColorDay = new THREE.Color( 0.0, 0.0, 0.0); // day sky color
// var skyColorNight = new THREE.Color( 0.0, 0.0, 0.0); // night sky color
var lightNeedUpdate = 0;
var clearColor = skyColorDay;

let lights_params = {
    shadowBias: 0,
    lightNear: 1,
    lightFar: 5000,
    maxFar: 1000,
    margin: 100,
    ambientMaxIntensity: 0.60,
    ambientMinIntensity: 0.20,
    shadowMaxIntensity: 0.60,
    shadowMinIntensity: 0.20,
};

function Setup() {

    scene = new THREE.Scene();

    // - - WebGL renderer init
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        encoding: THREE.GammaEncoding
    });

    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( skyColorDay );
    renderer.setPixelRatio( window.devicePixelRatio );

    const application = document.getElementById("application");
    application.appendChild( renderer.domElement );

    // - - camera
    camera = new THREE.OrthographicCamera(
        (-aspectRatio * viewSize) / 2,
        (aspectRatio * viewSize) / 2,
        viewSize / 2 + cameraOffset,
        -viewSize / 2 + cameraOffset,
        0.1,
        500
    );
    camera.position.set(-60,25,60);

    // - - bloom layer
    bloomLayer = new THREE.Layers();
    bloomLayer.set( BLOOM_SCENE );

    params = {
        exposure: 1.0,
        bloomStrength : 1.75,
        bloomThreshold: 0,
        bloomRadius: 0,
        scene: "Only emissive-material light sources"
    }

    renderPass = new RenderPass( scene, camera );
    bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;

    bloomComposer = new EffectComposer( renderer );
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass( renderPass );
    bloomComposer.addPass( bloomPass );
    materials = {};
    darkMaterial = new THREE.MeshBasicMaterial( { color: "black" } );

    finalPass = new ShaderPass(
        new THREE.ShaderMaterial( {
            uniforms: {
                baseTexture: { value: null },
                bloomTexture: { value: bloomComposer.renderTarget2.texture }
            },
            vertexShader: bloom_vs,
            fragmentShader: bloom_fs,
            defines: {}
        } ), "baseTexture"
    );
    finalPass.needsSwap = true;

    finalComposer = new EffectComposer( renderer );
    finalComposer.addPass( renderPass );
    finalComposer.addPass( finalPass );
    
    // - - stats
    stats = new Stats();
    document.body.appendChild( stats.domElement ); // this shouldn't be needed anymore

    // - - orbit controls
    controls = new OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', Render );
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.minPolarAngle = Math.PI * 0.1;
    controls.enableKeys = false;
    // controls.enableDamping = true;

    // - - clock for animations
    clock = new THREE.Clock();
    delta = 0;

    // - - - gui, used to setup shadow cameras
    const gui = new GUI();

    gui.add( lights_params, 'maxFar', 0, 500 ).step( 1 ).name( 'shadow far' ).onChange( function ( value ) {
        csm.maxFar = value;
        csm.updateFrustums();
    });

    gui.add( lights_params, 'margin', 1, 5000 ).name( 'light margin' ).onChange( function ( value ) {
        csm.lightMargin = value;
        csm.updateFrustums();
    });

    gui.add( lights_params, 'lightNear', 1, 10000 ).name( 'light near' ).onChange( function ( value ) {
        csm.lightNear = value;
        csm.updateFrustums();
    });

    gui.add( lights_params, 'lightFar', 1, 10000 ).name( 'light far' ).onChange( function ( value ) {
        csm.lightFar = value;
        csm.updateFrustums();
    });

    gui.add( lights_params, 'ambientMinIntensity', 0.01, 1.00 ).name( 'amb min' ).onChange( function ( value ) {
        
    });

    gui.add( lights_params, 'ambientMaxIntensity', 0.01, 1.00 ).name( 'amb max' ).onChange( function ( value ) {
        
    });

    gui.add( lights_params, 'shadowMinIntensity', 0.01, 1.00 ).name( 'shadow min' ).onChange( function ( value ) {
        
    });

    gui.add( lights_params, 'shadowMaxIntensity', 0.01, 1.00 ).name( 'shadow max' ).onChange( function ( value ) {
        
    });
  
}

function BuildScene() {
    // enable shadowmaps
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap; // this seems to give the best results

    // add ambient
    ambientLight = new THREE.AmbientLight( 0xffffff, lights_params.ambientMaxIntensity );
	scene.add( ambientLight );

    // add csm
    csm = new CSM( {
	    cascades: 4,
	    shadowMapSize: 4096,
        parent: scene,
        lightDirection: lightDirection,
        camera: camera,
        mode: 'practical',
        shadowBias: lights_params.shadowBias,
        lightNear: lights_params.lightNear,
        lightFar: lights_params.lightFar,
        maxFar: lights_params.maxFar,
        margin: lights_params.margin,
        lightIntensity: lights_params.shadowMaxIntensity,
    } );

    csmHelper = new CSMHelper( csm );
    csmHelper.visible = false;
    scene.add( csmHelper );

    // - - bonfire
    bonfire = new Bonfire(16.0);
    bonfireMesh = bonfire.getMesh();
    bonfireMesh.position.set(
        0.5,
        8.5,
        -2.5
    );
    scene.add(bonfireMesh);
    bonfire.loadBonfire();

    // - - flame
    flame = new Flame(0.5);
    flameMesh = flame.getMesh();
    flameMesh.position.set(
        0.5,
        8.75,
        -2.5
    );
    scene.add(flameMesh);

    // - - terrain
    terrain = new Terrain( 'texture/terrain.png', 1.0, 7, 2, 7, config );
    scene.add(terrain.getMesh());
    terrain.loadTerrain();

    // - - plane
    groundGeo = new THREE.BoxBufferGeometry( 110, 110, 1 );
    groundMat = new THREE.MeshPhongMaterial( { color: 0x39393b, specular: 0x050505} );
    ground = new THREE.Mesh( groundGeo, groundMat );
    ground.rotation.x = -Math.PI/2;
    scene.add( ground );
    ground.receiveShadow = true;

}

function Update() {
    requestAnimationFrame( Update );
    
    camera.updateMatrixWorld();
	csm.update();

    camera.updateProjectionMatrix();
	csm.updateFrustums();
    csmHelper.update();

    controls.update();  
    stats.update();
    Animate();
    Render();
}

function Render() {
    //renderer.render(scene, camera);
    renderBloom();
    finalComposer.render();
}

function Animate() {       
    delta = clock.getDelta();
    flame.animate( delta );
    updateSceneLights( delta );
}

function renderBloom() {
    scene.traverse( darkenNonBloomed );
    renderer.setClearColor( new THREE.Color(0.0,0.0,0.0) );
    bloomComposer.render();
    renderer.setClearColor( clearColor );
    scene.traverse( restoreMaterial );
}

// This binds scene materials to the csm's shadow camera
function BindMaterials() {
    scene.traverse( function ( child ) {

        if ( child instanceof THREE.Mesh ) {

            csm.setupMaterial( child.material );

        }

    } );
}

// sets cdiff to black for all meshes not in bloom layer
function darkenNonBloomed( obj ) {

    if ( obj.isMesh && bloomLayer.test( obj.layers ) === false ) {
        materials[ obj.uuid ] = obj.material;
        obj.material = darkMaterial;
    }

}

function restoreMaterial( obj ) {

    if ( materials[ obj.uuid ] ) {
        obj.material = materials[ obj.uuid ];
        delete materials[ obj.uuid ];
    }

}

function updateSceneLights( time ) {
    if ( lightNeedUpdate !== 0 ) {
        if ( lightNeedUpdate === 1 ) { // day to night
            alpha -= ( time * alphaUpdate);
            if (alpha < 0) {
                alpha = 0;
                lightNeedUpdate = 0;
            }
        }
        if ( lightNeedUpdate === 2 ) { // night to day
            alpha += ( time * alphaUpdate);
            if (alpha > 1) {
                alpha = 1;
                lightNeedUpdate = 0;
            }
        }
        ambientLight.intensity = lights_params.ambientMinIntensity + (alpha * ( lights_params.ambientMaxIntensity - lights_params.ambientMinIntensity ));
        csm.lightIntensity = lights_params.shadowMinIntensity + (alpha * ( lights_params.shadowMaxIntensity - lights_params.shadowMinIntensity ));

        csm.updateFrustums();
        csm.update();

        clearColor = colorGradient( skyColorDay, skyColorNight, alpha);
        renderer.setClearColor( clearColor );
    }
}

Setup();
BuildScene();
BindMaterials();
Update();

// - - ui handlers
var flameOn = false;
var sunlightOn = true;

// has to be attached to window because its declared inside a module
window.buttonPressHandler = function( parent, sceneElement ) {
    if ( parent.getAttribute('class') == 'on' ) {
        parent.innerHTML = "OFF";
        parent.setAttribute("class", "off");
    } else {
        parent.innerHTML = "ON";
        parent.setAttribute("class", "on");
    }

    if ( sceneElement == 'flame' ) {
        if ( flameOn ) {
            flame.stop();
            flameOn = false;
        } else {
            flame.start();
            flameOn = true;
        }
    }

    if ( sceneElement == 'sunlight' ) {
        if ( sunlightOn ) {
            sunlightOn = false;
            lightNeedUpdate = 1;
        } else {
            sunlightOn = true;
            lightNeedUpdate = 2;
        }
    }
}