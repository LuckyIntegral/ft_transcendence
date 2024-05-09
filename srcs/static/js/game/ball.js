class Ball {
  constructor () {
    this.resetPosition()
  }

  resetPosition () {
    this.xSpeed = GameConstants.BALL_SPEED
    this.ySpeed = GameConstants.BALL_SPEED
    this.speed = GameConstants.BALL_ACCELERATION
    this.x = GameConstants.GAME_WIDTH / 2
    this.y = GameConstants.GAME_HEIGHT / 2
  }

  move () {
    this.x += this.xSpeed
    this.y += this.ySpeed
  }

  bounce () {
    if (
      this.y + GameConstants.BALL_RADIUS > GameConstants.GAME_HEIGHT ||
      this.y - GameConstants.BALL_RADIUS < 0
    ) {
      this.ySpeed = -this.ySpeed
    }
  }

  accelerate () {
    this.speed *= 1.02
  }
}
