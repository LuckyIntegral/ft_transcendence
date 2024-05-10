class Game {
  constructor () {
    this.setListeners()
  }

  initGameElements (gameMode) {
    this.ball = new Ball()
    this.player1 = new Player(PlayerPosition.PLAYER1)
    if (gameMode === GameModes.PLAYER_VS_AI) {
      this.player2 = new AI()
    } else {
      this.player2 = new Player(PlayerPosition.PLAYER2)
    }
    this.gameOver = false
  }

  loadGame (gameMode) {
    this.initGameElements(gameMode)
    this.stop()
    this.createCanvas()
    this.start()
  }

  createCanvas () {
    var content = document.getElementById('content')

    if (content === null) {
      alertError('content is null')
      return
    }

    var canvas = document.createElement('canvas')
    canvas.id = 'game'
    content.textContent = ''
    content.appendChild(canvas)
  }

  start () {
    this.gameOver = false
    this.setUpCanvas()
    this.startNewGame()
  }

  stop () {
    this.gameOver = true
  }

  setUpCanvas () {
    this.canvas = document.getElementById('game')
    this.context = this.canvas.getContext('2d')
    this.canvas.width = GameConstants.GAME_WIDTH
    this.canvas.height = GameConstants.GAME_HEIGHT
  }

  startNewGame () {
    this.reset()
    this.boundKeyPress = this.keyPressHandler.bind(this)
    window.addEventListener('keydown', this.boundKeyPress)
    window.addEventListener('keyup', this.boundKeyPress)
    this.loop()
  }

  setKeyPressListeners () {
    this.boundKeyPress = this.keyPressHandler.bind(this)
    window.addEventListener('keydown', this.boundKeyPress)
    window.addEventListener('keyup', this.boundKeyPress)
  }

  loop () {
    this.update()
    if (this.gameOver === false) {
      this.draw()
      window.requestAnimationFrame(this.loop.bind(this))
    }
  }

  update () {
    this.moveElements()
    this.checkCollisions()
    this.checkGoals()
    this.player2.move(this.ball, this.player1)
  }

  moveElements () {
    this.ball.move()
    this.player1.move()
    this.ball.bounce()
  }

  checkCollisions () {
    let player =
      this.ball.x < GameConstants.GAME_WIDTH / 2 ? this.player1 : this.player2
    if (this.collision(this.ball, player)) {
      this.handleCollision(player)
    }
  }

  handleCollision (player) {
    this.ball.accelerate()

    let collidePoint =
      this.ball.y - (player.y + GameConstants.PADDLE_HEIGHT / 2)
    collidePoint = collidePoint / (GameConstants.PADDLE_HEIGHT / 2)
    let angleRadius = (Math.PI / 4) * collidePoint
    let direction = player === this.player1 ? 1 : -1

    this.ball.xSpeed = direction * this.ball.speed * Math.cos(angleRadius)
    this.ball.ySpeed = this.ball.speed * Math.sin(angleRadius)
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

  checkGoals () {
    if (this.ball.x - GameConstants.BALL_RADIUS < 0) {
      this.player2.scoreGoal()
      this.goal()
    } else if (
      this.ball.x + GameConstants.BALL_RADIUS >
      GameConstants.GAME_WIDTH
    ) {
      this.player1.scoreGoal()
      this.goal()
    }
  }

  draw () {
    this.clearCanvas()
    this.drawScores()
    this.drawPlayer()
    this.drawAI()
    this.drawBall()
  }

  clearCanvas () {
    this.context.fillStyle = 'BLACK'
    this.context.fillRect(
      0,
      0,
      GameConstants.GAME_WIDTH,
      GameConstants.GAME_HEIGHT
    )
  }

  drawScores () {
    this.context.fillStyle = 'WHITE'
    this.context.font = '75px Arial'
    this.context.fillText(
      this.player1.score,
      GameConstants.GAME_WIDTH / 4,
      GameConstants.GAME_HEIGHT / 5
    )
    this.context.fillText(
      this.player2.score,
      (3 * GameConstants.GAME_WIDTH) / 4,
      GameConstants.GAME_HEIGHT / 5
    )
  }

  drawPlayer () {
    this.context.fillRect(
      this.player1.x,
      this.player1.y,
      GameConstants.PADDLE_WIDTH,
      GameConstants.PADDLE_HEIGHT
    )
  }

  drawAI () {
    this.context.fillRect(
      this.player2.x,
      this.player2.y,
      GameConstants.PADDLE_WIDTH,
      GameConstants.PADDLE_HEIGHT
    )
  }

  drawBall () {
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
    this.player1.resetScore()
    this.player1.resetPosition()
    this.player2.resetScore()
    this.player2.resetPosition()
    this.ball.resetPosition()
    this.canvas.removeEventListener('click', this.boundReset)
    this.gameOver = false
  }

  checkIfOver () {
    if (this.player2.score >= 5) {
      this.endGame(this.player2)
    } else if (this.player1.score >= 5) {
      this.endGame(this.player1)
    }
  }

  endGame (winner) {
    this.clearCanvas()

    if (winner === this.player2) {
      this.drawEndGameMessage('GAME OVER')
    } else {
      this.drawEndGameMessage('YOU WIN')
    }

    window.removeEventListener('keydown', this.boundKeyPress)
    window.removeEventListener('keyup', this.boundKeyPress)
    this.canvas.addEventListener('click', this.boundReset)
    this.gameOver = true
  }

  drawEndGameMessage (message) {
    this.context.textBaseline = 'middle'
    this.context.textAlign = 'center'
    this.context.fillStyle = 'WHITE'
    this.context.font = '40px Arial'
    this.context.fillText(
      message,
      GameConstants.GAME_WIDTH / 2,
      GameConstants.GAME_HEIGHT / 2 - 50
    )
    this.context.fillText(
      'Click to play again',
      GameConstants.GAME_WIDTH / 2,
      GameConstants.GAME_HEIGHT / 2 + 50
    )
  }

  goal () {
    this.checkIfOver()
    this.player1.resetPosition()
    this.player2.resetPosition()
    this.ball.resetPosition()
  }

  keyPressHandler = event => {
    const isKeyDown = event.type === 'keydown'
    const isKeyUp = event.type === 'keyup'
    const isWKey = event.key === 'w' || event.key === 'W'
    const isSKey = event.key === 's' || event.key === 'S'

    if (isKeyDown && isWKey) this.player1.moveUp = true
    else if (isKeyDown && isSKey) this.player1.moveDown = true
    else if (isKeyUp && isWKey) this.player1.moveUp = false
    else if (isKeyUp && isSKey) this.player1.moveDown = false
  }

  setListeners () {
    this.boundContextMenu = this.contextMenuHandler.bind(this)
    window.addEventListener('contextmenu', this.boundContextMenu)

    this.boundVisibilityChange = this.visibilityChangeHandler.bind(this)
    document.addEventListener('visibilitychange', this.boundVisibilityChange)

    this.boundBlur = this.blurHandler.bind(this)
    window.addEventListener('blur', this.boundBlur)

    this.boundReset = this.resetHandler.bind(this)
  }

  contextMenuHandler (event) {
    event.preventDefault()
  }

  visibilityChangeHandler () {
    if (document.hidden) {
      this.endGame(this.player2)
    }
  }

  blurHandler () {
    this.player1.moveUp = false
    this.player1.moveDown = false
  }

  resetHandler () {
    this.startNewGame()
  }
}
