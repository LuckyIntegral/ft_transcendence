class Player {
  constructor (position) {
    this.position = position
    this.moveUp = false
    this.moveDown = false
    this.resetScore()
    this.resetPosition()
    this.fetchUsername().then(username => {
      console.log(`Player ${this.username} created`)
    }).then(username => this.getLobby().then(() => {
      this.lobbyTitle = `Player ${this.username} is in lobby ${this.lobbyId}, with users ${this.lobbyUsers}`
      console.log(this.lobbyTitle)
    }))
  }

  getLobby () {
    var url = new URL(`http://${window.location.host}/api/game/lobby/`)
    return fetchWithToken(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('access')
      }
    }).then(response => {
      if (response.status === 200) {
        return response.json().then(data => {
          if (data.lobby_id) {
            this.lobbyId = data.lobby_id
            this.lobbyUsers = data.users.map(user => user.username)
          }
        })
      }
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
