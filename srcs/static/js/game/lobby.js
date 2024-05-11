class Lobby {
  constructor () {}

  joinOrCreate (lobbyId) {
    var url = new URL(`http://${window.location.host}/api/game/lobby/`)
    return fetchWithToken(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('access')
      },
      body: JSON.stringify({ lobby_id: lobbyId })
    })
  }

  sendGameRequest (friendUsername, lobbyId) {
    let url = `http://${window.location.host}/api/game/request/`
    return fetchWithToken(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('access')
      },
      body: JSON.stringify({ username: friendUsername, lobby_id: lobbyId })
    })
  }

  getNewGameId () {
    return 69
  }
}
