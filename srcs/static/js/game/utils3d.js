function getRandomVectorDirection(max_x = 1, max_y = 0, max_z = 1) {
	let x, y, z, length;
  
	x = Math.random() * 2 - 1;
	while (Math.abs(x) > 0.3) {
	  x = Math.random() * 2 - 1;
	}
	y = Math.random() * 2 - 1;
	z = Math.random() * 2 - 1;
	length = Math.sqrt(x * x + y * y + z * z);
	return new THREE.Vector3(x * max_x / length, y * max_y / length, z * max_z / length);
  }

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}