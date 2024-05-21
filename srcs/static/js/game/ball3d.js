class Ball3D {
  constructor (scene) {
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
    this.speed = GameConstants3D.BALL_SPEED
	this.velocity = getRandomVectorDirection()
	this.velocity.x *= this.speed
	this.velocity.y *= this.speed	
	this.velocity.z *= this.speed
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
	if (this.position.x > 1.0 || this.position.x < -1.0) 
		this.velocity.x *= -1.0; 
  }

  bounceGround(dt) {
	if (this.position.y <= GameConstants3D.BALL_RADIUS && 
		this.position.z < GameConstants3D.TABLE_MAX_DEPTH && 
		this.position.z > GameConstants3D.TABLE_MIN_DEPTH)
	{
		this.position.y = GameConstants3D.BALL_RADIUS;
		this.velocity.y = this.gravity * Math.sqrt(2 / this.gravity * this.ball_height);
		//playSound();
	}
	else 
	{
		this.velocity.y -= 0.5 * this.gravity * dt ;
	}
  }

  bouncePaddle(paddle){
		if (this.position.x < paddle.position.x + (GameConstants3D.PADDLE_WIDTH / 2) &&
			this.position.x > paddle.position.x - (GameConstants3D.PADDLE_WIDTH / 2))
		{
			if (!this.ballOutsideTable)
			{
				if ((this.velocity.z < 0.0) && (paddle.position.z < 0.0) && 
					(this.position.z - GameConstants3D.BALL_RADIUS < paddle.position.z))
				{
					this.velocity.z *= -1.0;
				} 
				if ((this.velocity.z > 0.0) && (paddle.position.z > 0.0) && 
					(this.position.z + GameConstants3D.BALL_RADIUS > paddle.position.z))
				{
					this.velocity.z *= -1.0;
				}
				// if ((paddle.position.z < 0.0) && (this.position.z < paddle.position.z) || 
				// 	(paddle.position.z > 0.0) && (this.position.z > paddle.position.z))
				// {
				// 	let offset_bias = (this.positiont  - paddle.position.x) / 
				// 						(GameConstants3D.PADDLE_WIDTH / 2);
				// 	this.velocity.x = Math.sin(0.5 * Math.PI * offset_bias) * this.speed;
				// 	let dir = paddle.position.z < 0.0 ? 1.0 : -1.0;
				// 	this.velocity.z = dir * Math.cos(0.5 * Math.PI * offset_bias) * this.speed;
				// }
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
