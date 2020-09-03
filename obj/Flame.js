import * as THREE from 'https://unpkg.com/three@0.120.0/build/three.module.js';
export class Flame {

    constructor( width, particleLayer = 0, height = 3 * width, spawnRate = 0.01, linearSpeed = 3.0, rotationalSpeed = 0.8, isLit = false ) {

        this.isLit = isLit;
        this.width = width;
        this.height = height;

        this.particleSize = this.width * 4 / 5;
        this.particleNumber = 50;
        this.particleActive = 0;
        this.particleLayer = particleLayer;
        this.particleCenter = new THREE.Vector3(0,this.width/2,0);
        this.spawnRate = spawnRate; // seconds
        this.linearSpeed = linearSpeed; // units/sec
        this.rotationalSpeed = rotationalSpeed; // radians/sec
        this.geometry = new THREE.BoxBufferGeometry( this.particleSize,this.particleSize,this.particleSize );
        this.spawnTimer = 0;

        this.color1 = new THREE.Color(1.0,0.0,0.0); 
        this.color2 = new THREE.Color(1.0,0.3,0.0);

        this.mesh = new THREE.Object3D();
        this.particleSystem = new THREE.Object3D();

        // light setup
        this.light = new THREE.PointLight( 0xffffff );
        this.light.decay = 2;
        this.light.distance = this.width * 16;
        this.light.intensity = 0.0;
        this.light.position.set( 
            this.particleCenter.x,
            this.particleCenter.y,
            this.particleCenter.z
        );
        this.mesh.add(this.particleSystem);
        this.mesh.add(this.light);
        
    }

    randPositionOverSphere( width, center = new THREE.Vector3(0,0,0) ) {
        let point;
        let x,y,z;
        while (true) {
            x = THREE.Math.randFloat( -width / 2.0, width / 2.0 );
            y = THREE.Math.randFloat( -width / 2.0, width / 2.0 );
            z = THREE.Math.randFloat( -width / 2.0, width / 2.0 );

            if ( Math.sqrt( (x*x) + (y*y) + (z*z) ) < 1) break;
        }

        point = new THREE.Vector3(x,y,z);
        return point.add(center);
    }

    // This uses RGB colors in [0.0 1.0] range
    colorGradient( color1, color2, alpha ) {
        let r,g,b;
        let colorPick;

        r = (color1.r * (alpha) + color2.r * ( 1 - alpha ) );
        g = (color1.g * (alpha) + color2.g * ( 1 - alpha ) );
        b = (color1.b * (alpha) + color2.b * ( 1 - alpha ) );

        colorPick = new THREE.Color( r,g,b );
        return colorPick;

    }

    start() {

        this.isLit = true;
        this.light.intensity = 1.0;
    }

    stop() {  

        this.isLit = false;

        // dispose of particles
        this.particleSystem.traverse( function (child) {
            if (child != undefined) {
                child.geometry.dispose();
                child.material.dispose();
            }
        });

        // reset counters
        this.spawnTimer = 0;
        this.particleActive = 0;

        // and turn light off
        this.light.intensity = 0.0;

    }

    getMesh() {
        return this.mesh;
    }

    animate(time) {

        if (this.isLit) {
            this.spawnTimer += time;

            for ( let child of this.particleSystem.children ) {
                child.rotateX( this.rotationalSpeed * time );
                child.rotateY( this.rotationalSpeed * time );

                // Update position, if out of bounds reset
                child.position.add( (new THREE.Vector3(0.0,1.0,0.0)).multiplyScalar( time * this.linearSpeed ) );
                if ( child.position.y > this.height - (Math.sqrt(Math.pow(child.position.x,2)+Math.pow(child.position.z,2))*3) ) {
                    let newPosition = this.randPositionOverSphere( this.width, this.particleCenter );
    
                    child.position.set(
                        newPosition.x,
                        newPosition.y,
                        newPosition.z
                    );
                }

                let particleScale = 1.0 - THREE.Math.mapLinear(child.position.y, 0.0, this.height, 0.0, 1.0);
                child.scale.set(
                    particleScale,
                    particleScale,
                    particleScale
                );
                child.material.opacity = 1.0;
                child.material.color = this.colorGradient(this.color1,this.color2,particleScale);

            }

            if ( this.spawnTimer >= this.spawnRate ) {

                if ( this.particleActive != this.particleNumber ) {

                    let particle = new THREE.Mesh( this.geometry, new THREE.MeshBasicMaterial({
                        transparent: true,
                        opacity: 0.0
                    }));
        
                    particle.position.set(
                        0,
                        this.height + 1.0,
                        0
                    );

                    particle.layers.enable( this.particleLayer );
                    this.particleSystem.add(particle);

                    this.particleActive += 1;

                }

                this.spawnTimer = 0;

            }
 
        }

    }

}