function getRestrictedRandomVectorDirection(max_x = 1, max_z = 1) {
    let theta, x, z;

    theta = Math.random() * 2 * (Math.PI / 6) + 2 * Math.PI / 6;
    x = Math.cos(theta);
    z = Math.sin(theta);

    return new THREE.Vector3(x * max_x, 0, z * max_z);
}


function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}