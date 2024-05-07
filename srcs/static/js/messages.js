function loadMessagesPage() {
    var messagesPage = document.createElement('section');
    messagesPage.setAttribute('style', 'background-color: #eee;');

    fetch('/static/templates/messages.html')
        .then(response => response.text())
        .then(data => {
            messagesPage.innerHTML = data;
            document.getElementById('content').innerHTML = '';
            document.getElementById('content').appendChild(messagesPage);
        })
        .then(() => {
            document.getElementById('messagesList').innerHTML = '';
            getUserListChats();
        });
}

function createIncomeMessageItemLi(message, time, avatarUrl) {
    var li = document.createElement('li');
    li.setAttribute('class', 'clearfix');
    li.setAttribute('style', 'text-align: left;');
    li.innerHTML = `<div class="message-data">
                        <span class="message-data-time">${time}</span>
                        <img src=${avatarUrl} alt="avatar">
                    </div>
                    <div class="message my-message">${message}</div>
                    `;
    return li;
}

function createOutcomeMessageItemLi(message, time, avatarUrl) {
    var li = document.createElement('li');
    li.setAttribute('class', 'clearfix');
    li.setAttribute('style', 'text-align: right;');
    li.innerHTML = `<div class="message-data">
                        <span class="message-data-time">${time}</span>
                        <img src=${avatarUrl} alt="avatar">
                    </div>
                    <div class="message other-message float-right">${message}</div>
                    `;
    return li;
}

function createUserListItemLi(data, type) {
    var li = document.createElement('li');
    var unreadLine = `<div class="unread-indicator" style="display: none;">
                        <span class="icon">✉️</span>
                        <span class="text">New message</span>
                    </div>
                    `;
    if (type === 'active') {
        li.setAttribute('class', 'clearfix active');
    } else if (data['isRead']) {
        li.setAttribute('class', 'clearfix')
    } else {
        li.setAttribute('class', 'clearfix unread');
        unreadLine = `<div class="unread-indicator">
                        <span class="icon">✉️</span>
                        <span class="text">New message</span>
                    </div>
                    `;
    }
    if (data['isOnline']) {
        statusLine = `<div class="status"> <i class="fa fa-circle online"></i> online </div>`
    } else {
        statusLine = `<div class="status"> <i class="fa fa-circle offline"></i> ${formatTimestamp(data['lastOnline'])} </div>`
    }
    li.setAttribute('data-chat-token', data['token']);
    li.innerHTML = `<img src="${data['picture']}" alt="avatar">
                    <div class="about">
                        <div class="name">${data['username']}</div>
                        ${statusLine}
                    </div>
                    ${unreadLine}
                    `;
    return li;
}


function getChatMessages(chatToken) {
    fetchWithToken('/api/chat/', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token'),
        },
        body: JSON.stringify({
            'token': chatToken
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to load messages');
    })
    .then(data => {
        document.getElementById('messagesList').innerHTML = '';
        data.forEach(message => {
            console.log(message);
            if (message['sender'] !== localStorage.getItem('username')) {
                document.getElementById('messagesList').appendChild(createIncomeMessageItemLi(message['message'], formatTimestamp(message['timestamp']), message['picture']));
            } else {
                document.getElementById('messagesList').appendChild(createOutcomeMessageItemLi(message['message'], formatTimestamp(message['timestamp']), message['picture']));
            }
        })
    })
    .catch(error => {
        console.error(error);
    });
}

function connectToSocket(chatToken) {
    var socket = new WebSocket(`ws://${window.location.host}/ws/chat/${chatToken}/`);
    socket.onmessage = function(event) {
        var data = JSON.parse(event.data);
        if (data['type'] === 'income') {
            document.getElementById('messagesList').appendChild(createIncomeMessageItemLi(data['message'], formatTimestamp(data['timestamp']), data['picture']));
        } else {
            document.getElementById('messagesList').appendChild(createOutcomeMessageItemLi(data['message'], formatTimestamp(data['timestamp']), data['picture']));
        }
    };
    socket.onclose = function(event) {
        if (event.wasClean) {
            console.log('Connection closed cleanly');
        } else {
            console.error('Connection died');
        }
    };
    socket.onerror = function(error) {
        console.error('Error: ' + error.message);
    };
    return socket;
}

function sendMessage(socket, chatToken) {
    var message = document.getElementById('messageInput').value;
    if (message === '') {
        return;
    }
    socket.send(JSON.stringify({
        'sender': localStorage.getItem('username'),
        'message': message,
        'timestamp': new Date().toISOString(),
    }));
    document.getElementById('messageInput').value = '';
}

function updateActiveChat(chatToken) {
    var chatToken = this.getAttribute('data-chat-token');
    var chatItems = document.querySelectorAll('#userList li');
    for (var i = 0; i < chatItems.length; i++) {
        var itemStatus = chatItems[i].getAttribute('class')
        if (itemStatus === 'clearfix active') {
            chatItems[i].setAttribute('class', 'clearfix');
            chatItems[i].addEventListener('click', updateActiveChat);
        }
    }
    this.setAttribute('class', 'clearfix active');
    this.removeEventListener('click', updateActiveChat);
    unreadDiv = this.querySelector('.unread-indicator');
    if (unreadDiv) {
        unreadDiv.setAttribute('style', 'display: none;');
    }
    document.getElementById('messagesList').innerHTML = '';
    getChatMessages(chatToken);
    socket = connectToSocket(chatToken);
    document.getElementById('inputDiv').setAttribute('style', '');
    document.getElementById('messageInput').addEventListener('keypress', function(event) {
        if (event.keyCode === 13) {
            sendMessage(socket, chatToken);
        }
    });
}

function getUserListChats () {
    fetchWithToken('/api/messages/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token'),
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to load messages');
    })
    .then(data => {
        var chatsList = document.getElementById('userList');
        chatsList.innerHTML = '';
        data.forEach(chat => {
            chatsList.appendChild(createUserListItemLi(chat, 'inactive'));
        });
        var chatItems = document.querySelectorAll('#userList li');
        for (var i = 0; i < chatItems.length; i++) {
            chatItems[i].addEventListener('click', updateActiveChat);
        }
    }).catch(error => {
        console.error(error);
    });
}
