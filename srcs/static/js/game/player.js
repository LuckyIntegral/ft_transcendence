class Player {
  constructor (position) {
    this.position = position
    this.moveUp = false
    this.moveDown = false
    this.resetScore()
    this.resetPosition()
    this.fetchUsername().then(username => {
      console.log(`Player ${this.username} created`)
    })
  }

  fetchUsername () {
    var url = new URL(`http://${window.location.host}/api/profile/`)
    return fetchWithToken(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('access')
      }
    }).then(response => {
      if (response.status === 200) {
        return response.json().then(data => {
          this.username = data.username
          return this.username
        })
      }
    })
  }

  resetScore () {
    this.score = 0
  }

  resetPosition () {
    this.x = this.position.x
    this.y = this.position.y
  }

  move () {
    if (this.moveUp === true && this.y > 0 + GameConstants.PADDLE_PADDING) {
      this.y -= GameConstants.PLAYER_SPEED
    } else if (
      this.moveDown === true &&
      this.y <
        GameConstants.GAME_HEIGHT -
          GameConstants.PADDLE_HEIGHT -
          GameConstants.PADDLE_PADDING
    ) {
      this.y += GameConstants.PLAYER_SPEED
    }
  }

  scoreGoal () {
    this.score++
  }
}
