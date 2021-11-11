import * as THREE from '../three/build/three.module.js';

export var materials = {

    grass: new THREE.MeshPhongMaterial({
        color: 0x98e070,
        side: THREE.DoubleSide
    }),
    dirt: new THREE.MeshPhongMaterial({
        color: 0x60571e,
        side: THREE.DoubleSide
    }),
    stone: new THREE.MeshPhongMaterial({
        color: 0xd4dcdd,
        side: THREE.DoubleSide
    }),
    sand: new THREE.MeshPhongMaterial({
        color: 0xfff5d5,
        side: THREE.DoubleSide
    }),
    water: new THREE.MeshPhongMaterial({
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