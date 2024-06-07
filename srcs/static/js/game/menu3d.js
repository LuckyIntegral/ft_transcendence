var intro3dImage = null;

class Menu3D {
  constructor () {
    this.game = new Game3D(69)
    this.title = 'PONG'
    this.menuItems = [
      {
        text: 'Easy',
        action: () => this.game.loadGame(GameModes.PLAYER_VS_AI, 'easy'),
        image: 'static/images/tabletenis.jpg'
      },
      {
        text: 'Hard',
        action: () => this.game.loadGame(GameModes.PLAYER_VS_AI, 'hard'),
      },
      {
        text: 'Brutal',
        action: () => this.game.loadGame(GameModes.PLAYER_VS_AI, 'impossible'),
      },
    ]
    this.images = {}
    this.init(true)
  }

  init (fullInit = false) {
    if (fullInit) {
      this.preloadImages(this.menuItems.map(item => item.image))
      this.selectedItemIndex = null
      this.hoverIntensity = new Array(this.menuItems.length).fill(0)
      this.clickIntensity = new Array(this.menuItems.length).fill(0)
    }
	this.setupCanvasAndListeners()
}

  setupCanvasAndListeners () {
    this.createCanvas()
    this.setFont()
    this.setMouseListeners()
  }

  setMouseListeners () {
    this.clearListeners()
    this.boundClick = this.mouseClickHandler.bind(this)
    this.canvas.addEventListener('click', this.boundClick)
    this.boundMove = this.mouseMoveHandler.bind(this)
    this.canvas.addEventListener('mousemove', this.boundMove)
  }

  mouseClickHandler (event) {
    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const startX = this.canvas.width / 2 - 200
    const startY = 2 * this.canvas.height / 5

    for (let i = 0; i < this.menuItems.length; i++)
	{
      if (this.mouseOverButton(x, y, startX, startY, i))
	  {
        this.clickIntensity[i] = 1
        setTimeout(() =>
		{
          this.menuItems[i].action()
        }, 100)
        break
      }
    }
  }

  preloadImages (imagePaths) {
    imagePaths.forEach(path => {
      if (path && !this.images[path]) {
        const img = new Image()
        img.onload = () => {
          this.images[path] = img
          this.drawMenu()
          intro3dImage = img;
        }
        img.src = path
      }
    })
  }

  start () {
    this.createCanvas()
    this.setFont()
    this.drawMenu()
    this.setMouseListeners()
    this.animate()
  }

  animate () {
    if (this.stopAnimation === true) {
      cancelAnimationFrame(this.animationFrameId)
      return
    }

    for (let i = 0; i < this.menuItems.length; i++) {
      if (i === this.selectedItemIndex) {
        this.hoverIntensity[i] = Math.min(this.hoverIntensity[i] + 0.15, 1)
      } else {
        this.hoverIntensity[i] = Math.max(this.hoverIntensity[i] - 0.2, 0)
      }
    }

    for (let i = 0; i < this.menuItems.length; i++) {
      this.clickIntensity[i] = Math.max(this.clickIntensity[i] - 0.02, 0)
    }

    this.drawMenu()

    this.animationFrameId = requestAnimationFrame(this.animate.bind(this))
  }

  createCanvas () {
    var content = document.getElementById('content')

    if (content === null) {
      alert('content is null')
      return
    }

    var canvas = document.createElement('canvas')
    canvas.id = 'game'
    canvas.width = GameConstants.GAME_WIDTH
    canvas.height = GameConstants.GAME_HEIGHT
    content.textContent = ''
    content.appendChild(canvas)
    this.canvas = canvas
    this.context = canvas.getContext('2d')
  }

  clear () {
    this.context.fillStyle = 'BLACK'
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  clearListeners () {
    this.canvas.removeEventListener('click', this.boundClick)
    this.canvas.removeEventListener('mousemove', this.boundMove)
  }

  drawMenu () {
    if (intro3dImage !== null) {
      this.context.drawImage(intro3dImage, 0, 0, this.canvas.width, this.canvas.height)
    }

    if (this.title !== null) {
      this.context.fillStyle = 'WHITE'
      this.context.font = '80px theren-regular'
      this.context.fillText(this.title, this.canvas.width / 2, this.canvas.height / 5)
    }

    const startX = this.canvas.width / 2
    const startY = 2 * this.canvas.height / 5 

    this.context.font = '30px theren-regular'

    this.menuItems.forEach((item, index) => {
      this.drawButton(
        item.text,
        startX - 200,
        startY + index * 60,
        400,
        50,
        index
      )
    })
  }

  drawButton (text, x, y, width, height, index) {
    const intensity = Math.floor(this.hoverIntensity[index] * 100)
    this.context.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`
    this.context.fillRect(x, y, width, height)
    this.context.fillStyle = 'WHITE'
    this.context.fillText(text, x + width / 2, y + height / 2)
    this.context.strokeStyle = 'WHITE'
    this.context.strokeRect(x, y, width, height)
    if (this.clickIntensity[index] > 0) {
      this.context.fillStyle = `rgba(0, 0, 0, ${this.clickIntensity[index]})`
      this.context.fillRect(x, y, width, height)
    }
  }

  setFont () {
    this.context.font = '30px theren-regular'
    this.context.textAlign = 'center'
    this.context.textBaseline = 'middle'
    this.context.fillStyle = 'WHITE'
  }

  setMouseListeners () {
    this.clearListeners()

    this.boundClick = this.mouseClickHandler.bind(this)
    this.canvas.addEventListener('click', this.boundClick)

    this.boundMove = this.mouseMoveHandler.bind(this)
    this.canvas.addEventListener('mousemove', this.boundMove)
  }

  mouseMoveHandler (event) {
    const x = event.clientX - this.canvas.getBoundingClientRect().left
    const y = event.clientY - this.canvas.getBoundingClientRect().top

    const startX = this.canvas.width / 2 - 200
    const startY = 2 * this.canvas.height / 5 

    let selectedIndex = null
    for (let i = 0; i < this.menuItems.length; i++) {
      if (this.mouseOverButton(x, y, startX, startY, i) === true) {
        selectedIndex = i
        break
      }
    }

    if (selectedIndex !== this.selectedItemIndex) {
      this.selectedItemIndex = selectedIndex
      this.drawMenu()
    }

    this.updateCursor(selectedIndex)
  }

  updateCursor (selectedIndex) {
    if (selectedIndex !== null) {
      this.canvas.style.cursor = 'pointer'
    } else {
      this.canvas.style.cursor = 'default'
    }
  }

  mouseOverButton (x, y, startX, startY, i) {
    return (
      x >= startX &&
      x <= startX + 400 &&
      y >= startY + i * 60 &&
      y <= startY + 50 + i * 60
    )
  }
}
