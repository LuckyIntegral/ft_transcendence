document.addEventListener('DOMContentLoaded', function() {
    var socket = new WebSocket(`ws://${window.location.host}/messages/long-poll/`);
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async function startWebSocketConnection() {
        if (!localStorage.getItem('access')) {
            await sleep(1000);
            return startWebSocketConnection();
        }
        if (!socket.readyState) {
            socket = new WebSocket(`ws://${window.location.host}/messages/long-poll/`);
        }
        socket.onopen = function(e) {
            socket.send(JSON.stringify({
                'token': localStorage.getItem('access')
            }));
        };

        socket.onmessage = function(event) {
            var data = JSON.parse(event.data);
            if (data && data['new_messages'] === 'received') {
                if (window.location.hash === '#messages') {
                    getUserListChats();
                } else {
                    document.getElementById('messagesRef').textContent = 'Messages🔴';
                }
            }
        };

        socket.onclose = function(event) {
            if (event.wasClean) {
                console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
            } else {
                // e.g. server process killed or network down
                // event.code is usually 1006 in this case
                console.log('[close] Connection died');
            }
            // Try to reconnect after a second
            setTimeout(startWebSocketConnection, 1000);
        };

        socket.onerror = function(error) {
            console.log(`[error] ${error.message}`);
        };
    }
    startWebSocketConnection();
});