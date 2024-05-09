class Ball {
  constructor () {
    this.resetPosition()
  }

  resetPosition () {
    this.xSpeed = BALL_SPEED
    this.ySpeed = BALL_SPEED
    this.speed = BALL_ACCELERATION
    this.x = GAME_WIDTH / 2
    this.y = GAME_HEIGHT / 2
  }

  move () {
    this.x += this.xSpeed
    this.y += this.ySpeed
  }

  bounce () {
    if (this.y + BALL_RADIUS > GAME_HEIGHT || this.y - BALL_RADIUS < 0) {
      this.ySpeed = -this.ySpeed
    }
  }

  accelerate () {
    this.speed *= 1.02
  }
}
