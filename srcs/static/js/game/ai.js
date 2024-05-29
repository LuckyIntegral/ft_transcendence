class AI {
    constructor() {
        this.resetScore();
        this.resetPosition();
    }

    resetScore() {
        this.score = 0;
    }

    resetPosition() {
        this.x = GameConstants.GAME_WIDTH - 30;
        this.y = GameConstants.GAME_HEIGHT / 2 - 50;
    }

    scoreGoal() {
        this.score++;
    }

    move(ball, player) {
        let optimalY = this.calculateOptimalY(ball, player);
        let dy = optimalY - this.y;

        if (Math.abs(dy) > GameConstants.PLAYER_SPEED) {
            dy = GameConstants.PLAYER_SPEED * Math.sign(dy);
        }

        let newY = this.y + dy;

        if (newY - GameConstants.PADDLE_PADDING < 0) {
            newY = 0 + GameConstants.PADDLE_PADDING;
        } else if (newY + GameConstants.PADDLE_HEIGHT + GameConstants.PADDLE_PADDING > GameConstants.GAME_HEIGHT) {
            newY = GameConstants.GAME_HEIGHT - GameConstants.PADDLE_HEIGHT - GameConstants.PADDLE_PADDING;
        }

        this.y = newY;
    }

    calculateOptimalY(ball, player) {
        let ballYWhenReachingAI = ball.y + ball.ySpeed * ((GameConstants.GAME_WIDTH - this.x) / ball.xSpeed);

        if (ball.xSpeed < 0) {
            return GameConstants.GAME_HEIGHT / 2 - GameConstants.PADDLE_HEIGHT / 2;
        }

        if (ballYWhenReachingAI > GameConstants.GAME_HEIGHT) {
            return GameConstants.GAME_HEIGHT - GameConstants.PADDLE_HEIGHT;
        } else if (ballYWhenReachingAI < 0) {
            return 0;
        }

    //    srcs/static/js/game/ai.js let playerYWhenBallReachesAI =
    //         player.y + GameConstants.PLAYER_SPEED * ((GameConstants.GAME_WIDTH - this.x) / ball.xSpeed);
    //     let optimalY =
    //         playerYWhenBallReachesAI < GameConstants.GAME_HEIGHT / 2
    //             ? GameConstants.GAME_HEIGHT - GameConstants.PADDLE_HEIGHT
    //             : 0;

    //     if (Math.abs(optimalY - ballYWhenReachingAI) <= GameConstants.PADDLE_HEIGHT / 2) {
    //         return optimalY;
    //     } else {
            return ballYWhenReachingAI - GameConstants.PADDLE_HEIGHT / 2;
        // 
    }
}
