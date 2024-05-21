class AI3D {

    constructor() {
        this.resetScore();
        this.resetPosition();
    }

    resetScore() {
        this.score = 0;
    }

    resetPosition() {
        this.position.x = 0.0; 
        this.position.y = 0.0;
		this.position.z = GameConstants3D.TABLE_MAX_DEPTH;
    }

    scoreGoal() {
        this.score++;
    }

    move(ball, player, dt) {
        let optimalX = this.calculateOptimalX(ball, player);
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
        this.position.x = newX;
    }

    calculateOptimalX(ball, player) {
        let ballXWhenReachingAI = ball.position.x + ball.velocity.x * ((GameConstants3D.TABLE_MAX_DEPTH - this.position.z) / ball.velocity.z);

        if (ball.velocity.z < 0) {
            return 0.0;
        }

        if (ballXWhenReachingAI > GameConstants3D.TABLE_HALF_WIDTH) {
            return GameConstants3D.TABLE_HALF_WIDTH;
        } else if (ballXWhenReachingAI < -GameConstants3D.TABLE_HALF_WIDTH) {
            return -GameConstants3D.TABLE_HALF_WIDTH;
        }

        let playerXWhenBallReachesAI =
            player.paddle.position.x + GameConstants3D.PADDLE_SPEED * ((GameConstants3D.TABLE_MAX_DEPTH - this.position.z) / ball.velocity.z);

        let optimalX =
            playerXWhenBallReachesAI < 0.0 
                ? GameConstants3D.TABLE_HALF_WIDTH
                : -GameConstants3D.TABLE_HALF_WIDTH;

        if (Math.abs(optimalX - ballXWhenReachingAI) <= GameConstants3D.PADDLE_WIDTH / 2) {
            return optimalY;
        } else {
            return ballXWhenReachingAI - GameConstants3D.PADDLE_WIDTH / 2;
        }
    }
}
