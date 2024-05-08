const WINNING_SCORE = 5
const BALL_SPEED = 5
const BALL_RADIUS = 10
const BALL_COLOR = 'WHITE'
const GAME_WIDTH = 800
const GAME_HEIGHT = 600
const PADDLE_WIDTH = 10
const PADDLE_HEIGHT = 100
const PLAYER_SPEED = 10

class Ball {
    constructor(){
        this.resetPosition();
    }

    resetPosition() {
        this.xSpeed = BALL_SPEED;
        this.ySpeed = BALL_SPEED;
        this.speed = BALL_SPEED;
        this.x = GAME_WIDTH / 2;
        this.y = GAME_HEIGHT / 2;
    }

    move() {
        this.x += this.speed;
        this.y += this.speed;
    }

    bounce() {
        if (this.y + BALL_RADIUS > GAME_HEIGHT || this.y - BALL_RADIUS < 0) {
            this.ySpeed = -this.ySpeed;
        }
    }

    accelerate() {
        this.speed *= 1.02;
    }
}

class Player {
    constructor() {
        this.moveUp = false;
        this.moveDown = false;
        this.resetScore();
        this.resetPosition();
    }

    resetScore() {
        this.score = 0;
    }

    resetPosition() {
        this.x = 20;
        this.y = GAME_HEIGHT / 2 - 50;
    }

    move() {
        if (this.moveUp === true && this.y > 0) {
            this.y -= PLAYER_SPEED;
        } else if (this.moveDown === true && this.y < GAME_HEIGHT - PADDLE_HEIGHT) {
            this.y += PLAYER_SPEED;
        }
    }

    score() {
        this.score++;
    }
}

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

    score() {
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

class Game {
    constructor() {
        this.ball = new Ball();
        this.player = new Player();
        this.ai = new AI();
        this.gameOver = false;
    }

    loadGamePage() {
        var content = document.getElementById('content');

        if (content === null) {
            alertError('content is null');
            return ;
        }

        var canvas = document.createElement('canvas');
        canvas.id = 'game';

        document.getElementById('content').textContent = '';
        document.getElementById('content').appendChild(canvas);

        var content = document.getElementById('content');
        content.appendChild(canvas);
        this.init();
    }

    init() {
        this.canvas = document.getElementById('game');
        this.context = this.canvas.getContext('2d');
        this.canvas.width = GAME_WIDTH;
        this.canvas.height = GAME_HEIGHT;
        this.width = GAME_WIDTH;
        this.height = GAME_HEIGHT;
        this.boundReset = this.startNewGame.bind(this);
        this.startNewGame();
    }

    startNewGame() {
        this.reset();
        this.boundKeyPress = this.onKeyPress.bind(this);
        window.addEventListener('keydown', this.boundKeyPress);
        window.addEventListener('keyup', this.boundKeyPress);
        this.loop();
    }

    loop() {
        this.update();
        if (this.gameOver === true) {
            return ;
        }
        this.draw();
        window.requestAnimationFrame(this.loop.bind(this));
    }

    update() {
        this.ball.move();
        this.player.move();
        this.ball.updateDirection();

        let player = (this.ball.x < GAME_WIDTH / 2) ? this.player : this.ai;
        if (this.collision(this.ball, player)) {
            let collidePoint = this.ball.y - (player.y + PADDLE_HEIGHT / 2);
            collidePoint = collidePoint / (PADDLE_HEIGHT / 2);
            let angleRadius = (Math.PI / 4) * collidePoint;
            let direction = (this.ball.x < GAME_WIDTH / 2) ? 1 : -1;
            this.ball.xSpeed = direction * BALL_SPEED * Math.cos(angleRad);
            this.ball.ySpeed = direction * BALL_SPEED * Math.sin(angleRad);
            this.ball.accelerate();
        }

        if (this.ball.x - BALL_RADIUS < 0) {
            this.ai.score();
            this.goal();
        } else if (this.ball.x + BALL_RADIUS > GAME_WIDTH) {
            this.player.score();
            this.goal();
        }

        this.ai.move(this.ball, this.player);
    }

    collision(ball, player) {
        player.top = player.y;
        player.bottom = player.y + player.height;
        player.left = player.x;
        player.right = player.x + player.width;

        ball.top = ball.y - ball.radius;
        ball.bottom = ball.y + ball.radius;
        ball.left = ball.x - ball.radius;
        ball.right = ball.x + ball.radius;

        return (
            ball.right > player.left &&
            ball.top < player.bottom &&
            ball.left < player.right &&
            ball.bottom > player.top
        );
    } 

    draw() {
        this.context.fillStyle = 'BLACK';
        this.context.fillRect(0, 0, this.width, this.height);
        this.context.fillStyle = 'WHITE';
        this.context.font = '75px Arial';
        this.context.fillText(this.player.score, this.width / 4, this.height / 5);
        this.context.fillText(this.ai.score, 3 * this.width / 4, this.height / 5);
        this.context.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        this.context.fillRect(this.ai.x, this.ai.y, this.ai.width, this.ai.height);
        this.context.beginPath();
        this.context.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.context.fillStyle = this.ball.color;
        this.context.fill();
    }

    reset() {
        this.player.resetScore();
        this.player.resetPosition();
        this.ai.resetScore();
        this.ai.resetPosition();
        this.ball.resetPosition();
        this.canvas.removeEventListener('click', this.boundReset);
        this.gameOver = false;
    }

    checkIfOver() {
        if (this.ai.score >= 5) {
            this.endGame(this.ai);
        } else if (this.player.score >= 5) {
            this.endGame(this.player);
        }
    }

    endGame(winner) {
        this.context.fillStyle = 'BLACK';
        this.context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.context.textBaseline = 'middle';
        this.context.textAlign = 'center';
        this.context.fillStyle = 'WHITE';
        this.context.font = '40px Arial';

        if (winner === this.ai) {
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50);
        } else {
            this.ctx.fillText('YOU WIN', this.width / 2, this.height / 2 - 50);
        }

        this.ctx.fillText('Click to play again', this.width / 2, this.height / 2 + 50);
        window.removeEventListener('keydown', this.boundKeyPress);
        window.removeEventListener('keyup', this.boundKeyPress);
        this.canvas.addEventListener('click', this.boundReset);
        this.gameOver = true;
    }

    goal() {
        this.checkIfOver();
        this.player.resetPosition();
        this.ai.resetPosition();
        this.ball.resetPosition();
    }

    eventHandler(event) {
        if (event.type === 'keydown') {
            if (event.key === 'w' || event.key === 'W') {
                this.player.moveUp = true;
            }
            if (event.key === 's' || event.key === 'S') {
                this.player.moveDown = true;
            }
        } else if (event.type === 'keyup') {
            if (event.key === 'w' || event.key === 'W') {
                this.player.moveUp = false;
            }
            if (event.key === 's' || event.key === 'S') {
                this.player.moveDown = false;
            }
        }
    }
}