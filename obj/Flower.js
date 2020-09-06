import * as THREE from 'https://unpkg.com/three@0.120.0/build/three.module.js';
import { BufferGeometryUtils } from 'https://unpkg.com/three@0.120.0/examples/jsm/utils/BufferGeometryUtils.js';
import { randArray } from './Helpers.js'

export class Flower {

    constructor( scale = 1.0 ) {
        this.scale = scale;
        this.voxelSize = 16;
    }

    getMesh() {
        let self = this;
        let mesh = new THREE.Object3D();
        let matrix = new THREE.Matrix4();
        let petalGeometry = new THREE.BoxBufferGeometry( 2, 1, 2 );
        let stemGeometry = new THREE.BoxBufferGeometry( 2, 2, 2 );
        let petals = [];
        let stem;

        let petalColors = [
            new THREE.Color('rgb(255,108,0)'),
            new THREE.Color('rgb(255,159,0)'),
            new THREE.Color('rgb(249,220,248)'),
            new THREE.Color('rgb(204,77,65)')
        ];
        let stemColor = new THREE.Color('rgb(255,255,127)'); // pale yellow

        // add stem
        matrix.makeTranslation(
            0,
            1,
            0
        );
        stemGeometry.applyMatrix4( matrix );
        stem = new THREE.Mesh( stemGeometry, new THREE.MeshPhongMaterial({
            color: stemColor
        }));
        mesh.add(stem);

        // add petals
        matrix.makeTranslation(
            2,
            0.5,
            0
        );
        petals.push( petalGeometry.clone().applyMatrix4( matrix ) );

        matrix.makeTranslation(
            -2,
            0.5,
            0
        );
        petals.push( petalGeometry.clone().applyMatrix4( matrix ) );

        matrix.makeTranslation(
            0,
            0.5,
            2
        );
        petals.push( petalGeometry.clone().applyMatrix4( matrix ) );

        matrix.makeTranslation(
            0,
            0.5,
            -2
        );
        petals.push( petalGeometry.clone().applyMatrix4( matrix ) );
        let petalsGroup = BufferGeometryUtils.mergeBufferGeometries( petals );
        let petalsMesh = new THREE.Mesh( petalsGroup, new THREE.MeshPhongMaterial({
            color: randArray(petalColors) // takes a random color for petals
        }));
        mesh.add(petalsMesh);

        mesh.scale.set(
            1 / self.voxelSize * self.scale,
            1 / self.voxelSize * self.scale,
            1 / self.voxelSize * self.scale
        );

        mesh.traverse(function (obj) {
            obj.castShadow = false;
            obj.receiveShadow = true;
        });
        return mesh;
    }

}