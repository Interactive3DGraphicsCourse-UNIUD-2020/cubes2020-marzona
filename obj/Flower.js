import * as THREE from '../three/build/three.module.js';
import { materials } from './materials.js';

export class Flower {

    constructor( scale = 1.0 ) {
        this.scale = scale;
        this.voxelSize = 16;
        this.petalsNumber = 4;
    }

    getMesh( placementMat ) {
        let self = this;
        let mesh = new THREE.Object3D();

        let geometry = new THREE.BoxBufferGeometry(1,1,1);

        let stemMaterial = materials.flowerStem;
        let petalsMaterial = materials.flowerPetals;

        let stemObjMat = [];
        let petalsObjMat = [];

        let stemSceneMat = [];
        let petalsSceneMat = [];

        // set stem object transform
        stemObjMat.push( (new THREE.Matrix4()).compose(
            new THREE.Vector3(0,1,0),
            new THREE.Quaternion(),
            new THREE.Vector3(2,2,2)
        ));

        // set petal object transforms
        for( let j = 0; j < self.petalsNumber; j++) {

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
            petalsObjMat.push( (new THREE.Matrix4()).copy( matrix ) );

        }

        // set object x scene matrices ( scenetransform )
        for (let f = 0; f < placementMat.length; f++) {

            // stems
            for (let a = 0; a < stemObjMat.length; a++) {
                stemSceneMat.push( (new THREE.Matrix4()).multiplyMatrices( placementMat[f], stemObjMat[a] ));
            }

            // petals
            for (let b = 0; b < petalsObjMat.length; b++) {
                petalsSceneMat.push( (new THREE.Matrix4()).multiplyMatrices( placementMat[f], petalsObjMat[b] ));
            }

        }

        // build and place instanced meshes
        let stemMesh = new THREE.InstancedMesh( geometry, stemMaterial, stemSceneMat.length );

        for( let h = 0; h < stemSceneMat.length; h++ ) {
            stemMesh.setMatrixAt(h, stemSceneMat[h]);
        }

        mesh.add( stemMesh );

        // ... and petals, with randmaterials - this is a pretty poor solution but runs only on scene init
        let flowersPerGroup = ~~( placementMat.length / petalsMaterial.length );
        let petalsIndex = 0;

        for(let r = 0; r < petalsMaterial.length; r++) {

            if( r == ( petalsMaterial.length - 1) ) {
                flowersPerGroup = flowersPerGroup + ( placementMat.length - ( flowersPerGroup * petalsMaterial.length ) );
            }

            let units = self.petalsNumber * flowersPerGroup;
            const petalsMesh = new THREE.InstancedMesh( geometry, petalsMaterial[r], units );
            let index = 0;

            for(let v = petalsIndex; v < (petalsIndex + units); v++) {
                petalsMesh.setMatrixAt( index, petalsSceneMat[v]);
                index++;
            }

            petalsIndex += units;
            mesh.add( petalsMesh );
        }
        
        
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