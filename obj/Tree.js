import * as THREE from '../three/build/three.module.js';
import { materials } from './materials.js';

export class Tree {

    constructor( scale = 1.0 ) {
        this.scale = scale;
        this.voxelSize = 16;
        this.init();
    }

    init() {
        let self = this;
        let mesh = new THREE.Object3D();
        let matrix = new THREE.Matrix4();
        let trunk;
        let leaves = [];

        // add trunk
        let trunkGeometry = new THREE.BoxBufferGeometry(4,10,4);
        matrix.makeTranslation(
            0,
            5,
            0
        );
        trunkGeometry.applyMatrix4( matrix );
        trunk = new THREE.Mesh( trunkGeometry, materials.trunk);
        mesh.add(trunk);

        // add leaves
        let leavesGeometry = new THREE.BoxBufferGeometry();
        let leavesMaterial = materials.leaves;

        let leavesMesh = new THREE.InstancedMesh( leavesGeometry, leavesMaterial , 4);
        
        // scale and translate
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

                //break;
            }

            matrix = matrix.compose( position, quaternion, scale );
            leavesMesh.setMatrixAt( i, matrix );

        }

        mesh.add(leavesMesh);
        mesh.traverse(function (obj) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        });

        mesh.scale.set(
            1 / self.voxelSize * self.scale,
            1 / self.voxelSize * self.scale,
            1 / self.voxelSize * self.scale
        );
        this.mesh = mesh;
    }

    getMesh() {
        return this.mesh.clone();
    }

}