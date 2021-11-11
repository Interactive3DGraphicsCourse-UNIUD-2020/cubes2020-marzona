import * as THREE from '../three/build/three.module.js';
import { randPositionOverSphere, colorGradient } from './Helpers.js'

export class Flame {

    constructor( scale = 1.0, particleLayer = 1 ) {

        this.isLit = false;
        this.stopSignal = false;
        this.width = 1.0 * scale;
        this.height = 3.0 * scale;
        this.scale = scale;

        this.particleSize = this.width * 4 / 5;
        this.particleNumber = 50;
        this.particleActive = 0;
        this.particleLayer = particleLayer; // this is used to obtain a selective bloom effect
        this.particleCenter = new THREE.Vector3( 0, this.width / 2, 0 );
        this.geometry = new THREE.BoxBufferGeometry( this.particleSize, this.particleSize, this.particleSize );
        this.spawnTimer = 0;
        this.spawnRate = 0.1; // seconds. Time between particle spawns
        this.linearSpeed = 2.0 * scale; // units / s, this has to be set up according to scale value
        this.rotationalSpeed = 0.8; // radians / s

        this.color1 = new THREE.Color(1.0,0.0,0.0);
        this.color2 = new THREE.Color(1.0,0.3,0.0);

        this.mesh = new THREE.Object3D();
        this.particleSystem = new THREE.Object3D();

        // pointLight setup
        this.pointLight = new THREE.PointLight( 0xffffff );
        this.pointLight.decay = 2; // set to 2 to have a pysics-based decay effect
        this.pointLight.distance = this.width * 32;
        this.pointLight.intensity = 0;
        this.pointLight.position.set( 
            this.particleCenter.x,
            this.particleCenter.y,
            this.particleCenter.z
        );

        // shadow camera properties
        this.pointLight.castShadow = true;
        this.pointLight.shadow.bias = -0.0045;
        this.pointLight.shadow.mapSize.width = 512;
        this.pointLight.shadow.mapSize.height = 512;

        // pointLight animation properties
        this.pointLightMinIntensity = 0.5;
        this.pointLightEaseIn = self.pointLightMinIntensity / (self.spawnRate * self.particleNumber); // not used
        this.pointLightFadeOut = self.pointLightMinIntensity / (self.height / self.linearSpeed); // not used
        this.pointLightTimer = 0;
        this.pointLightOscillationFrequency = 1; // expressed in Hz

        // pre-allocate particles
        this.particles = [];
        for( let i = 0; i < this.particleNumber; i++) {
            let particle = new THREE.Mesh( this.geometry, new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0.0
            }));
            particle.layers.enable( this.particleLayer );
            this.particles.push(particle);
        }

        this.mesh.add(this.particleSystem);
        this.mesh.add(this.pointLight);
        
    }

    start() {
        let self = this;
        self.isLit = true;
        self.pointLight.intensity = self.pointLightMinIntensity;
    }

    stop() {
        let self = this;
        self.stopSignal = true;

    }

    getMesh() {
        let self = this;
        return self.mesh;
    }

    animate(time) {
        let self = this;
        
        if ( self.stopSignal == true ) {
            self.isLit = false;
            self.stopSignal = false;
            self.pointLight.intensity = 0;

            // remove particles
            for ( let i = 0; i < self.particleActive; i++ ) {
                self.particleSystem.remove(self.particles[i]);
            }
            // reset counters
            self.spawnTimer = 0;
            self.particleActive = 0;
            self.pointLightTimer = 0;
        }

        if (self.isLit) {
            self.spawnTimer += time;

            // oscillate pointLight intensity
            self.pointLight.intensity = self.pointLightMinIntensity + (((Math.sin(self.pointLightTimer * self.pointLightOscillationFrequency * Math.PI) + 1)/2) * (1.0 - self.pointLightMinIntensity));
            self.pointLightTimer += time;

            for ( let child of self.particleSystem.children ) {
                child.rotateX( self.rotationalSpeed * time );
                child.rotateY( self.rotationalSpeed * time );

                // Update position, if out of bounds reset
                child.position.add( ( new THREE.Vector3(0.0,1.0,0.0) ).multiplyScalar( time * self.linearSpeed ) );
                if ( child.position.y > self.height - (Math.sqrt(Math.pow(child.position.x,2)+Math.pow(child.position.z,2))*3) ) {
                    let newPosition = randPositionOverSphere( self.width, self.particleCenter );
    
                    child.position.set(
                        newPosition.x,
                        newPosition.y,
                        newPosition.z
                    );
                }

                let particleScale = 1.0 - THREE.Math.mapLinear(child.position.y, 0.0, self.height, 0.0, 1.0);
                child.scale.set(
                    particleScale,
                    particleScale,
                    particleScale
                );
                child.material.opacity = 1.0;
                child.material.color = colorGradient(self.color1,self.color2,particleScale);

            }

            // spawn a particle
            if ( self.particleActive != self.particleNumber ) {

                if ( self.spawnTimer >= self.spawnRate ) {

                    self.particles[self.particleActive].material.opacity = 0.0;
                    self.particles[self.particleActive].position.set(
                        0,
                        Infinity, // this might be a bad idea
                        0
                    );

                    self.particleSystem.add(self.particles[self.particleActive]);

                    self.particleActive += 1;
                    self.spawnTimer = 0;

                }

            }
 
        }

    }

}