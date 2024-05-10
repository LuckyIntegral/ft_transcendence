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
    this.selectedItemIndex = null
    this.hoverIntensity = new Array(this.menuItems.length).fill(0)
    this.clickIntensity = new Array(this.menuItems.length).fill(0)
  }

  start () {
    this.createCanvas()
    this.drawMenu()
    this.setMouseListeners()
    this.animate()
  }

  animate () {
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

    requestAnimationFrame(this.animate.bind(this))
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
      const intensity = Math.floor(20 + this.hoverIntensity[index] * 100)
      this.context.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`
      this.context.fillRect(startX - 200, startY + index * 60 - 25, 400, 50)
      this.context.fillStyle = 'WHITE'
      this.context.fillText(item.text, startX, startY + index * 60)
      this.context.strokeStyle = 'WHITE'
      this.context.strokeRect(startX - 200, startY + index * 60 - 25, 400, 50)
      if (this.clickIntensity[index] > 0) {
        this.context.fillStyle =
          'rgba(0, 0, 0, ' + this.clickIntensity[index] + ')'
        this.context.fillRect(startX - 200, startY + index * 60 - 25, 400, 50)
      }
    })
  }

  setMouseListeners () {
    this.canvas.addEventListener('click', this.handleMouseClick.bind(this))
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
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
        this.clickIntensity[i] = 1
        setTimeout(() => {
          this.menuItems[i].action()
        }, 100)
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
