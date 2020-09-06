import * as THREE from 'https://unpkg.com/three@0.120.0/build/three.module.js';
export var materials = {

    grass: new THREE.MeshPhongMaterial({
        //map: textureLoader('../texture/grass.png'),
        color: 0x98e070,
        side: THREE.DoubleSide
    }),
    dirt: new THREE.MeshPhongMaterial({
        //map: textureLoader('../texture/dirt.png'),
        color: 0x60571e,
        side: THREE.DoubleSide
    }),
    stone: new THREE.MeshPhongMaterial({
        //map: textureLoader('../texture/stone.png'),
        color: 0xd4dcdd,
        side: THREE.DoubleSide
    }),
    sand: new THREE.MeshPhongMaterial({
        color: 0xfff5d5,
        //map: textureLoader('../texture/sand.png'),
        side: THREE.DoubleSide
    }),
    water: new THREE.MeshPhongMaterial({
        //map: textureLoader('../texture/water.png')
        color: 0x0892d0,
        shininess: 64,
        specular: new THREE.Color(0.31,0.31,0.31),
        opacity: 0.7,
        transparent: true,
        blendSrc: THREE.SrcAlphaFactor,
		blendDst: THREE.OneMinusSrcAlphaFactor,
		blendEquation: THREE.AddEquation
    })
    
};

function textureLoader( file ){
    var tl = new THREE.TextureLoader();
    var newTex = tl.load( file );
    newTex.magFilter = THREE.NearestFilter; // for lowres textures
    return newTex;
}