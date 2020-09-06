import * as THREE from 'https://unpkg.com/three@0.120.0/build/three.module.js';
import { BufferGeometryUtils } from 'https://unpkg.com/three@0.120.0/examples/jsm/utils/BufferGeometryUtils.js';

export class Grass {

    constructor( scale = 1.0, palette = 'land' ) {
        this.scale = scale;
        this.voxelSize = 16;
        this.grassSize = 15; // use odd numbers
        this.grassMaxHeight = 8;
        this.palette = palette;
    }

    getMesh() {
        let self = this;
        let mesh = new THREE.Object3D();
        let matrix = new THREE.Matrix4();
        let grassHi = [];
        let grassMid = [];
        let grassLow = [];
        let colorHi, colorMid, colorLow;

        // setup color palette
        if (self.palette == 'land') {
            colorHi = new THREE.Color('rgb(18,231,54)');
            colorMid = new THREE.Color('rgb(75,195,55)');
            colorLow = new THREE.Color('rgb(51,150,35)');
        }
        if (self.palette == 'ocean') {
            colorLow = new THREE.Color('rgb(45,80,40)');
            colorMid = new THREE.Color('rgb(16,135,96)');
            colorHi = new THREE.Color('rgb(12,108,76)');
        }

        let geometry = new THREE.BoxBufferGeometry(1,1,1);

        // setup the geometry
        for( let x = 0; x < self.grassSize; x++ ) {
            let height = self.randInt(1,self.grassMaxHeight);
            for ( let i = 0; i < height; i ++ ) {
                matrix.makeTranslation(
                    - self.grassSize / 2 + x * 1 + 1 / 2,
                    1 / 2 + i * 1,
                    0
                );
                if ( i === height - 1) {
                    grassHi.push( geometry.clone().applyMatrix4( matrix ) );
                }
                if (i === height - 2 ) {
                    grassMid.push( geometry.clone().applyMatrix4( matrix ) );
                }
                if (i < height - 2 ) {
                    grassLow.push( geometry.clone().applyMatrix4( matrix ) );
                }
            }

        }

        for( let z = 0; z < self.grassSize; z++ ) {
            if (z === ~~(self.grassSize / 2) ) {
                continue;
            }

            let height = self.randInt(1,self.grassMaxHeight);
            for ( let i = 0; i < height; i ++ ) {
                matrix.makeTranslation(
                    0,
                    1 / 2 + i * 1,
                    - self.grassSize / 2 + z * 1 + 1 / 2
                );
                if ( i === height - 1) {
                    grassHi.push( geometry.clone().applyMatrix4( matrix ) );
                }
                if (i >= height - 3 && i !== height - 1 ) {
                    grassMid.push( geometry.clone().applyMatrix4( matrix ) );
                }
                if (i < height - 3 ) {
                    grassLow.push( geometry.clone().applyMatrix4( matrix ) );
                }
            }
        }


        let hiGroup = BufferGeometryUtils.mergeBufferGeometries( grassHi );
        let hiMesh = new THREE.Mesh( hiGroup, new THREE.MeshPhongMaterial({
            color: colorHi
        }));
        mesh.add(hiMesh);

        let midGroup = BufferGeometryUtils.mergeBufferGeometries( grassMid );
        let midMesh = new THREE.Mesh( midGroup, new THREE.MeshPhongMaterial({
            color: colorMid
        }));
        mesh.add(midMesh);

        let lowGroup = BufferGeometryUtils.mergeBufferGeometries( grassLow );
        let lowMesh = new THREE.Mesh( lowGroup, new THREE.MeshPhongMaterial({
            color: colorLow
        }));
        mesh.add(lowMesh);

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

    randInt( min, max ) {
        return ~~((Math.random() * (max - min + 1)) + min);
    }

}