import * as THREE from 'https://unpkg.com/three@0.120.0/build/three.module.js';
export var materials = {
    grass: new THREE.MeshPhongMaterial({
        map: myCustomLoad('../texture/grass.png'),
        side: THREE.DoubleSide
    }),
    dirt: new THREE.MeshPhongMaterial({
        map: myCustomLoad('../texture/dirt.png'),
        side: THREE.DoubleSide
    }),
    stone: new THREE.MeshPhongMaterial({
        map: myCustomLoad('../texture/stone.png'),
        side: THREE.DoubleSide
    }),
    sand: new THREE.MeshPhongMaterial({
        map: myCustomLoad('../texture/sand.png'),
        side: THREE.DoubleSide
    }),
    water: new THREE.MeshPhongMaterial({
        map: myCustomLoad('../texture/water.png'),
        side: THREE.DoubleSide,
        opacity: 0.7,
        transparent: true,
        blendSrc: THREE.SrcAlphaFactor,
		blendDst: THREE.OneMinusSrcAlphaFactor,
		blendEquation: THREE.AddEquation,
    })
};

function myCustomLoad( url ){
    var tl = new THREE.TextureLoader();
    var newTex = tl.load(url); //make the proxy
    newTex.magFilter = THREE.NearestFilter;//config
    return newTex; //return configured texture, it will update itself 
}