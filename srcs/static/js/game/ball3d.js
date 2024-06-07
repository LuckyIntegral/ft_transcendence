class Ball3D {
  constructor (scene, sounds) {
	this.sounds = sounds;
	this.ball_geomethry = new THREE.SphereGeometry(0.03, 32, 32)	
	this.ball_material = new THREE.MeshStandardMaterial({ 
		color: 0xaa5500, 
		roughness: 0.5,
		metalness: 0.5})
	this.ball_mesh = new THREE.Mesh(this.ball_geomethry, this.ball_material)
	this.ball_mesh.castShadow = true;
	this.ball_speed_multiplier = 1.0;
	this.ball_height = GameConstants3D.BALL_HEIGHT;
	this.gravity = GameConstants3D.GRAVITY;
	this.ballOutsideTable = false;
	this.pause_time = 0.0;
	scene.add(this.ball_mesh);
    this.resetPosition();
  }

  resetPosition () {
	this.ball_mesh.position.x = 0
	this.ball_mesh.position.y = this.ball_height
	this.ball_mesh.position.z = 0 
	this.position = this.ball_mesh.position
	this.prevPosition = new THREE.Vector3()
	this.prevPosition.copy(this.position)
    this.speed = GameConstants3D.BALL_Y_SPEED * this.ball_speed_multiplier
	this.velocity = getRestrictedRandomVectorDirection()
	this.velocity.x *= GameConstants3D.BALL_Y_SPEED * this.ball_speed_multiplier / this.velocity.z 
	this.velocity.y *= 0.0	
	this.velocity.z = GameConstants3D.BALL_Y_SPEED * this.ball_speed_multiplier
	this.prevVelocity = new THREE.Vector3()
	this.prevVelocity.copy(this.velocity)
	this.ballOutsideTable = false;
	this.pause_time = GameConstants3D.BALL_PAUSE_TIME;
  }

  update_ball_mesh_position(position) {
	this.ball_mesh.position.x = position.x
	this.ball_mesh.position.y = position.y
	this.ball_mesh.position.z = position.z
  }

  move(dt) {
	this.position.x += this.velocity.x * dt
	this.position.y += this.velocity.y * dt
	this.position.z += this.velocity.z * dt
	this.update_ball_mesh_position(this.position)
  }

  bounceWalls(eff) {
	if (this.position.x > 1.0) 
	{
		this.position.x = 2.0 - this.position.x;
		this.velocity.x *= -1.0; 
		this.applyEffect(eff, 1.0, this.position.y, this.position.z);
	}
	else if (this.position.x < -1.0) 
	{
		this.position.x = -2.0 - this.position.x;
		this.velocity.x *= -1.0; 
		this.applyEffect(eff, -1.0, this.position.y, this.position.z);
	}
	else eff.effect_apply = false;
  }

  applyEffect(eff, posx, posy, posz) {
	eff.effect_apply = true;
	eff.position.x = posx;
	eff.position.y = posy;
	eff.position.z = posz;
	eff.scale.set(0.6, 0.6, 0.6);
	eff.timer = GameConstants3D.EFFECT_DURATION;
	eff.traverse((child) => {
		if (child.isMesh) {
			child.material.opacity = GameConstants3D.EFFECT_OPACITY;
		}
	});
	if (!this.sounds['force'].isPlaying)
		this.sounds['force'].play();
  }

  bounceGround(dt) {
	if (this.position.y <= GameConstants3D.BALL_RADIUS && 
		this.position.z < GameConstants3D.TABLE_MAX_DEPTH && 
		this.position.z > GameConstants3D.TABLE_MIN_DEPTH)
	{
		this.position.y = GameConstants3D.BALL_RADIUS;
		this.velocity.y = this.gravity * Math.sqrt(2 / this.gravity * this.ball_height);
		if (!this.sounds['ping'].isPlaying)
			this.sounds['ping'].play();	
	}
	else 
	{
		this.velocity.y -= 0.5 * this.gravity * dt ;
	}
  }

  calculateBallPosition(paddle) {
	let ball_dist = Math.abs(this.position.z - paddle.position.z)
	let time_to_reach = ball_dist / (GameConstants3D.BALL_Y_SPEED * this.ball_speed_multiplier);
	let ball_x = this.position.x + this.velocity.x * time_to_reach;
	let ball_x_diff = Math.abs(ball_x - paddle.position.x);
	return (ball_x_diff / (GameConstants3D.PADDLE_WIDTH / 2));
  }

  bouncePaddle(paddle){
		if (this.position.x < paddle.position.x + ((GameConstants3D.PADDLE_WIDTH / 2) * GameConstants3D.PADL_SCALE) &&
			this.position.x > paddle.position.x - ((GameConstants3D.PADDLE_WIDTH / 2) * GameConstants3D.PADL_SCALE))
		{
			if (!this.ballOutsideTable)
			{
				// ball reached player side
				if (Math.abs(this.position.z - paddle.position.z) < GameConstants3D.BALL_RADIUS) 
				{
					let offset_bias = (this.position.x  - paddle.position.x) / 
										(GameConstants3D.PADDLE_WIDTH / 2 * GameConstants3D.PADL_SCALE);
					this.velocity.x = Math.sign(offset_bias) * 
										clamp(GameConstants3D.BALL_X_MAX_SPEED_RATIO * GameConstants3D.BALL_Y_SPEED * this.ball_speed_multiplier *
											Math.sin(0.5 * Math.PI * offset_bias * offset_bias), 
										-GameConstants3D.BALL_X_MAX_SPEED_RATIO * GameConstants3D.BALL_Y_SPEED * this.ball_speed_multiplier,
										GameConstants3D.BALL_X_MAX_SPEED_RATIO * GameConstants3D.BALL_Y_SPEED * this.ball_speed_multiplier);
					let dir = paddle.position.z < 0.0 ? 1.0 : -1.0;
					this.velocity.z = dir * GameConstants3D.BALL_Y_SPEED * this.ball_speed_multiplier;
					let baspect = this.calculateBallPosition(paddle);
					paddle.paddlemesh.rotation.y = -Math.sign(offset_bias) *
												Math.PI / 4 * baspect * (1 - offset_bias * offset_bias);
					if (!this.sounds['pong'].isPlaying)
						this.sounds['pong'].play();
				}
			}
		}
		else {
			if (this.position.z < GameConstants3D.TABLE_MIN_DEPTH || 
				this.position.z > GameConstants3D.TABLE_MAX_DEPTH)
			{
				this.ballOutsideTable = true;
			}

		}
  }

  update_client(dt, eff) {
	this.velocity.x = (this.position.x - this.prevPosition.x) / dt;
	this.velocity.y = (this.position.y - this.prevPosition.y) / dt;
	this.velocity.z = (this.position.z - this.prevPosition.z) / dt;	
	if (this.velocity.x > 0.0 && this.prevVelocity.x < 0.0 && 
		!((this.velocity.z > 0.0 && this.prevVelocity.z < 0.0) || (this.velocity.z < 0.0 && this.prevVelocity.z > 0.0))){
		this.applyEffect(eff, -1.0, (this.position.y + this.prevPosition.y) / 2, (this.position.z + this.prevPosition.z) / 2);	
	}
	if (this.velocity.x < 0.0 && this.prevVelocity.x > 0.0 &&	
		!((this.velocity.z > 0.0 && this.prevVelocity.z < 0.0) || (this.velocity.z < 0.0 && this.prevVelocity.z > 0.0))){
		this.applyEffect(eff, 1.0, (this.position.y + this.prevPosition.y) / 2, (this.position.z + this.prevPosition.z) / 2);	
	}
	if (this.velocity.y > 0.0 && this.prevVelocity.y < 0.0)	{
		if (!this.sounds['ping'].isPlaying)
			this.sounds['ping'].play();	
	}
	if ((this.velocity.z > 0.0 && this.prevVelocity.z < 0.0) || (this.velocity.z < 0.0 && this.prevVelocity.z > 0.0))	{
		if (!this.sounds['pong'].isPlaying)
			this.sounds['pong'].play();
	}
	this.prevVelocity.copy(this.velocity);
  }

  update(dt, paddles, eff) {
	if (this.pause_time > 0.0)
	{
		this.pause_time -= dt;
		return;
	}
	this.pause_time = 0.0;
	this.move(dt);
	this.bounceGround(dt);
	this.bounceWalls(eff);
	paddles.forEach(function (paddle) {
		this.bouncePaddle(paddle);
	}.bind(this));
  }

//   accelerate () {
//     this.speed *= GameConstants.BALL_ACCELERATION_RATE
//   }
}
