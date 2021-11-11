import * as THREE from '../three/build/three.module.js';
import { materials } from './materials.js';
import { Flower } from './Flower.js';
import { Tree } from './Tree.js';
import { Grass } from './Grass.js';

// Note: scale is used as cube size in world units
export class Terrain {

    constructor(image, scale = 1, seaLevel = 16, dirtBlocks = 4, sandBlocks = 18, vegetation = null ) {
        this.image = image;
        this.scale = scale;
        this.voxelSize = 16;
        this.voxelHalf = 8;

        this.seaLevel = seaLevel;
        this.dirtBlocks = dirtBlocks;
        this.sandBlocks = sandBlocks;
        this.vegetation = vegetation;

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

            // get terrain size and heighdata from loaded texture
            let heightData, worldWidth, worldDepth, size;
            let worldHalfWidth, worldHalfDepth;

            worldWidth = image.width;
            worldDepth = image.height;
            worldHalfWidth = ~~(worldWidth / 2);
            worldHalfDepth = ~~(worldDepth / 2);
            size = worldWidth * worldDepth;

            heightData = self.getHeightData( image );

            let terrainMat4 = {
                'grass' : [],
                'stone' : [],
                'sand' : [],
                'dirt' : [],
                'water' : []
            };
            let geometry = new THREE.PlaneBufferGeometry( self.voxelSize, self.voxelSize );

            // setup tile transformation matrices
            let tileMat4 = {
                'top': (new THREE.Matrix4()).compose(
                    new THREE.Vector3(0, self.voxelHalf, 0),
                    (new THREE.Quaternion()).setFromEuler(new THREE.Euler(-Math.PI/2,0,0)),
                    new THREE.Vector3(1,1,1)
                ),
                'bottom': (new THREE.Matrix4()).compose(
                    new THREE.Vector3(0, -self.voxelHalf, 0),
                    (new THREE.Quaternion()).setFromEuler(new THREE.Euler(Math.PI/2,0,0)),
                    new THREE.Vector3(1,1,1)
                ),
                'left': (new THREE.Matrix4()).compose(
                    new THREE.Vector3(-self.voxelHalf, 0, 0),
                    (new THREE.Quaternion()).setFromEuler(new THREE.Euler(0,-Math.PI/2,0)),
                    new THREE.Vector3(1,1,1)
                ),
                'right': (new THREE.Matrix4()).compose(
                    new THREE.Vector3(self.voxelHalf, 0, 0),
                    (new THREE.Quaternion()).setFromEuler(new THREE.Euler(0,Math.PI/2,0)),
                    new THREE.Vector3(1,1,1)
                ),
                'far': (new THREE.Matrix4()).compose(
                    new THREE.Vector3(0, 0, self.voxelHalf),
                    (new THREE.Quaternion()).setFromEuler(new THREE.Euler(0,0,0)),
                    new THREE.Vector3(1,1,1)
                ),
                'near': (new THREE.Matrix4()).compose(
                    new THREE.Vector3(0, 0, -self.voxelHalf),
                    (new THREE.Quaternion()).setFromEuler(new THREE.Euler(0,Math.PI,0)),
                    new THREE.Vector3(1,1,1)
                ),
            }
    
            for (let i = 0; i < size; i++) {

                let matrix = new THREE.Matrix4();
                let xpos = i % worldWidth;
                let zpos = ~~(i / worldDepth);
                let ypos = self.getY(xpos, zpos, heightData, worldWidth);

                matrix.makeTranslation(
                    xpos * self.voxelSize - worldHalfWidth * self.voxelSize,
                    ypos * self.voxelSize,
                    zpos * self.voxelSize - worldHalfDepth * self.voxelSize
                );

                // get neighbor tiles heighdata
                let neighbors = self.getNeighbors( xpos, zpos, heightData, worldWidth, worldDepth );

                // push top plane
                if ( ypos > self.sandBlocks ) {
                    terrainMat4['grass'].push( (new THREE.Matrix4()).multiplyMatrices( matrix, tileMat4['top'] ) );
                } else {
                    terrainMat4['sand'].push( (new THREE.Matrix4()).multiplyMatrices( matrix, tileMat4['top'] ) );
                }

                // push top plane for water layer
                if ( ypos < self.seaLevel ) {
                    matrix.makeTranslation(
                        xpos * self.voxelSize - worldHalfWidth * self.voxelSize,
                        self.seaLevel * self.voxelSize,
                        zpos * self.voxelSize - worldHalfDepth * self.voxelSize
                    );
                    terrainMat4['water'].push( (new THREE.Matrix4()).multiplyMatrices( matrix, tileMat4['top'] ) );
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
                        if ( curHeight == ypos ) {
                            if ( curHeight > self.sandBlocks ) {
                                terrainMat4['grass'].push( (new THREE.Matrix4()).multiplyMatrices( matrix, tileMat4[direction] ) );
                            } else {
                                terrainMat4['sand'].push( (new THREE.Matrix4()).multiplyMatrices( matrix, tileMat4[direction] ) );
                            }
                        }

                        if ( curHeight < ypos ) {
                            if ( curHeight >= (ypos - self.dirtBlocks ) ) {
                                terrainMat4['dirt'].push( (new THREE.Matrix4()).multiplyMatrices( matrix, tileMat4[direction] ) );
                            } else {
                                terrainMat4['stone'].push( (new THREE.Matrix4()).multiplyMatrices( matrix, tileMat4[direction] ) );
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
                            terrainMat4['water'].push( (new THREE.Matrix4()).multiplyMatrices( matrix, tileMat4['left'] ) );
                        }

                        if ( zpos === 0 ) {
                            terrainMat4['water'].push( (new THREE.Matrix4()).multiplyMatrices( matrix, tileMat4['near'] ) );
                        }

                        if ( xpos === (worldWidth - 1) ) {
                            terrainMat4['water'].push( (new THREE.Matrix4()).multiplyMatrices( matrix, tileMat4['right'] ) );
                        }

                        if ( zpos === (worldDepth - 1) ) {
                            terrainMat4['water'].push( (new THREE.Matrix4()).multiplyMatrices( matrix, tileMat4['far'] ) );
                        }

                        curHeight--;
                    }
                    
                }
        
            }
            
            // build terrain meshes, using instancing
            for (let mat in terrainMat4) {

                if ( terrainMat4[mat].length !== 0 ) {

                    let mesh = new THREE.InstancedMesh( geometry, materials[mat], terrainMat4[mat].length);

                    for ( let j = 0; j < terrainMat4[mat].length; j++) {
                        mesh.setMatrixAt( j, terrainMat4[mat][j]);
                    }

                    mesh.castShadow = true;
                    mesh.receiveShadow = true;

                    self.terrain.add(mesh);
                }
            }

            // add vegetation if supplied
            if (self.vegetation !== null) {
                let vegetation = self.vegetation;
                let tree = new Tree(self.voxelSize);
                let flower = new Flower(self.voxelSize);
                let seaweed = new Grass(self.voxelSize, 'ocean');
                let grass = new Grass(self.voxelSize, 'land');

                for ( let i = 0, l = vegetation.tree.length; i < l; i++ ) {
                    let xpos = vegetation.tree[i].x;
                    let zpos = vegetation.tree[i].z;
                    let ypos = self.getY(xpos, zpos, heightData, worldWidth);
                    let obj = tree.getMesh();
                    obj.position.set(
                        xpos * self.voxelSize - worldHalfWidth * self.voxelSize,
                        ypos * self.voxelSize + self.voxelSize / 2,
                        zpos * self.voxelSize - worldHalfDepth * self.voxelSize
                    );
                    self.terrain.add( obj );
                }

                for ( let i = 0, l = vegetation.grass.length; i < l; i++ ) {
                    let xpos = vegetation.grass[i].x;
                    let zpos = vegetation.grass[i].z;
                    let ypos = self.getY(xpos, zpos, heightData, worldWidth);
                    if ( ypos < self.seaLevel) {
                        let obj = seaweed.getMesh();
                        obj.position.set(
                            xpos * self.voxelSize - worldHalfWidth * self.voxelSize,
                            ypos * self.voxelSize + self.voxelSize / 2,
                            zpos * self.voxelSize - worldHalfDepth * self.voxelSize
                        );
                        self.terrain.add( obj );
                    } else {
                        let obj = grass.getMesh();
                        obj.position.set(
                            xpos * self.voxelSize - worldHalfWidth * self.voxelSize,
                            ypos * self.voxelSize + self.voxelSize / 2,
                            zpos * self.voxelSize - worldHalfDepth * self.voxelSize
                        );
                        self.terrain.add( obj );
                    }
                }

                for ( let i = 0, l = vegetation.flower.length; i < l; i++ ) {
                    let xpos = vegetation.flower[i].x;
                    let zpos = vegetation.flower[i].z;
                    let ypos = self.getY(xpos, zpos, heightData, worldWidth);
                    let obj = flower.getMesh();
                    obj.position.set(
                        xpos * self.voxelSize - worldHalfWidth * self.voxelSize,
                        ypos * self.voxelSize + self.voxelSize / 2,
                        zpos * self.voxelSize - worldHalfDepth * self.voxelSize
                    );
                    self.terrain.add( obj );
                }

            }

            self.terrain.scale.set(
                1 / self.voxelSize * self.scale,
                1 / self.voxelSize * self.scale,
                1 / self.voxelSize * self.scale
            );
        });

    }

    getNeighbors ( x, z, heightData, worldWidth, worldDepth ) {
        let maxWidth = worldWidth - 1;
        let maxDepth = worldDepth - 1;
        let neighbors = {};

        // left
        if ( x === 0 ) {
            neighbors['left'] = 0;
        } else {
            neighbors['left'] = ( heightData[ (x - 1) + z * worldWidth ] ) | 0;
        }

        // right
        if ( x === maxWidth ) {
            neighbors['right'] = 0;
        } else {
            neighbors['right'] = ( heightData[ (x + 1) + z * worldWidth ] ) | 0;
        }

        // far
        if ( z === maxDepth ) {
            neighbors['far'] = 0;
        } else {
            neighbors['far'] = ( heightData[ x + (z + 1) * worldWidth ] ) | 0;
        }

        // near
        if ( z === maxWidth ) {
            neighbors['near'] = 0;
        } else {
            neighbors['near'] = ( heightData[ x + (z - 1) * worldWidth ] ) | 0;
        }

        return neighbors;
    }

    getY (x, z, heightData, worldWidth) {
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