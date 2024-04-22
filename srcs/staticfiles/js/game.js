var Game = {
    init: function() {
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.gameOver = false;
        this.boundReset = this.startNewGame.bind(this);
        this.startNewGame();
    },

    setCanvasSize: function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    },

    checkIfGameOver: function() {
        if (this.player.score >= 5 || this.ai.score >= 5) {
            this.drawGameOverScreen();
            window.removeEventListener('keypress', this.onKeyPress.bind(this));
            this.gameOver = true;
        }
    },
    
    startNewGame: function() {
        this.reset();
        window.addEventListener('keypress', this.onKeyPress.bind(this));
        this.loop();
    },

    drawGameOverScreen: function() {
        this.ctx.fillStyle = 'BLACK';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = 'WHITE';
        this.ctx.font = '40px Arial';
        this.ctx.fillText('GAME OVER', this.width / 4, this.height / 2);
        this.ctx.fillText('Click to play again', this.width / 4, this.height / 2 + 100);
        this.canvas.addEventListener('click', this.boundReset);
    },

    playerScored: function() {
        this.player.x = 20;
        this.player.y = this.height / 2 - 50;
        this.player.width = 10;
        this.player.height = 100;
        
        this.ai.x = this.width - 30;
        this.ai.y = this.height / 2 - 50;
        this.ai.width = 10;
        this.ai.height = 100;

        this.ball.x = this.width / 2;
        this.ball.y = this.height / 2;
        this.ball.radius = 10;
        this.ball.speed = 5;
        this.ball.velocityX = 3;
        this.ball.velocityY = 4;
        this.ball.color = 'WHITE';
        this.checkIfGameOver();
    },

    reset: function() {
        this.player = {
            x: 20,
            y: this.height / 2 - 50,
            width: 10,
            height: 100,
            score: 0,
            speed: 50
        };
        this.ai = {
            x: this.width - 30,
            y: this.height / 2 - 50,
            width: 10,
            height: 100,
            score: 0,
            speed: 100
        };
        this.ball = {
            x: this.width / 2,
            y: this.height / 2,
            radius: 10,
            speed: 5,
            velocityX: 3,
            velocityY: 4,
            color: 'WHITE'
        };
        this.canvas.removeEventListener('click', this.boundReset);
        this.gameOver = false;
    },

    loop: function() {
        this.update();
        if (this.gameOver) {
            return;
        }
        this.draw();
        window.requestAnimationFrame(this.loop.bind(this));
    },

    update: function() {
        this.ball.x += this.ball.velocityX;
        this.ball.y += this.ball.velocityY;

        if (this.ball.y + this.ball.radius > this.height || this.ball.y - this.ball.radius < 0) {
            this.ball.velocityY = -this.ball.velocityY;
        }

        let player = (this.ball.x < this.width / 2) ? this.player : this.ai;
        if (this.collision(this.ball, player)) {
            let collidePoint = this.ball.y - (player.y + player.height / 2);
            collidePoint = collidePoint / (player.height / 2);
            let angleRad = (Math.PI / 4) * collidePoint;
            let direction = (this.ball.x < this.width / 2) ? 1 : -1;
            this.ball.velocityX = direction * this.ball.speed * Math.cos(angleRad);
            this.ball.velocityY = direction * this.ball.speed * Math.sin(angleRad);
            this.ball.speed += 0.1;
        }

        if (this.ball.x - this.ball.radius < 0) {
            this.ai.score++;
            this.playerScored();
        } else if (this.ball.x + this.ball.radius > this.width) {
            this.player.score++;
            this.playerScored();
        }

        this.ai.y += ((this.ball.y - (this.ai.y + this.ai.height / 2))) * this.ai.speed / 1000;
    },

    draw: function() {
        this.ctx.fillStyle = 'BLACK';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = 'WHITE';
        this.ctx.font = '75px Arial';
        this.ctx.fillText(this.player.score, this.width / 4, this.height / 5);
        this.ctx.fillText(this.ai.score, 3 * this.width / 4, this.height / 5);
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        this.ctx.fillRect(this.ai.x, this.ai.y, this.ai.width, this.ai.height);
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.ball.color;
        this.ctx.fill();
    },

    collision: function(ball, player) {
        player.top = player.y;
        player.bottom = player.y + player.height;
        player.left = player.x;
        player.right = player.x + player.width;

        ball.top = ball.y - ball.radius;
        ball.bottom = ball.y + ball.radius;
        ball.left = ball.x - ball.radius;
        ball.right = ball.x + ball.radius;

        return ball.right > player.left && ball.top < player.bottom && ball.left < player.right && ball.bottom > player.top;
    },

    onKeyPress: function(event)
    {
        if (this.player.y < 0) 
            this.player.y = 0;
        if (this.player.y + this.player.height > this.height)
            this.player.y = this.height - this.player.height;
        if (event.key === 'w' || event.key === 'W')
            this.player.y -= this.player.speed;
        if (event.key === 's' || event.key === 'S')
            this.player.y += this.player.speed;
    }
};

document.addEventListener('DOMContentLoaded', function() {
    Game.init();
});