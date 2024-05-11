class Menu {
  constructor () {
    this.game = new Game()
    this.title = ''
    this.menuItems = [
      {
        text: 'PLAYER VS AI',
        action: () => this.game.loadGame(GameModes.PLAYER_VS_AI),
        image: 'static/images/ai.png'
      },
      {
        text: 'PLAYER VS PLAYER',
        action: () => this.displayOnlineFriends(),
        image: 'static/images/pvp.png'
      }
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
    const startY = this.canvas.height / 2 - 50

    for (let i = 0; i < this.menuItems.length; i++) {
      if (this.mouseOverButton(x, y, startX, startY, i)) {
        this.clickIntensity[i] = 1
        setTimeout(() => {
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
    this.clear()

    if (this.title !== null) {
      this.context.fillStyle = 'WHITE'
      this.context.fillText(this.title, this.canvas.width / 2, 50)
    }

    const startX = this.canvas.width / 2
    const startY = this.canvas.height / 2 - 50

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
    if (this.images[this.menuItems[index].image]) {
      this.context.drawImage(
        this.images[this.menuItems[index].image],
        x + width - 48,
        y + (height - 44) / 2,
        45,
        44
      )
    }
  }

  setFont () {
    this.context.font = '30px Arial'
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
    const startY = this.canvas.height / 2 - 50

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

  fetchOnlineFriends () {
    var url = new URL('http://localhost:8080/api/friends/')
    return fetchWithToken(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('access')
      }
    }).then(response => response.json())
  }

  updateMenuWithFriends (data) {
    if (data.data.length === 0) {
      this.title = 'You have no friends lol'
    } else {
      this.menuItems = data.data.map(player => {
        return {
          text: player.username,
          image: player.pictureSmall,
          action: () => {
            cancelAnimationFrame(this.animationFrameId)
            this.lobby = new Lobby()
            this.lobby.joinOrCreate(this.lobby.getNewGameId()).then(() => {
              this.lobby.sendGameRequest(player.username, this.lobby.getNewGameId()).then(() => {
              })
            })
          }
        }
      })
      this.preloadImages(this.menuItems.map(item => item.image))
      this.title = 'Online friends'
    }
    this.init()
  }

  displayOnlineFriends () {
    this.clear()
    this.fetchOnlineFriends().then(data => this.updateMenuWithFriends(data))
  }
}
