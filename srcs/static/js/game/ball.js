class Ball {
  constructor () {
    this.resetPosition()
  }

  resetPosition () {
    this.xSpeed = GameConstants.BALL_SPEED
    this.ySpeed = GameConstants.BALL_SPEED
    this.speed = GameConstants.BALL_BASE_ACCELERATION
    this.x = GameConstants.GAME_WIDTH / 2
    this.y = GameConstants.GAME_HEIGHT / 2
  }

  move () {
    this.x += this.xSpeed
    this.y += this.ySpeed
  }

  bounce () {
    if (this.y + GameConstants.BALL_RADIUS * 2 > GameConstants.GAME_HEIGHT) {
      this.ySpeed = -this.ySpeed
      this.y = GameConstants.GAME_HEIGHT - GameConstants.BALL_RADIUS * 2
    } else if (this.y - GameConstants.BALL_RADIUS * 2 < 0) {
      this.ySpeed = -this.ySpeed
      this.y = GameConstants.BALL_RADIUS * 2
    }
  }

  accelerate () {
    this.speed *= GameConstants.BALL_ACCELERATION_RATE
  }
}
