class Ball3D {
  constructor (scene, sounds) {
	this.sounds = sounds;
	this.ball_geomethry = new THREE.SphereGeometry(0.03, 32, 32)	
	this.ball_material = new THREE.MeshStandardMaterial({ 
		color: 0xffff00, 
		roughness: 0.5,
		metalness: 0.5})
	this.ball_mesh = new THREE.Mesh(this.ball_geomethry, this.ball_material)
	this.ball_mesh.castShadow = true;
	this.ball_height = GameConstants3D.BALL_HEIGHT;
	this.gravity = GameConstants3D.GRAVITY;
	this.ballOutsideTable = false;
	scene.add(this.ball_mesh);
    this.resetPosition();
  }

  resetPosition () {
	this.ball_mesh.position.x = 0
	this.ball_mesh.position.y = this.ball_height
	this.ball_mesh.position.z = 0 
	this.position = this.ball_mesh.position
    this.speed = GameConstants3D.BALL_Y_SPEED
	this.velocity = getRandomVectorDirection()
	this.velocity.x *= GameConstants3D.BALL_Y_SPEED / this.velocity.z 
	this.velocity.y *= 0.0	
	this.velocity.z = GameConstants3D.BALL_Y_SPEED
	this.ballOutsideTable = false;
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

  bounceWalls() {
	if (this.position.x > 1.0) 
	{
		this.position.x = 1.0;
		this.velocity.x *= -1.0; 
	}
	if (this.position.x < -1.0) 
	{
		this.position.x = -1.0;
		this.velocity.x *= -1.0; 
	}
  }

  bounceGround(dt) {
	if (this.position.y <= GameConstants3D.BALL_RADIUS && 
		this.position.z < GameConstants3D.TABLE_MAX_DEPTH && 
		this.position.z > GameConstants3D.TABLE_MIN_DEPTH)
	{
		this.position.y = GameConstants3D.BALL_RADIUS;
		this.velocity.y = this.gravity * Math.sqrt(2 / this.gravity * this.ball_height);
		this.sounds[0].play();	
	}
	else 
	{
		this.velocity.y -= 0.5 * this.gravity * dt ;
	}
  }

  calculateBallPosition(paddle) {
	let ball_dist = Math.abs(this.position.z - paddle.position.z)
	let time_to_reach = ball_dist / GameConstants3D.BALL_Y_SPEED;
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
										clamp(GameConstants3D.BALL_Y_SPEED / Math.cos(0.5 * Math.PI * offset_bias), 
										-4 * GameConstants3D.BALL_Y_SPEED,
										 4 * GameConstants3D.BALL_Y_SPEED);
					let dir = paddle.position.z < 0.0 ? 1.0 : -1.0;
					this.velocity.z = dir * GameConstants3D.BALL_Y_SPEED;

					let baspect = this.calculateBallPosition(paddle);
					paddle.paddlemesh.rotation.y = -Math.sign(offset_bias) *
												Math.PI / 4 * baspect * (1 - offset_bias);
					this.sounds[1].play();
				}
			}
		}
		else {
			if (this.position.z < GameConstants3D.TABLE_MIN_DEPTH || 
				this.position.z > GameConstants3D.TABLE_MAX_DEPTH)
				this.ballOutsideTable = true;
		}
  }

  update(dt, paddles) {
	this.move(dt);
	this.bounceGround(dt);
	this.bounceWalls();
	paddles.forEach(function (paddle) {
		this.bouncePaddle(paddle);
	}.bind(this));
  }

//   accelerate () {
//     this.speed *= GameConstants.BALL_ACCELERATION_RATE
//   }
}
