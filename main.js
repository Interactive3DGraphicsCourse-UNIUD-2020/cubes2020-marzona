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

var BLOOM_SCENE = 1;
var bloomComposer, bloomPass, renderPass, finalPass, finalComposer, darkMaterial, materials;
var scene, camera, renderer, clearColor, bloomLayer, params, controls, stats, clock, timedelta;
var dirLight, dirLightSize, hemiLight, terrain;
var flame, flameMesh, bonfire, bonfireMesh;
var ground, groundGeo, groundMat;

// these are used to set-up orthographic camera
var viewSize = 40; // in world units
var aspectRatio = window.innerWidth / window.innerHeight;
var cameraOffset = 10; // used to shift camera on the Y axis

// hemilight and dirlight settings
var lightFadeTime = 1.5; // expressed in second
var hemiColorDay = new THREE.Color( 0.57, 0.88, 1.00); // day sky color
var hemiColorNight = new THREE.Color( 0.09, 0.09, 0.14 ); // night sky color
var hemiColorGround = new THREE.Color( 1.00, 0.78, 0.50 ); // ground color
var dirColorDay = new THREE.Color( 1.0, 0.96, 0.90 ); // directional day color
var dirColorNight = new THREE.Color( 1.0, 0.83, 0.66 ); // directional night color, used 4100K color temperature
var alpha = 1.0; // alpha value, used for linear interpolation
var alphaUpdate = 1.0 / lightFadeTime;
var hemiMaxIntensity = 0.6;
var hemiMinIntensity = 0.3;
var dirMaxIntensity = 0.9;
var dirMinIntensity = 0.4;
var lightsNeedUpdate = 0;
var clearColor = hemiColorDay;

function Setup() {

    scene = new THREE.Scene();

    // - - WebGL renderer init
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        encoding: THREE.GammaEncoding
    });

    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( hemiColorDay );
    renderer.setPixelRatio( window.devicePixelRatio );

    const application = document.getElementById("application");
    application.appendChild( renderer.domElement );

    // enable shadowmaps
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap; // this seems to give the best results

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
    stats.showPanel( 0 ); // 0 fps, 1 ms, 2 Mb (only in chrome browser)
    document.body.appendChild( stats.domElement );

    // - - orbit controls
    controls = new OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', Render );
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.minPolarAngle = Math.PI * 0.1;
    controls.enableKeys = false;
    // controls.enableDamping = true;

    // - - clock for animations
    clock = new THREE.Clock();
    timedelta = 0;
    
}

function BuildScene() {
    // - - scene lights
    hemiLight = new THREE.HemisphereLight( hemiColorDay, hemiColorGround, hemiMaxIntensity );
    hemiLight.position.set( 0, 500, 0 );
    scene.add( hemiLight );

    dirLightSize = 30;
    dirLight = new THREE.DirectionalLight( dirColorDay, 1.0 );
    dirLight.position.set( -1, 1.75, -1 );
    dirLight.position.multiplyScalar( 50 );
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    dirLight.shadow.bias = -0.0003;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.left = -dirLightSize;
    dirLight.shadow.camera.right = dirLightSize;
    dirLight.shadow.camera.top = dirLightSize;
    dirLight.shadow.camera.bottom = -dirLightSize;
    scene.add( dirLight );

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
    timedelta = clock.getDelta();
    flame.animate( timedelta );
    updateSceneLights( timedelta );
}

function renderBloom() {
    scene.traverse( darkenNonBloomed );
    renderer.setClearColor( new THREE.Color(0.0,0.0,0.0) );
    bloomComposer.render();
    renderer.setClearColor( clearColor );
    scene.traverse( restoreMaterial );
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
    if ( lightsNeedUpdate !== 0 ) {
        if ( lightsNeedUpdate === 1 ) { // day to night
            alpha -= ( time * alphaUpdate);
            if (alpha < 0) {
                alpha = 0;
                lightsNeedUpdate = 0;
            }
        }
        if ( lightsNeedUpdate === 2 ) { // night to day
            alpha += ( time * alphaUpdate);
            if (alpha > 1) {
                alpha = 1;
                lightsNeedUpdate = 0;
            }
        }
        dirLight.intensity = dirMinIntensity + (alpha * (  dirMaxIntensity - dirMinIntensity ));
        hemiLight.intensity = hemiMinIntensity + (alpha * (  hemiMaxIntensity - hemiMinIntensity ));
        dirLight.color = colorGradient( dirColorDay, dirColorNight, alpha );
        clearColor = colorGradient( hemiColorDay, hemiColorNight, alpha);
        hemiLight.color = clearColor;
        renderer.setClearColor( clearColor );
    }
}

Setup();
BuildScene();
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
            lightsNeedUpdate = 1;
        } else {
            sunlightOn = true;
            lightsNeedUpdate = 2;
        }
    }
}