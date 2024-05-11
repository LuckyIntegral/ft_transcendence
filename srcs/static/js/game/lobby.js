class Lobby {
  constructor () {
    this.id = 69
    this.socket = new WebSocket(`ws://${window.location.host}/ws/lobby/${this.id}/`)
  }
}
