refreshSocket = function (username) {
  var socket = new WebSocket(
    `ws://${window.location.host}/ws/user/${username}/`
  )
  socket.onopen = function () {
    console.log(`WebSocket open on ${socket.url}`)
  }
  socket.onmessage = function (event) {
    var data = JSON.parse(event.data)
    if (data.message) {
      alert(data.message)
    }
  }
  socket.onerror = function (error) {
    console.error('WebSocket error', error)
  }
  window.userSocket = socket
}
