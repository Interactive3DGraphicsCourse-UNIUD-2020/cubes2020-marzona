import * as THREE from 'https://unpkg.com/three@0.120.0/build/three.module.js';

function randInt( min, max ) {
    return ~~((Math.random() * (max - min + 1)) + min);
}

function randArray (list) {
    return list[Math.floor((Math.random()*list.length))];
}

// uses RGB colors in [0.0 1.0] range
function colorGradient( color1, color2, alpha ) {
    let r,g,b;
    let colorPick;

    r = (color1.r * (alpha) + color2.r * ( 1 - alpha ) );
    g = (color1.g * (alpha) + color2.g * ( 1 - alpha ) );
    b = (color1.b * (alpha) + color2.b * ( 1 - alpha ) );

    colorPick = new THREE.Color( r,g,b );
    return colorPick;

}

function randPositionOverSphere( width, center = new THREE.Vector3( 0, 0, 0 ) ) {
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

export { randInt, randArray, colorGradient, randPositionOverSphere };