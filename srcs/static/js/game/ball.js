class Ball {
    constructor() {
        this.resetPosition();
    }

    resetPosition() {
        const d = new Date();
        let ms = d.getMilliseconds();

        if (ms > 500) {
            this.xSpeed = GameConstants.BALL_SPEED;
        } else {
            this.xSpeed = -GameConstants.BALL_SPEED;
        }
        this.ySpeed = (ms % 10) - 5;
        this.speed = GameConstants.BALL_BASE_ACCELERATION;
        this.x = GameConstants.GAME_WIDTH / 2;
        this.y = GameConstants.GAME_HEIGHT / 2;
    }

    move() {
        this.x += this.xSpeed;
        this.y += this.ySpeed;
    }

    bounce() {
        if (this.y + GameConstants.BALL_RADIUS * 2 > GameConstants.GAME_HEIGHT) {
            this.ySpeed = -this.ySpeed;
            this.y = GameConstants.GAME_HEIGHT - GameConstants.BALL_RADIUS * 2;
        } else if (this.y - GameConstants.BALL_RADIUS * 2 < 0) {
            this.ySpeed = -this.ySpeed;
            this.y = GameConstants.BALL_RADIUS * 2;
        }
    }

    accelerate() {
        this.speed *= GameConstants.BALL_ACCELERATION_RATE;
    }
}
