const WINNING_SCORE = 5
const BALL_SPEED = 6
const BALL_ACCELERATION = 8
const BALL_RADIUS = 10
const BALL_COLOR = 'WHITE'
const GAME_WIDTH = 800
const GAME_HEIGHT = 600
const PADDLE_WIDTH = 10
const PADDLE_HEIGHT = 100
const PLAYER_SPEED = 10

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
    this.y = GAME_HEIGHT / 2 - 50
  }

  move () {
    if (this.moveUp === true && this.y > 0) {
      this.y -= PLAYER_SPEED
    } else if (this.moveDown === true && this.y < GAME_HEIGHT - PADDLE_HEIGHT) {
      this.y += PLAYER_SPEED
    }
  }

  scoreGoal () {
    this.score++
  }
}
