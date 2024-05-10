var socket;
var chatToken;

function createSearchResultItem(data, popup) {
    var li = document.createElement('li');
    li.setAttribute('class', 'clearfix');
    li.innerHTML = `<div class="about">
                        <img src="${data['picture']}" alt="avatar">
                        <div class="name">${data['username']}</div>
                    </div>
                    <div class="button-container">
                        <button class="add-button" data-username="${data['username']}" data-token="${data['token']}">Add chat</button>
                    </div>
                    `;
    li.querySelector('.add-button').addEventListener('click', function() {
        var chatToken = this.getAttribute('data-token');
        fetchWithToken('/api/chat/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
            },
            body: JSON.stringify({
                'username': data['username'],
            })
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Failed to create chat');
        })
        .then(data => {
            chatToken = data['token'];
            getUserListChats();
            popup.remove();
        })
        .catch(error => {
            alertError("Something went wrong. Please try again later.");
        });
    });
    return li;
}

function setAddChatButtonListener() {
    var addChatButton = document.getElementById('addChatButton');
    addChatButton.removeEventListener('click', createUserSearchPopup);
    addChatButton.addEventListener('click', createUserSearchPopup);
}

function scrollDownMessageList() {
    var messageList = document.getElementById('messagesList');
    var lastMessage = messageList.lastElementChild;
    lastMessage.scrollIntoView();
}

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
                    <div class="message my-message message-content" >${message}</div>
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
                    <div class="message other-message float-right message-content">${message}</div>
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


function getChatMessages() {
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
            if (message['sender'] !== localStorage.getItem('username')) {
                document.getElementById('messagesList').appendChild(createIncomeMessageItemLi(message['message'], formatTimestamp(message['timestamp']), message['picture']));
            } else {
                document.getElementById('messagesList').appendChild(createOutcomeMessageItemLi(message['message'], formatTimestamp(message['timestamp']), message['picture']));
            }
        })
        scrollDownMessageList();
    })
    .catch(error => {
        console.error(error);
    });
}

function connectToSocket() {
    socket = new WebSocket(`ws://${window.location.host}/ws/chat/${chatToken}/`);
    socket.onmessage = function(event) {
        var data = JSON.parse(event.data);
        if (data['sender'] !== localStorage.getItem('username')) {
            document.getElementById('messagesList').appendChild(createIncomeMessageItemLi(data['message'], formatTimestamp(data['timestamp']), localStorage.getItem('companionPicture')));
            scrollDownMessageList();
        } else {
            document.getElementById('messagesList').appendChild(createOutcomeMessageItemLi(data['message'], formatTimestamp(data['timestamp']), localStorage.getItem('companionPicture')));
            scrollDownMessageList();
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

function sendMessage() {
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

function updateActiveChat() {
    chatToken = this.getAttribute('data-chat-token');
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
    var imgElement = this.querySelector('img');
    var companionPicture = imgElement.src
    console.log(companionPicture);
    localStorage.setItem('companionPicture', companionPicture);
    getChatMessages();
    if (socket) {
        socket.close();
    }
    socket = connectToSocket();
    document.getElementById('inputDiv').setAttribute('style', '');
    document.getElementById('messageInput').addEventListener('keypress', function(event) {
        if (event.keyCode === 13) {
            if (!event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
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
    }).then(function() {
        $(document).ready(function(){
            $('#searchInput').on('keyup', function(){
                var value = $(this).val().toLowerCase();
                $("#userList li").filter(function() {
                    $(this).toggle($(this).find('.name').text().toLowerCase().indexOf(value) > -1)
                });
            });
        });
        setAddChatButtonListener();
    })
    .catch(error => {
        console.error(error);
    });
}
