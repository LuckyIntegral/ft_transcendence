class Lobby {
  constructor () {
    this.id = this.getNewGameId()
    this.createLobby()
  }

  createLobby (username) {
    var url = new URL(`http://${window.location.host}/api/game/lobby/`)
    return fetchWithToken(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('access')
      },
      body: JSON.stringify({ username: username, game_id: this.id })
    })
  }

  sendGameRequest (friendUsername) {
    let url = `http://${window.location.host}/api/game/request/`
    return fetchWithToken(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('access')
      },
      body: JSON.stringify({ username: friendUsername })
    })
  }

  getNewGameId () {
    return 69
  }
}
