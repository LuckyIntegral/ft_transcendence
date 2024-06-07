class AI3D {

    constructor(paddle, mode, ball) {
		this.player = 'player2';
        this.ai_mode = mode;
		this.paddle = paddle;
        this.error_offset = 0.0;
		this.ball_speed = 1.0;
		this.update_time = 0.0;
		this.position = paddle.position;
        this.target = new THREE.Vector3(paddle.position.x, paddle.position.y, paddle.position.z);
		if (mode == 'easy') {
			this.update_freq= 1.8;
			this.ball_speed = 1.0;
			this.error_offset = GameConstants3D.PADDLE_WIDTH * 0.8;
			this.act_distance = - GameConstants3D.TABLE_MAX_DEPTH * 0.55;
		}
		else if (mode == 'hard') {
			this.update_freq= 0.5;
			this.ball_speed = 1.2;
			this.error_offset = GameConstants3D.PADDLE_WIDTH * 0.78;
			this.act_distance = - GameConstants3D.TABLE_MAX_DEPTH * 0.3;
		}
		else {
			this.update_freq= 0.2;
			this.ball_speed = 1.5;
			this.error_offset = GameConstants3D.PADDLE_WIDTH * 0.0;
			this.act_distance = GameConstants3D.TABLE_MAX_DEPTH;
		}
		ball.ball_speed_multiplier = this.ball_speed;
        this.resetScore();
        this.resetPosition();
    }

    resetScore() {
        this.score = 0;
    }

    resetPosition() {
        this.position.x = 0.0; 
        this.position.y = 0.2;
		this.position.z = GameConstants3D.TABLE_MIN_DEPTH;
		this.setPaddlePos();
    }

	setPaddlePos() {
		this.paddle.position.x = this.position.x;
		this.paddle.position.y = this.position.y;
		this.paddle.position.z = this.position.z;
		this.paddle.paddlemesh.position.x = this.position.x;
		this.paddle.paddlemesh.position.y = this.position.y;
		this.paddle.paddlemesh.position.z = this.position.z;
	}

	resetPaddles() {
		this.paddle.resetPosition(this.player);
		this.position = this.paddle.position;
	}

    scoreGoal() {
        this.score++;
    }

	update(ball, dt) {
		this.move(ball, dt);
		this.setPaddlePos();
	}

    move(ball, dt) {
        this.update_time += dt;
		if (this.update_time > this.update_freq)
		{
			this.target.x = this.calculateOptimalX(ball);
			this.target.x = this.target.x + this.error_offset * (2 * Math.random() - 1.0);
			this.update_time = 0.0;
		}
		// horizontal movement
		if (Math.abs(this.target.x - this.position.x) > GameConstants3D.ERROR_RANGE &&
			ball.position.z < this.act_distance) {
			if (this.position.x < this.target.x) {
				this.position.x += this.paddle.speed * dt;
			}
			else if (this.position.x > this.target.x) {
				this.position.x -= this.paddle.speed * dt;
			}
		}

		// vertical movement
		let ball_dist = Math.abs(ball.position.z - this.position.z)
		let ball_dist_aspect = ball_dist / GameConstants3D.PADDLE_DIST_TO_BALL;
		if (ball_dist <  GameConstants3D.PADDLE_DIST_TO_BALL){
			this.position.y = GameConstants3D.PADDLE_YPOS * ball_dist_aspect + 
							(1 - ball_dist_aspect) * ball.position.y;
		}
		this.paddle.paddlemesh.position.x = this.position.x;
		this.paddle.paddlemesh.position.y = this.position.y;
		this.paddle.paddlemesh.position.z = this.position.z;
		if (Math.abs(this.paddle.paddlemesh.rotation.y) >= 0.001)
			this.paddle.paddlemesh.rotation.y += -Math.sign(this.paddle.paddlemesh.rotation.y) * dt;
		else
			this.paddle.paddlemesh.rotation.y = 0.0;
    }

    calculateOptimalX(ball) {
        let sign = Math.sign(ball.velocity.x);
		if (ball.velocity.z < 0) {
			let timeToReachPaddle = Math.abs((this.paddle.paddlemesh.position.z - ball.position.z) / ball.velocity.z);
			let fbp = ball.position.x + ball.velocity.x * timeToReachPaddle;
			while(Math.abs(fbp) > GameConstants3D.TABLE_HALF_WIDTH) {
				fbp = sign * GameConstants3D.TABLE_HALF_WIDTH - (fbp - sign * GameConstants3D.TABLE_HALF_WIDTH);
				sign = -sign;
			}
			return fbp;
		}
		else {
			if (this.ai_mode == 'hard') {
				return 0.0;
			}
        }
    }
}
