class AI3D {

    constructor(paddle) {
		this.player = 'player2';
		this.paddle = paddle;
		this.position = paddle.position;
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
        let optimalX = this.calculateOptimalX(ball);
        let dx = optimalX - this.position.x;

        if (Math.abs(dx) > GameConstants3D.PADDLE_SPEED * dt) {
            dx = GameConstants3D.PADDLE_SPEED * dt * Math.sign(dx);
        }

        let newX = this.x + dx;

        if (newX < -GameConstants3D.TABLE_HALF_WIDTH) {
            newX = -GameConstants3D.TABLE_HALF_WIDTH;
        } else if (newX > GameConstants3D.TABLE_HALF_WIDTH) {
            newX = GameConstants3D.TABLE_HALF_WIDTH;
        }
        this.position.x = ball.position.x; //newX;
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
        let ballXWhenReachingAI = ball.position.x + ball.velocity.x * 
			(Math.abs(GameConstants3D.TABLE_MIN_DEPTH - this.position.z) / ball.velocity.z);

        if (ball.velocity.z < 0) {
            return 0.0;
        }

        if (ballXWhenReachingAI > GameConstants3D.TABLE_HALF_WIDTH) {
            return GameConstants3D.TABLE_HALF_WIDTH;
        } else if (ballXWhenReachingAI < -GameConstants3D.TABLE_HALF_WIDTH) {
            return -GameConstants3D.TABLE_HALF_WIDTH;
        }
        return ballXWhenReachingAI;
    }
}
