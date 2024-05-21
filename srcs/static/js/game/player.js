class Player {
    constructor(position) {
        this.lobby = new Lobby();
        this.position = position;
        this.moveUp = false;
        this.moveDown = false;
        this.resetScore();
        this.resetPosition();
    }

    resetScore() {
        this.score = 0;
    }

    resetPosition() {
        this.x = this.position.x;
        this.y = this.position.y;
    }

    move() {
        if (this.moveUp === true && this.y > 0 + GameConstants.PADDLE_PADDING) {
            this.y -= GameConstants.PLAYER_SPEED;
        } else if (
            this.moveDown === true &&
            this.y < GameConstants.GAME_HEIGHT - GameConstants.PADDLE_HEIGHT - GameConstants.PADDLE_PADDING
        ) {
            this.y += GameConstants.PLAYER_SPEED;
        }
    }

    scoreGoal() {
        this.score++;
    }
}
