class AI {
    constructor() {
        this.resetScore();
        this.resetPosition();
    }

    resetScore() {
        this.score = 0;
    }

    resetPosition() {
        this.x = GAME_WIDTH - 30;
        this.y = GAME_HEIGHT / 2 - 50;
    }

    scoreGoal() {
        this.score++;
    }

    move(ball, player) {
        let optimalY = this.calculateOptimalY(ball, player);
        let dy = optimalY - this.y;
        this.y += dy * 0.09;
    }

    calculateOptimalY(ball, player) {
        let ballYWhenReachingAI = ball.y + ball.ySpeed * ((GAME_WIDTH - this.x) / ball.xSpeed);

        if (ball.xSpeed < 0) {
            return GAME_HEIGHT / 2;
        }

        if (ballYWhenReachingAI > GAME_HEIGHT) {
            return GAME_HEIGHT - PADDLE_HEIGHT;
        } else if (ballYWhenReachingAI < 0) {
            return 0;
        }

        let playerYWhenBallReachesAI = player.y + PLAYER_SPEED * ((GAME_WIDTH - this.x) / ball.xSpeed);
        let optimalY = (playerYWhenBallReachesAI < GAME_HEIGHT / 2) ? GAME_HEIGHT - PADDLE_HEIGHT : 0;

        if (Math.abs(optimalY - ballYWhenReachingAI) <= PADDLE_HEIGHT / 2) {
            return optimalY;
        } else {
            return ballYWhenReachingAI - PADDLE_HEIGHT / 2;
        }
    }
}