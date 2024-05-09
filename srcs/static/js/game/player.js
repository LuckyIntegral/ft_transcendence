class Player {
  constructor () {
    this.moveUp = false
    this.moveDown = false
    this.resetScore()
    this.resetPosition()
  }

  resetScore () {
    this.score = 0
  }

  resetPosition () {
    this.x = 20
    this.y = GameConstants.GAME_HEIGHT / 2 - 50
  }

  move () {
    if (this.moveUp === true && this.y > 0) {
      this.y -= GameConstants.PLAYER_SPEED
    } else if (
      this.moveDown === true &&
      this.y < GameConstants.GAME_HEIGHT - GameConstants.PADDLE_HEIGHT
    ) {
      this.y += GameConstants.PLAYER_SPEED
    }
  }

  scoreGoal () {
    this.score++
  }
}
