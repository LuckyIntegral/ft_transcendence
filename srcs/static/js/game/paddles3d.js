class Paddle3D {
	//player is either 'player1' for the main player or 'player2' for the AI/player2
	constructor (player, paddle_mesh) {
		this.player = player
		this.paddlemesh = paddle_mesh;
		this.resetPosition(player);
		this.position.x = this.paddlemesh.position.x;
		this.position.y = this.paddlemesh.position.y;
		this.position.z = this.paddlemesh.position.z;
		this.speed = GameConstants3D.PADDLE_SPEED;
		this.velocity = new THREE.Vector3(0.0, 0.0, 0.0);
	}
  
	resetPosition (player) {
		if (player === 'player1'){
			this.paddlemesh.position.x = 0.0;
			this.paddlemesh.position.y = 0.2;
			this.paddlemesh.position.z = GameConstants3D.TABLE_MAX_DEPTH;
		}
		else {
			this.paddlemesh.position.x = 0.0;
			this.paddlemesh.position.y = 0.2;
			this.paddlemesh.position.z = GameConstants3D.TABLE_MIN_DEPTH;
			this.paddlemesh.rotation.y = Math.PI;
		}
		this.position = this.paddlemesh.position;
		// console.log('Paddle3D: player, resetPosition: position:', player, this.position);
	}

	outOfBounds(pos, max, min)
	{
		if (pos > max || pos < min) 
			return true;
		return false
	}

	move(dt) {
		if (!this.outOfBounds(this.position.x + this.velocity.x * dt, 
			GameConstants3D.PADL_H_RANGE, -GameConstants3D.PADL_H_RANGE))
			this.position.x += this.velocity.x * dt;
		if (!this.outOfBounds(this.position.y + this.velocity.y * dt, 
			GameConstants3D.PADL_V_RANGE, 0.0))
			this.position.y += this.velocity.y * dt;
		this.position.z += this.velocity.z * dt;
		this.paddlemesh.position.x = this.position.x;
		this.paddlemesh.position.y = this.position.y;
		this.paddlemesh.position.z = this.position.z;
	}

	update_controls(keystate) {
		(keystate['w'] || keystate['W'])? this.velocity.y = this.speed : this.velocity.y = 0;
		(keystate['s'] || keystate['S'])? this.velocity.y += -this.speed : this.velocity.y += 0;
		(keystate['a'] || keystate['A'])? this.velocity.x = -this.speed : this.velocity.x = 0;
		(keystate['d'] || keystate['D'])? this.velocity.x += this.speed : this.velocity.x += 0;
	}

	update(dt, keystate) {
		this.update_controls(keystate);
		this.move(dt);
	}
}
