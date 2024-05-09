class Game {
  constructor () {
    this.ball = new Ball()
    this.player = new Player()
    this.ai = new AI()
    this.gameOver = false
    this.setListeners()
  }

  loadGamePage () {
    var content = document.getElementById('content')

    if (content === null) {
      alertError('content is null')
      return
    }

    var canvas = document.createElement('canvas')
    canvas.id = 'game'

    document.getElementById('content').textContent = ''
    document.getElementById('content').appendChild(canvas)

    var content = document.getElementById('content')
    content.appendChild(canvas)
    this.init()
  }

  init () {
    this.canvas = document.getElementById('game')
    this.context = this.canvas.getContext('2d')
    this.canvas.width = GameConstants.GAME_WIDTH
    this.canvas.height = GameConstants.GAME_HEIGHT
    this.boundReset = this.startNewGame.bind(this)
    this.startNewGame()
  }

  startNewGame () {
    this.reset()
    this.boundKeyPress = this.keyPressHandler.bind(this)
    window.addEventListener('keydown', this.boundKeyPress)
    window.addEventListener('keyup', this.boundKeyPress)
    this.loop()
  }

  loop () {
    this.update()
    if (this.gameOver === true) {
      return
    }
    this.draw()
    window.requestAnimationFrame(this.loop.bind(this))
  }

  update () {
    this.ball.move()
    this.player.move()
    this.ball.bounce()

    let player =
      this.ball.x < GameConstants.GAME_WIDTH / 2 ? this.player : this.ai
    if (this.collision(this.ball, player)) {
      this.ball.accelerate()

      let collidePoint =
        this.ball.y - (player.y + GameConstants.PADDLE_HEIGHT / 2)
      collidePoint = collidePoint / (GameConstants.PADDLE_HEIGHT / 2)
      let angleRadius = (Math.PI / 4) * collidePoint
      let direction = player === this.player ? 1 : -1

      this.ball.xSpeed = direction * this.ball.speed * Math.cos(angleRadius)
      this.ball.ySpeed = this.ball.speed * Math.sin(angleRadius)
    }

    if (this.ball.x - GameConstants.BALL_RADIUS < 0) {
      this.ai.scoreGoal()
      this.goal()
    } else if (
      this.ball.x + GameConstants.BALL_RADIUS >
      GameConstants.GAME_WIDTH
    ) {
      this.player.scoreGoal()
      this.goal()
    }

    this.ai.move(this.ball, this.player)
  }

  collision (ball, player) {
    player.left = player.x
    player.right = player.x + GameConstants.PADDLE_WIDTH
    player.top = player.y
    player.bottom = player.y + GameConstants.PADDLE_HEIGHT

    ball.top = ball.y - GameConstants.BALL_RADIUS
    ball.bottom = ball.y + GameConstants.BALL_RADIUS
    ball.left = ball.x - GameConstants.BALL_RADIUS
    ball.right = ball.x + GameConstants.BALL_RADIUS

    return (
      ball.right > player.left &&
      ball.top < player.bottom &&
      ball.left < player.right &&
      ball.bottom > player.top
    )
  }

  draw () {
    this.context.fillStyle = 'BLACK'
    this.context.fillRect(
      0,
      0,
      GameConstants.GAME_WIDTH,
      GameConstants.GAME_HEIGHT
    )
    this.context.fillStyle = 'WHITE'
    this.context.font = '75px Arial'
    this.context.fillText(
      this.player.score,
      GameConstants.GAME_WIDTH / 4,
      GameConstants.GAME_HEIGHT / 5
    )
    this.context.fillText(
      this.ai.score,
      (3 * GameConstants.GAME_WIDTH) / 4,
      GameConstants.GAME_HEIGHT / 5
    )
    this.context.fillRect(
      this.player.x,
      this.player.y,
      GameConstants.PADDLE_WIDTH,
      GameConstants.PADDLE_HEIGHT
    )
    this.context.fillRect(
      this.ai.x,
      this.ai.y,
      GameConstants.PADDLE_WIDTH,
      GameConstants.PADDLE_HEIGHT
    )
    this.context.beginPath()
    this.context.arc(
      this.ball.x,
      this.ball.y,
      GameConstants.BALL_RADIUS,
      0,
      Math.PI * 2
    )
    this.context.fillStyle = GameConstants.BALL_COLOR
    this.context.fill()
  }

  reset () {
    this.player.resetScore()
    this.player.resetPosition()
    this.ai.resetScore()
    this.ai.resetPosition()
    this.ball.resetPosition()
    this.canvas.removeEventListener('click', this.boundReset)
    this.gameOver = false
  }

  checkIfOver () {
    if (this.ai.score >= 5) {
      this.endGame(this.ai)
    } else if (this.player.score >= 5) {
      this.endGame(this.player)
    }
  }

  endGame (winner) {
    this.context.fillStyle = 'BLACK'
    this.context.fillRect(
      0,
      0,
      GameConstants.GAME_WIDTH,
      GameConstants.GAME_HEIGHT
    )
    this.context.textBaseline = 'middle'
    this.context.textAlign = 'center'
    this.context.fillStyle = 'WHITE'
    this.context.font = '40px Arial'

    if (winner === this.ai) {
      this.context.fillText(
        'GAME OVER',
        GameConstants.GAME_WIDTH / 2,
        GameConstants.GAME_HEIGHT / 2 - 50
      )
    } else {
      this.context.fillText(
        'YOU WIN',
        GameConstants.GAME_WIDTH / 2,
        GameConstants.GAME_HEIGHT / 2 - 50
      )
    }

    this.context.fillText(
      'Click to play again',
      GameConstants.GAME_WIDTH / 2,
      GameConstants.GAME_HEIGHT / 2 + 50
    )
    window.removeEventListener('keydown', this.boundKeyPress)
    window.removeEventListener('keyup', this.boundKeyPress)
    this.canvas.addEventListener('click', this.boundReset)
    this.gameOver = true
  }

  goal () {
    this.checkIfOver()
    this.player.resetPosition()
    this.ai.resetPosition()
    this.ball.resetPosition()
  }

  keyPressHandler (event) {
    if (event.type === 'keydown') {
      if (event.key === 'w' || event.key === 'W') {
        this.player.moveUp = true
      } else if (event.key === 's' || event.key === 'S') {
        this.player.moveDown = true
      }
    } else if (event.type === 'keyup') {
      if (event.key === 'w' || event.key === 'W') {
        this.player.moveUp = false
      } else if (event.key === 's' || event.key === 'S') {
        this.player.moveDown = false
      }
    }
  }

  setListeners () {
    this.boundContextMenu = this.contextMenuHandler.bind(this)
    window.addEventListener('contextmenu', this.boundContextMenu)

    this.boundVisibilityChange = this.visibilityChangeHandler.bind(this)
    document.addEventListener('visibilitychange', this.boundVisibilityChange)

    this.boundBlur = this.blurHandler.bind(this)
    window.addEventListener('blur', this.boundBlur)
  }

  contextMenuHandler (event) {
    event.preventDefault()
  }

  visibilityChangeHandler () {
    if (document.hidden) {
      this.endGame(this.ai)
    }
  }

  blurHandler () {
    this.player.moveUp = false
    this.player.moveDown = false
  }
}
