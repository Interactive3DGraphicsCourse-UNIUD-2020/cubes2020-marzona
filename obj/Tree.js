import * as THREE from 'https://unpkg.com/three@0.120.0/build/three.module.js';
import { BufferGeometryUtils } from 'https://unpkg.com/three@0.120.0/examples/jsm/utils/BufferGeometryUtils.js';

export class Tree {

    constructor( scale = 1.0 ) {
        this.scale = scale;
        this.voxelSize = 16;
    }

    getMesh() {
        let self = this;
        let mesh = new THREE.Object3D();
        let matrix = new THREE.Matrix4();
        let trunk;
        let leaves = [];

        let leavesColor = new THREE.Color('rgb(45,80,40)');
        let trunkColor = new THREE.Color('rgb(87,64,39)');

        // add trunk
        let trunkGeometry = new THREE.BoxBufferGeometry(4,10,4);
        matrix.makeTranslation(
            0,
            5,
            0
        );
        trunkGeometry.applyMatrix4( matrix );
        trunk = new THREE.Mesh( trunkGeometry, new THREE.MeshPhongMaterial({
            color: trunkColor
        }));
        mesh.add(trunk);

        // add leaves
        for (let i = 0; i < 4; i++) {
            if (i === 3) {
                let leavesGeometry = new THREE.BoxBufferGeometry(4,6,4);
                matrix.makeTranslation(
                    0,
                    37,
                    0
                );
                leaves.push( leavesGeometry.applyMatrix4( matrix ));
                break;
            }
            let leavesGeometry = new THREE.BoxBufferGeometry(28 - 8 * i,8,28 - 8 * i);
            matrix.makeTranslation(
                0,
                10 + 4 + i * 8,
                0
            );
            leaves.push( leavesGeometry.applyMatrix4( matrix ));
        }

        let leavesGroup = BufferGeometryUtils.mergeBufferGeometries( leaves );
        let leavesMesh = new THREE.Mesh( leavesGroup, new THREE.MeshPhongMaterial({
            color: leavesColor
        }));
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
        return mesh;
    }

}