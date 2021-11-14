import * as THREE from '../three/build/three.module.js';
import { materials } from './materials.js';

export class Tree {

    constructor( scale = 1.0 ) {
        this.scale = scale;
        this.voxelSize = 16;
    }

    getMesh ( placementMat ) {
        let self = this;
        let mesh = new THREE.Object3D();

        let trunkGeometry = new THREE.BoxBufferGeometry(4,10,4);
        let leavesGeometry = new THREE.BoxBufferGeometry(1,1,1);

        let leavesMaterial = materials.leaves;
        let trunkMaterial = materials.trunk;

        let trunkObjMat = [];
        let leavesObjMat = [];

        let trunkSceneMat = [];
        let leavesSceneMat = [];

        // set trunk object transform
        trunkObjMat.push( (new THREE.Matrix4()).makeTranslation(
            0,
            5,
            0
        ));

        // set leaves object transform
        for (let i = 0; i < 4; i++) {
            
            let scale = new THREE.Vector3();
            let quaternion = new THREE.Quaternion();
            let position = new THREE.Vector3();

            let matrix = new THREE.Matrix4();

            position.x = 0;
            position.y = 10 + 4 + i * 8;
            position.z = 0;

            scale.x = 28 - 8 * i;
            scale.y = 8;
            scale.z = 28 - 8 * i;

            if (i === 3) {

                position.x = 0;
                position.y = 37;
                position.z = 0;
    
                scale.x = 4;
                scale.y = 6;
                scale.z = 4;

            }

            matrix = matrix.compose( position, quaternion, scale );
            leavesObjMat.push( matrix );
        }

        // set object x scene matrices ( scenetransform )
        for (let k = 0; k < placementMat.length; k++) {

            // trunks
            for (let a = 0; a < trunkObjMat.length; a++) {
                trunkSceneMat.push( (new THREE.Matrix4()).multiplyMatrices( placementMat[k], trunkObjMat[a] ));
            }

            // leaves
            for (let b = 0; b < leavesObjMat.length; b++) {
                leavesSceneMat.push( (new THREE.Matrix4()).multiplyMatrices( placementMat[k], leavesObjMat[b] ));
            }
        }

        // build and place instanced meshes
        let trunkMesh = new THREE.InstancedMesh( trunkGeometry, trunkMaterial, trunkSceneMat.length );
        let leavesMesh = new THREE.InstancedMesh( leavesGeometry, leavesMaterial, leavesSceneMat.length );

        for( let j = 0; j < trunkSceneMat.length; j++ ) {
            trunkMesh.setMatrixAt(j, trunkSceneMat[j]);
        }

        for( let g = 0; g < leavesSceneMat.length; g++ ) {
            leavesMesh.setMatrixAt(g, leavesSceneMat[g]);
        }

        mesh.add(trunkMesh);
        mesh.add(leavesMesh);

        mesh.scale.set(
            1 / self.voxelSize * self.scale,
            1 / self.voxelSize * self.scale,
            1 / self.voxelSize * self.scale
        );

        mesh.traverse(function (obj) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        });
        
        return mesh;

    }

}