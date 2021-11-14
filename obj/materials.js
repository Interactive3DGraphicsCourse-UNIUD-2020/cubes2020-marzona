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
    }),
    leaves: new THREE.MeshPhongMaterial({
        color: new THREE.Color('rgb(45,80,40)'),
        side: THREE.DoubleSide,
    }),
    trunk: new THREE.MeshPhongMaterial({
        color: new THREE.Color('rgb(87,64,39)'),
        side: THREE.DoubleSide,
    }),
    flowerStem: new THREE.MeshPhongMaterial({
        color: new THREE.Color('rgb(255,255,127)'),
    }),
    flowerPetals: [
        new THREE.MeshPhongMaterial({
            color: new THREE.Color('rgb(255,108,0)'),
        }),
        new THREE.MeshPhongMaterial({
            color: new THREE.Color('rgb(255,159,0)'),
        }),
        new THREE.MeshPhongMaterial({
            color: new THREE.Color('rgb(249,220,248)'),
        }),
        new THREE.MeshPhongMaterial({
            color: new THREE.Color('rgb(204,77,65)'),
        }),
    ],
};