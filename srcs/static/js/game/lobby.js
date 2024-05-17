class Lobby {
  constructor () {}

  join () {
    const gameToken = 'token'
    const gameSocket = new WebSocket(
      `ws://${window.location.host}/ws/game/${gameToken}/`
    )

    gameSocket.onopen = function (e) {
      console.log('Game WebSocket connection established.')
    }

    gameSocket.onmessage = function (e) {
      const data = JSON.parse(e.data)
      console.log('Received game data:', data)
    }

    gameSocket.onclose = function (e) {
      console.log('Game WebSocket connection closed.')
    }

    gameSocket.onerror = function(e) {
      console.error("Game WebSocket error:", e)
    }

    function sendGameData(data) {
      gameSocket.send(JSON.stringify(data))
    }
  }
}
