class Player3D {

	constructor (player, paddle) {
		this.player = player
		this.lobby = new GameLobby()
		this.paddle = paddle 
		this.resetScore()
		this.resetPaddles()
	}

	resetScore () {
		this.score = 0
	}

	resetPaddles () {
		this.paddle.resetPosition(this.player)
	}

	update (dt, keystate, ball) {
		this.paddle.update(dt, keystate, ball)
	}

	scoreGoal () {
		this.score++
	}
}
