var chatSocket = null;
var chatToken = null;

function createSearchResultItem(data, popup) {
    var li = document.createElement("li");
    li.setAttribute("class", "clearfix");
    li.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <img src="${data["picture"]}" alt="avatar">
                        <div class="name">${data["username"]}</div>
                        <button class="add-button btn btn-secondary" data-username="${data["username"]}" data-token="${data["token"]}">
                            <span class="material-symbols-outlined">
                                add_comment
                            </span>
                        </button>
                    </div>
                    `;
    li.querySelector(".add-button").addEventListener("click", function () {
        var chatToken = this.getAttribute("data-token");
        fetchWithToken("/api/chat/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("token"),
            },
            body: JSON.stringify({
                username: data["username"],
            }),
        })
            .then((response) => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error("Failed to create chat");
            })
            .then((data) => {
                chatToken = data["token"];
                getUserListChats();
                popup.remove();
            })
            .catch((error) => {
                alertError("Something went wrong. Please try again later.");
            });
    });
    return li;
}

function setAddChatButtonListener() {
    var addChatButton = document.getElementById("addChatButton");
    addChatButton.removeEventListener("click", createUserSearchPopup);
    addChatButton.addEventListener("click", createUserSearchPopup);
}

function scrollDownMessageList() {
    var messageList = document.getElementById("messagesList");
    var lastMessage = messageList.lastElementChild;
    lastMessage.scrollIntoView();
}

function loadMessagesPage() {
    var messagesPage = document.createElement("section");
    messagesPage.setAttribute("style", "background-color: #eee;");

    fetch("/static/templates/messages.html")
        .then((response) => response.text())
        .then((data) => {
            messagesPage.innerHTML = data;
            document.getElementById("content").innerHTML = "";
            document.getElementById("content").appendChild(messagesPage);
        })
        .then(() => {
            document.getElementById("messagesList").innerHTML = "";
            getUserListChats();
        });
}

function createIncomeMessageItemLi(message, time, avatarUrl) {
    var li = document.createElement("li");
    li.setAttribute("class", "clearfix");
    li.setAttribute("style", "text-align: left;");
    li.innerHTML = `<div class="message-data">
                        <img src=${avatarUrl} alt="avatar">
                        <span class="message-data-time" data-timestamp="${time}">${formatTimestamp(time)}</span>
                    </div>
                    <div class="message my-message message-content" >${message}</div>
                    `;
    return li;
}

function createOutcomeMessageItemLi(message, time, avatarUrl) {
    var li = document.createElement("li");
    li.setAttribute("class", "clearfix");
    li.setAttribute("style", "text-align: right;");
    li.innerHTML = `<div class="message-data">
                        <span class="message-data-time" data-timestamp="${time}">${formatTimestamp(time)}</span>
                        <img src=${avatarUrl} alt="avatar">
                    </div>
                    <div class="message other-message float-right message-content">${message}</div>
                    `;
    return li;
}

function createUserListItemLi(data, type) {
    var li = document.createElement("li");
    var unreadLine = `<div class="unread-indicator" style="display: none;">
                        <span class="icon">✉️</span>
                        <span class="text">New message</span>
                    </div>
                    `;
    if (type === "active") {
        li.setAttribute("class", "clearfix active");
    } else if (data["isRead"]) {
        li.setAttribute("class", "clearfix");
    } else {
        li.setAttribute("class", "clearfix unread");
        unreadLine = `<div class="unread-indicator">
                        <span class="icon">✉️</span>
                        <span class="text">New message</span>
                    </div>
                    `;
    }
    if (data["isOnline"]) {
        statusLine = `<div class="status"> <i class="fa fa-circle online"></i> <span>Online</span> </div>`;
    } else {
        statusLine = `<div class="status"> <i class="fa fa-circle offline"></i> <span class="chat-timestamp" data-timestamp="${
            data["lastOnline"]
        }">last seen ${formatTimestamp(data["lastOnline"])}</span> </div>`;
    }
    li.setAttribute("data-timestamp", data["lastTimestamp"]);
    li.setAttribute("data-chat-token", data["token"]);
    li.innerHTML = `<img src="${data["picture"]}" alt="avatar">
                    <div class="about">
                        <div class="name">${data["username"]}</div>
                        ${statusLine}
                    </div>
                    ${unreadLine}
                    `;
    return li;
}

function createChatHeader(data) {
    var div = document.createElement("div");
    if (data["blocked"]) {
        var blockButton = `<button class="block-button btn btn-success" id="blockButton">Unblock</button>`;
    } else {
        var blockButton = `<button class="block-button btn btn-danger" id="blockButton">Block</button>`;
    }
    div.setAttribute("class", "col-lg-6");
    div.innerHTML = `<img src="${localStorage.getItem("companionPicture")}" alt="avatar">
                    <div class="chat-about">
                        <h6 class="m-b-0">${data["username"]}</h6>
                    </div>
                    ${blockButton}
                    `;
    blockButton = div.querySelector(".block-button");
    blockButton.addEventListener("click", function () {
        fetchWithToken("/api/users/block/", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("token"),
            },
            body: JSON.stringify({
                username: data["username"],
            }),
        })
            .then((response) => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error("Failed to block user");
            })
            .then((data) => {
                alertSuccess(data["status"]);
                if (data["button"] === "Block") {
                    blockButton.setAttribute("class", "block-button btn btn-danger");
                } else {
                    blockButton.setAttribute("class", "block-button btn btn-success");
                }
                blockButton.textContent = data["button"];
            })
            .catch((error) => {
                alertError("Something went wrong. Please try again later.");
            });
    });
    return div;
}

function getChatMessages() {
    fetchWithToken("/api/chat/", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
            token: chatToken,
        }),
    })
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error("Failed to load messages");
        })
        .then((data) => {
            var chatHeader = document.getElementById("chat-header");
            chatHeader.innerHTML = "";
            chatHeader.appendChild(createChatHeader(data));
            localStorage.setItem("myPicture", data["myPicture"]);
            document.getElementById("messagesList").innerHTML = "";
            data["messages"].forEach((message) => {
                if (message["sender"] !== localStorage.getItem("username")) {
                    document
                        .getElementById("messagesList")
                        .appendChild(
                            createIncomeMessageItemLi(message["message"], message["timestamp"], message["picture"])
                        );
                } else {
                    document
                        .getElementById("messagesList")
                        .appendChild(
                            createOutcomeMessageItemLi(message["message"], message["timestamp"], data["myPicture"])
                        );
                }
            });
            if (data["messages"].length > 0) {
                scrollDownMessageList();
            }
        })
        .catch((error) => {
            console.error(error);
        });
}

function connectToSocket() {
    chatSocket = new WebSocket(`ws://${window.location.host}/ws/chat/${chatToken}/`);
    chatSocket.onopen = function (event) {
        chatSocket.send(
            JSON.stringify({
                token: "Bearer " + localStorage.getItem("access"),
            })
        );
    };
    chatSocket.onmessage = function (event) {
        var data = JSON.parse(event.data);
        if (data["blocked"]) {
            alertError(data["blocked"]);
        } else if (data["sender"] !== localStorage.getItem("username")) {
            document
                .getElementById("messagesList")
                .appendChild(
                    createIncomeMessageItemLi(
                        data["message"],
                        data["timestamp"],
                        localStorage.getItem("companionPicture")
                    )
                );
            scrollDownMessageList();
        } else {
            document
                .getElementById("messagesList")
                .appendChild(
                    createOutcomeMessageItemLi(data["message"], data["timestamp"], localStorage.getItem("myPicture"))
                );
            scrollDownMessageList();
        }
    };
    // chatSocket.onclose = function(event) {

    // };
    chatSocket.onerror = function (error) {
        console.error("Error: " + error.message);
    };
    return chatSocket;
}

function sendMessage() {
    var message = document.getElementById("messageInput").value;
    if (message === "") {
        return;
    }
    chatSocket.send(
        JSON.stringify({
            sender: localStorage.getItem("username"),
            message: message,
            timestamp: new Date().toISOString(),
        })
    );
    document.getElementById("messageInput").value = "";
    var now = new Date().toISOString();
    var li = document.querySelector("li.active");
    li.setAttribute("data-timestamp", now);
    var list = $("#userList");
    var listItems = list.children("li");
    if (listItems.length === 0) {
        return;
    }
    listItems.sort(function (a, b) {
        var dateA = new Date($(a).data("timestamp"));
        var dateB = new Date($(b).data("timestamp"));
        return dateB - dateA;
    });
    list.empty().append(listItems);
}

function updateActiveChat() {
    chatToken = this.getAttribute("data-chat-token");
    var chatItems = document.querySelectorAll("#userList li");
    for (var i = 0; i < chatItems.length; i++) {
        var itemStatus = chatItems[i].getAttribute("class");
        if (itemStatus === "clearfix active") {
            chatItems[i].setAttribute("class", "clearfix");
            chatItems[i].addEventListener("click", updateActiveChat);
        }
    }
    this.setAttribute("class", "clearfix active");
    this.removeEventListener("click", updateActiveChat);
    unreadDiv = this.querySelector(".unread-indicator");
    if (unreadDiv) {
        unreadDiv.setAttribute("style", "display: none;");
    }
    var imgElement = this.querySelector("img");
    var companionPicture = imgElement.src;
    localStorage.setItem("companionPicture", companionPicture);
    getChatMessages();
    if (chatSocket) {
        chatSocket.close();
    }
    chatSocket = connectToSocket();
    document.getElementById("inputDiv").setAttribute("style", "");
    document.getElementById("messageInput").addEventListener("keypress", function (event) {
        if (event.keyCode === 13) {
            if (!event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        }
    });
    document.getElementById("userList").setAttribute("style", "height: 550px;");
}

function getUserListChats() {
    fetchWithToken("/api/messages/", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
    })
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error("Failed to load messages");
        })
        .then((data) => {
            var chatsList = document.getElementById("userList");
            chatsList.innerHTML = "";
            data.forEach((chat) => {
                chatsList.appendChild(createUserListItemLi(chat, "inactive"));
            });
            var chatItems = document.querySelectorAll("#userList li");
            for (var i = 0; i < chatItems.length; i++) {
                chatItems[i].addEventListener("click", updateActiveChat);
            }
        })
        .then(function () {
            $(document).ready(function () {
                $("#searchInput").on("keyup", function () {
                    var value = $(this).val().toLowerCase();
                    $("#userList li").filter(function () {
                        $(this).toggle($(this).find(".name").text().toLowerCase().indexOf(value) > -1);
                    });
                });
            });
            setAddChatButtonListener();
        })
        .catch((error) => {
            console.error(error);
        });
}
