class Menu {
  constructor (game) {
    this.game = game
    this.menuItems = [
      { text: 'Play against AI', action: () => this.game.loadGamePage(true) },
      {
        text: 'Play against another player',
        action: () => this.game.loadGamePage(false)
      }
    ]
    this.selectedItemIndex = 0
  }

  start () {
    this.createCanvas()
    this.drawMenu()
    this.setMouseListeners()
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

  drawMenu () {
    this.context.fillStyle = 'BLACK'
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.context.font = '30px Arial'
    this.context.textAlign = 'center'
    this.context.textBaseline = 'middle'

    const startX = this.canvas.width / 2
    const startY = this.canvas.height / 2 - 50

    this.menuItems.forEach((item, index) => {
      this.context.fillStyle = index === this.selectedItemIndex ? 'RED' : 'WHITE'
      this.context.fillText(item.text, startX, startY + index * 60)
      this.context.strokeStyle = 'WHITE'
      this.context.strokeRect(startX - 200, startY + index * 60 - 25, 400, 50)
    })
  }

  setMouseListeners () {
    this.canvas.addEventListener('click', this.handleMouseClick.bind(this))
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  handleMouseClick (event) {
    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
  
    const startX = this.canvas.width / 2 - 200
    const startY = this.canvas.height / 2 - 50
  
    for (let i = 0; i < this.menuItems.length; i++) {
      if (
        x >= startX &&
        x <= startX + 400 &&
        y >= startY + i * 60 - 25 &&
        y <= startY + 50 + i * 60 - 25
      ) {
        this.menuItems[i].action()
        break
      }
    }
  }

  handleMouseMove (event) {
    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const startX = this.canvas.width / 2 - 200
    const startY = this.canvas.height / 2 - 50

    let selectedIndex = null
    for (let i = 0; i < this.menuItems.length; i++) {
      if (
        x >= startX &&
        x <= startX + 400 &&
        y >= startY + i * 60 - 25 &&
        y <= startY + 50 + i * 60 - 25
      ) {
        selectedIndex = i
        break
      }
    }

    if (selectedIndex !== this.selectedItemIndex) {
      this.selectedItemIndex = selectedIndex
      this.drawMenu()
    }
  }
}
