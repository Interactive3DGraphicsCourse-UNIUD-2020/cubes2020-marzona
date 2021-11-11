import * as THREE from '../three/build/three.module.js';
import { randInt } from './Helpers.js'

export class Flower {

    constructor( scale = 1.0 ) {
        this.scale = scale;
        this.voxelSize = 16;
        this.init();
    }

    init() {
        let self = this;
        let meshList = [];

        let geometry = new THREE.BoxBufferGeometry(1,1,1);

        let petalColors = [
            new THREE.Color('rgb(255,108,0)'),
            new THREE.Color('rgb(255,159,0)'),
            new THREE.Color('rgb(249,220,248)'),
            new THREE.Color('rgb(204,77,65)')
        ];
        let stemColor = new THREE.Color('rgb(255,255,127)'); // pale yellow

        for(let k = 0; k < petalColors.length; k++) {
            let mesh = new THREE.Object3D();

            // add stem
            let stemMesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial({
                color: stemColor
            }));

            stemMesh.scale.set(2,2,2);
            stemMesh.position.set(0,1,0);
            mesh.add(stemMesh);

            // add petals
            let petalMesh = new THREE.InstancedMesh(
                geometry,
                new THREE.MeshPhongMaterial({
                    color: petalColors[k]
                }),
                4,
            );

            for (let j = 0; j < 4; j++) {
                let scale = new THREE.Vector3();
                let quaternion = new THREE.Quaternion();
                let position = new THREE.Vector3();

                let matrix = new THREE.Matrix4();

                position.x = 2 * ( j % 2 ? -1 : 1 );
                if ( j > 1 ) {
                    position.x = 0;
                }
                position.y = 0.5;
                position.z = 2 * ( j % 2 ? -1 : 1 );
                if ( j < 2 ) {
                    position.z = 0;
                }

                scale.x = 2;
                scale.y = 1;
                scale.z = 2;

                matrix = matrix.compose( position, quaternion, scale );
                petalMesh.setMatrixAt( j, matrix );
            }

            mesh.add(petalMesh);
            mesh.scale.set(
                1 / self.voxelSize * self.scale,
                1 / self.voxelSize * self.scale,
                1 / self.voxelSize * self.scale
            );    
            mesh.traverse(function (obj) {
                obj.castShadow = false;
                obj.receiveShadow = true;
            });
            meshList[k] = mesh;
        }        

        this.meshList = meshList;
    }

    getMesh() {
        let index = randInt(0, this.meshList.length - 1);
        return this.meshList[index].clone();
    }

}