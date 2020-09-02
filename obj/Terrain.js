import * as THREE from 'https://unpkg.com/three@0.120.0/build/three.module.js';
import { BufferGeometryUtils } from 'https://unpkg.com/three@0.120.0/examples/jsm/utils/BufferGeometryUtils.js';
import { materials } from './materials.js'

// Note: scale is used as cube size
export class Terrain {

    constructor(image, scale = 1, seaLevel = 16, dirtBlocks = 3, mixedBlocks = 2, sandBlocks = 18 ) {
        this.image = image;
        this.scale = scale;
        this.voxelSize = 10;
        this.voxelHalf = 5;

        this.seaLevel = seaLevel;
        this.dirtBlocks = dirtBlocks;
        this.sandBlocks = sandBlocks;
        this.mixedBlocks = mixedBlocks;

        this.terrain = new THREE.Object3D();
    }

    getMesh() {
        let self = this;
        return self.terrain;
    }

    loadTerrain() {
        let self = this;

        let loader = new THREE.ImageLoader();
        loader.load(self.image, function (image) {

            let heightData, worldWidth, worldDepth, size;
            let worldHalfWidth, worldHalfDepth;
            let terrainMaterials = {
                'grass' : [],
                'stone' : [],
                'sand' : [],
                'dirt' : [],
                'water' : []
            };

            // set up cube planes
            let matrix = new THREE.Matrix4();
            let pxGeometry = new THREE.PlaneBufferGeometry( self.voxelSize, self.voxelSize );
            pxGeometry.attributes.uv.array[ 1 ] = 0.5;
            pxGeometry.attributes.uv.array[ 3 ] = 0.5;
            pxGeometry.rotateY( Math.PI / 2 );
            pxGeometry.translate( self.voxelHalf, 0, 0 );

            let nxGeometry = new THREE.PlaneBufferGeometry( self.voxelSize, self.voxelSize );
            nxGeometry.attributes.uv.array[ 1 ] = 0.5;
            nxGeometry.attributes.uv.array[ 3 ] = 0.5;
            nxGeometry.rotateY( - Math.PI / 2 );
            nxGeometry.translate( - self.voxelHalf, 0, 0 );

            let pyGeometry = new THREE.PlaneBufferGeometry( self.voxelSize, self.voxelSize );
            pyGeometry.attributes.uv.array[ 5 ] = 0.5;
            pyGeometry.attributes.uv.array[ 7 ] = 0.5;
            pyGeometry.rotateX( - Math.PI / 2 );
            pyGeometry.translate( 0, self.voxelHalf, 0 );

            let nyGeometry = new THREE.PlaneBufferGeometry( self.voxelSize, self.voxelSize );
            nyGeometry.attributes.uv.array[ 5 ] = 0.5;
            nyGeometry.attributes.uv.array[ 7 ] = 0.5;
            nyGeometry.rotateX( Math.PI /  2);
            nyGeometry.translate( 0, self.voxelHalf, 0 );

            let pzGeometry = new THREE.PlaneBufferGeometry( self.voxelSize, self.voxelSize );
            pzGeometry.attributes.uv.array[ 1 ] = 0.5;
            pzGeometry.attributes.uv.array[ 3 ] = 0.5;
            pzGeometry.translate( 0, 0, self.voxelHalf );

            let nzGeometry = new THREE.PlaneBufferGeometry( self.voxelSize, self.voxelSize );
            nzGeometry.attributes.uv.array[ 1 ] = 0.5;
            nzGeometry.attributes.uv.array[ 3 ] = 0.5;
            nzGeometry.rotateY( Math.PI );
            nzGeometry.translate( 0, 0, - self.voxelHalf );

            let cubeGeometry = {
                'top': pyGeometry,
                'bottom': nyGeometry,
                'left': nxGeometry,
                'right': pxGeometry,
                'far': pzGeometry,
                'near': nzGeometry
            };

            // get terrain size and heighdata from loaded texture
            worldWidth = image.width;
            worldDepth = image.height;
            worldHalfWidth = ~~(worldWidth / 2);
            worldHalfDepth = ~~(worldDepth / 2);
            size = worldWidth * worldDepth;

            heightData = self.getHeightData( image );
    
            for (let i = 0; i < size; i++) {

                let xpos = i % worldWidth;
                let zpos = ~~(i / worldDepth);
                let ypos = self.getY(xpos, zpos, heightData, worldWidth);

                matrix.makeTranslation(
                    xpos * self.voxelSize - worldHalfWidth * self.voxelSize,
                    ypos * self.voxelSize,
                    zpos * self.voxelSize - worldHalfDepth * self.voxelSize
                );

                // get neighbor voxels's heighdata
                let neighbors = {
                    'far' : self.getY(xpos, zpos + 1, heightData, worldWidth),
                    'near' : self.getY(xpos, zpos - 1, heightData, worldWidth),
                    'left' : self.getY(xpos - 1, zpos, heightData, worldWidth),
                    'right' : self.getY(xpos + 1, zpos, heightData, worldWidth)
                }

                // push top plane for surface voxel
                if ( ypos > self.sandBlocks ) {
                    terrainMaterials['grass'].push( cubeGeometry['top'].clone().applyMatrix4( matrix ) );
                } else {
                    terrainMaterials['sand'].push( cubeGeometry['top'].clone().applyMatrix4( matrix ) );
                }

                // push top plane for water layer
                if ( ypos < self.seaLevel ) {
                    matrix.makeTranslation(
                        xpos * self.voxelSize - worldHalfWidth * self.voxelSize,
                        self.seaLevel * self.voxelSize,
                        zpos * self.voxelSize - worldHalfDepth * self.voxelSize
                    );
                    terrainMaterials['water'].push( cubeGeometry['top'].clone().applyMatrix4( matrix ) );
                }
                
                // left, right, near and far
                for ( let direction in neighbors ) {

                    let near = neighbors[direction];
                    let curHeight = ypos;
                        
                    while ( curHeight > near ) {
                        matrix.makeTranslation(
                            xpos * self.voxelSize - worldHalfWidth * self.voxelSize,
                            curHeight * self.voxelSize,
                            zpos * self.voxelSize - worldHalfDepth * self.voxelSize
                        );

                        // push side planes based on height value
                        if ( curHeight === ypos ) {
                            if ( curHeight > self.sandBlocks ) {
                                terrainMaterials['grass'].push( cubeGeometry[direction].clone().applyMatrix4( matrix ) );
                            } else {
                                terrainMaterials['sand'].push( cubeGeometry[direction].clone().applyMatrix4( matrix ) );
                            }
                        }

                        if ( curHeight < ypos ) {
                            if ( curHeight > (ypos - ( self.dirtBlocks + self.mixedBlocks ) ) ) {
                                if (curHeight > ( ypos - self.dirtBlocks )) {
                                    terrainMaterials['dirt'].push( cubeGeometry[direction].clone().applyMatrix4( matrix ) );
                                } else {
                                    if (self.randBinary() === 1) {
                                        terrainMaterials['dirt'].push( cubeGeometry[direction].clone().applyMatrix4( matrix ) );
                                    } else {
                                        terrainMaterials['stone'].push( cubeGeometry[direction].clone().applyMatrix4( matrix ) );
                                    }
                                }
                            } else {
                                terrainMaterials['stone'].push( cubeGeometry[direction].clone().applyMatrix4( matrix ) );
                            }
                        }

                        curHeight--;

                    }

                }

                // push water side planes for voxels on the terrain's edges
                // not particularly efficient but seems to work

                if ( ypos < self.seaLevel && ( (zpos === 0) || (xpos === 0) || (zpos === (worldDepth - 1)) || (xpos === (worldWidth - 1)) ) ) {
                    let curHeight = self.seaLevel;
                    while ( curHeight > ypos ) {
                        matrix.makeTranslation(
                            xpos * self.voxelSize - worldHalfWidth * self.voxelSize,
                            curHeight * self.voxelSize,
                            zpos * self.voxelSize - worldHalfDepth * self.voxelSize
                        );

                        if ( xpos === 0 ) {
                            terrainMaterials['water'].push( cubeGeometry['left'].clone().applyMatrix4( matrix ) );
                        }

                        if ( zpos === 0 ) {
                            terrainMaterials['water'].push( cubeGeometry['near'].clone().applyMatrix4( matrix ) );
                        }

                        if ( xpos === (worldWidth - 1) ) {
                            terrainMaterials['water'].push( cubeGeometry['right'].clone().applyMatrix4( matrix ) );
                        }

                        if ( zpos === (worldDepth - 1) ) {
                            terrainMaterials['water'].push( cubeGeometry['far'].clone().applyMatrix4( matrix ) );
                        }

                        curHeight--;
                    }
                    
                }
        
            }
            
            for (let material in terrainMaterials) {

                if ( terrainMaterials[material].length !== 0 ) {

                    let geometryGroup = BufferGeometryUtils.mergeBufferGeometries( terrainMaterials[material] );
                    let mesh = new THREE.Mesh(geometryGroup, materials[material]);
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;

                    self.terrain.add(mesh);

                }

            }

            self.terrain.scale.set(
                1 / self.voxelSize * self.scale,
                1 / self.voxelSize * self.scale,
                1 / self.voxelSize * self.scale
            );
        });

    }

    randBinary() {
        return Math.round(Math.random());
    }

    getY ( x, z, heightData, worldWidth ) {
        return ~~( heightData[ x + z * worldWidth ] );
    }
    
    getHeightData( image ) {
        let data = [];
        let canvas = document.createElement( 'canvas' );
        canvas.width = image.width;
        canvas.height = image.height;

        let context = canvas.getContext( '2d' );
        context.drawImage( image, 0, 0 );
    
        let imageData = context.getImageData( 0, 0, image.width, image.height );
        let pixelData = imageData.data;

        for ( let i = 0; i < pixelData.length; i+=4 ) {
            data.push(~~(( pixelData[i] + pixelData[i+1] + pixelData[i+2] ) / 3));
        }

        return data;
    }
   
}