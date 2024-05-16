document.addEventListener('DOMContentLoaded', function() {
    if (!localStorage.getItem('access')) {
        return;
    }
    var socket = new WebSocket(`ws://${window.location.host}/messages/long-poll/`);
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function updateTimestamps() {
        var timestampElements = document.querySelectorAll('.message-data-time');
        timestampElements.forEach(function(element) {
            var time = element.getAttribute('data-timestamp');
            element.textContent = formatTimestamp(time);
        });
        // var chatTimestampElements = document.querySelectorAll('.chat-timestamp');
        // chatTimestampElements.forEach(function(element) {
        //     var time = element.getAttribute('data-timestamp');
        //     element.textContent = formatTimestamp(time);
        // });
    }

    function updateLastOnline(chatsInfo) {
        for (var chat of chatsInfo) {
            var chatToken = chat['chatToken'];
            var lastOnline = new Date(chat['lastOnline']);
            var li = document.querySelector(`li[data-chat-token="${chatToken}"]`);
            if (!li)
            {
                return ;
            }
            var divStatus = li.querySelector('.status');
            if (Date.now() - lastOnline.getTime() < 60000) {
                divStatus.innerHTML = `<i class="fa fa-circle online"></i> <span>Online</span>`;
            } else {
                divStatus.innerHTML = `<i class="fa fa-circle offline"></i> <span class="chat-timestamp" data-timestamp="${chat['lastOnline']}">last seen ${formatTimestamp(chat['lastOnline'])}</span>`;
            }
        }
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

        socket.onmessage = async function(event) {
            var data = JSON.parse(event.data);
            // messages notifications
            if (data && data['new_messages'] === 'received') {
                if (window.location.hash === '#messages') {
                    getUserListChats();
                }
                document.getElementById('messagesRef').textContent = 'Messages🔴';
            }
            else if (data && data['new_messages'] === 'unread') {
                document.getElementById('messagesRef').textContent = 'Messages🔴';
            }
            else if (data && data['new_messages'] === 'none') {
                document.getElementById('messagesRef').textContent = 'Messages';
            }
            // friend requests notifications
            if (data && data['new_friend_requests'] === true) {
                document.getElementById('dropdownUser1').textContent = 'Community🔴';
                document.getElementById('friends').textContent = 'Friends🔴';
            } else {
                document.getElementById('dropdownUser1').textContent = 'Community';
                document.getElementById('friends').textContent = 'Friends';
            }
            // updating timestamps on messages page
            if (window.location.hash === '#messages') {
                updateLastOnline(data['chatsInfo']);
                updateTimestamps();
            }
            await sleep(1000);
            socket.send(JSON.stringify({
                'token': localStorage.getItem('access')
            }));
        };

        socket.onclose = function(event) {
            // if (event.wasClean) {
            // } else {
            //     // e.g. server process killed or network down
            //     // event.code is usually 1006 in this case
            // }
            // Try to reconnect after a second
            setTimeout(startWebSocketConnection, 1000);
        };

        socket.onerror = function(error) {
        };
    }
    startWebSocketConnection();
});