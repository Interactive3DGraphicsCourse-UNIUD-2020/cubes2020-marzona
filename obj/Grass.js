import * as THREE from '../three/build/three.module.js';
import { randInt } from './Helpers.js';

export class Grass {

    constructor( scale = 1.0, palette = 'land' ) {
        this.scale = scale;
        this.voxelSize = 16;
        this.grassSize = 15; // use odd numbers
        this.grassMaxHeight = 8;
        this.palette = palette;
    }

    getMesh( placementMat ) {
        let self = this;
        let mesh = new THREE.Object3D();

        let geometry = new THREE.BoxBufferGeometry(1,1,1);

        let hiSceneMat = [];
        let midSceneMat = [];
        let lowSceneMat = [];

        let colorHi, colorMid, colorLow;
        // setup color palette, the ocean one is used for seaweed
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

        for (let j = 0; j < placementMat.length; j++) {

            let matrix = new THREE.Matrix4();

            // setup the geometry, iterates along x and z axis
            // uses random values from 1 to grassMaxHeight
            // for individual grass strands heights
            for( let x = 0; x < self.grassSize; x++ ) {
                let height = randInt(1,self.grassMaxHeight);
                for ( let i = 0; i < height; i ++ ) {
                    matrix.makeTranslation(
                        - self.grassSize / 2 + x * 1 + 1 / 2,
                        1 / 2 + i * 1,
                        0
                    );
                    if ( i === height - 1) {
                        hiSceneMat.push( (new THREE.Matrix4()).multiplyMatrices( placementMat[j], matrix ) );
                    }
                    if (i === height - 2 ) {
                        lowSceneMat.push( (new THREE.Matrix4()).multiplyMatrices( placementMat[j], matrix ) );
                    }
                    if (i < height - 2 ) {
                        midSceneMat.push( (new THREE.Matrix4()).multiplyMatrices( placementMat[j], matrix ) );
                    }
                }

            }

            for( let z = 0; z < self.grassSize; z++ ) {
                if (z === ~~(self.grassSize / 2) ) {
                    continue;
                }

                let height = randInt(1,self.grassMaxHeight);
                for ( let i = 0; i < height; i ++ ) {
                    matrix.makeTranslation(
                        0,
                        1 / 2 + i * 1,
                        - self.grassSize / 2 + z * 1 + 1 / 2
                    );
                    if ( i === height - 1) {
                        hiSceneMat.push( (new THREE.Matrix4()).multiplyMatrices( placementMat[j], matrix ) );
                    }
                    if (i >= height - 3 && i !== height - 1 ) {
                        midSceneMat.push( (new THREE.Matrix4()).multiplyMatrices( placementMat[j], matrix ) );
                    }
                    if (i < height - 3 ) {
                        lowSceneMat.push( (new THREE.Matrix4()).multiplyMatrices( placementMat[j], matrix ) );
                    }
                }
            }
        }

        // setup mesh groups
        let hiMesh = new THREE.InstancedMesh( geometry, new THREE.MeshPhongMaterial({
            color: colorHi
        }), hiSceneMat.length);
        let midMesh = new THREE.InstancedMesh( geometry, new THREE.MeshPhongMaterial({
            color: colorMid
        }), midSceneMat.length );
        let lowMesh = new THREE.InstancedMesh( geometry, new THREE.MeshPhongMaterial({
            color: colorLow
        }), lowSceneMat.length);

        // apply transforms
        this.setTransforms( hiSceneMat, hiMesh );
        this.setTransforms( midSceneMat, midMesh );
        this.setTransforms( lowSceneMat, lowMesh );

        mesh.add(hiMesh);
        mesh.add(midMesh);
        mesh.add(lowMesh);

        mesh.scale.set(
            1 / self.voxelSize * self.scale,
            1 / self.voxelSize * self.scale,
            1 / self.voxelSize * self.scale
        );

        return mesh;

    }

    setTransforms( matList, mesh ) {

        for (let m = 0; m < matList.length; m++) {
            mesh.setMatrixAt(m, matList[m]);
        }

        mesh.traverse(function (obj) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        });
        
    }

}