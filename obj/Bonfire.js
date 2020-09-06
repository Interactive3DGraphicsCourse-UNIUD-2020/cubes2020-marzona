import * as THREE from 'https://unpkg.com/three@0.120.0/build/three.module.js';
import { OBJLoader } from 'https://unpkg.com/three@0.120.0/examples/jsm/loaders/OBJLoader.js';

export class Bonfire {
    constructor (scale = 1.0) {
        this.scale = scale;
        this.voxelSize = 16;
        this.mesh = new THREE.Object3D();
    }

    loadBonfire() {
        let self = this;
        let bonfireGroup = new THREE.Object3D();
        let rockMaterial = new THREE.MeshPhongMaterial({
            color: 0xd4dcdd
        });
        let swordMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            shininess: 256,
            specular: new THREE.Color(0.56,0.57,0.56),
        });
        let charcoalMaterial = new THREE.MeshPhongMaterial({
            color: 0x252525
        });

        // create objloader and add meshes to main group
        let loader = new OBJLoader();
        loader.load(
            // resource URL
            'obj/bonfire/rocks.obj',
            // called when resource is loaded
            function ( object ) {
                object.traverse( function ( child ) {

                    if ( child instanceof THREE.Mesh ) {
            
                        child.material = rockMaterial;
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                bonfireGroup.add( object );
            }
        );
        loader.load(
            // resource URL
            'obj/bonfire/charcoal.obj',
            // called when resource is loaded
            function ( object ) {
                object.traverse( function ( child ) {

                    if ( child instanceof THREE.Mesh ) {
            
                        child.material = charcoalMaterial;
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                bonfireGroup.add( object );
            }
        );
        loader.load(
            // resource URL
            'obj/bonfire/sword.obj',
            // called when resource is loaded
            function ( object ) {
                object.traverse( function ( child ) {

                    if ( child instanceof THREE.Mesh ) {
            
                        child.material = swordMaterial;
                        child.castShadow = true;
                        child.receiveShadow = true;
            
                    }
                });
                object.rotateX(-0.1);
                object.rotateZ(0.1);
                bonfireGroup.add( object );
            }

        );

        bonfireGroup.scale.set(
            1 / self.voxelSize * self.scale,
            1 / self.voxelSize * self.scale,
            1 / self.voxelSize * self.scale
        )
        self.mesh.add( bonfireGroup );

    }

    getMesh() {
        let self = this;
        return self.mesh;
    }

}