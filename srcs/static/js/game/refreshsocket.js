// refreshSocket = function (username) {
//   var socket = new WebSocket(
//     `ws://${window.location.host}/ws/user/${username}/`
//   )
//   socket.onopen = function () {
//     console.log(`WebSocket open on ${socket.url}`)
//   }
//   socket.onmessage = function (event) {
//     var data = JSON.parse(event.data)
//     if (data.message) {
//       var sender = data.sender
//       var lobbyId = data.lobby_id
//       var popup = createPopup(data.message)
//       popup.innerHTML = `
//       <div class="card" style="width: 300px;">
//           <div class="card-header bg-primary text-white">
//               ${data.message}
//               <button id="close-button" style="float: right; border: none; background: none; color: white;">&times;</button>
//           </div>
//           <div class="card-body">
//               <p>${data.message}</p>
//               <button id="accept-button" class="btn btn-success">Accept</button>
//               <button id="decline-button" class="btn btn-danger">Decline</button>
//           </div>
//       </div>
//   `
//       document.body.appendChild(popup)
//       var closeButton = popup.querySelector('#close-button')
//       closeButton.addEventListener('click', function () {
//         document.body.removeChild(popup)
//       })
//       var acceptButton = popup.querySelector('#accept-button')
//       acceptButton.addEventListener('click', function () {
//         console.log(`Accepted game request from ${sender}`)
//         var lobby = new Lobby()
//         lobby.joinOrCreate(lobbyId)
//         console.log(`${username} joined lobby ${lobbyId}`)
//         document.body.removeChild(popup)
//         var game = new Game(lobbyId)
//         game.loadGame(GameModes.PLAYER_VS_PLAYER)
//       })
//       var declineButton = popup.querySelector('#decline-button')
//       declineButton.addEventListener('click', function () {
//         console.log('Decline button clicked')
//         socket.send(
//           JSON.stringify({
//             action: 'decline',
//             message: data.message
//           })
//         )
//         document.body.removeChild(popup)
//       })
//     }
//   }
//   socket.onerror = function (error) {
//     console.error('WebSocket error', error)
//   }
//   window.userSocket = socket
// }
