// import loadGamePage from './game.js';
// import loadProfilePage from './profile.js';

// Define your routes
document.addEventListener('DOMContentLoaded', function() {
    function closeChatSocket() {
        if (chatSocket) {
            chatSocket.close();
        }
    }
    var routes = {
        'profile': function() {
            closeChatSocket();
            loadProfilePage();
        },
        'pong': function() {
            closeChatSocket();
            loadGamePage();
        },
        'friends': function() {
            closeChatSocket();
            loadFriendsPage();
        },
        'leadrboard': function() {
            closeChatSocket();
            loadLeaderboardPage();
        },
        'messages': function() {
            closeChatSocket();
            loadMessagesPage();
        },
        'default': function() {
            closeChatSocket();
            document.getElementById('content').textContent = 'Default page';
        }
    };

    // Function to handle hash changes
    function handleHashChange() {
        validateToken();
        if (localStorage.getItem('access') === null) {
            window.location.hash = 'default';
            return;
        }
        var hash = window.location.hash.slice(1);  // Remove the '#' from the hash
        var routeFunction = routes[hash];
        if (routeFunction) {
            routeFunction();
        } else {
            routes['default']();
        }
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    // Handle the initial hash
    handleHashChange();
});

//document.addEventListener('DOMContentLoaded', function() {
//    document.getElementById('friendRequestInput').addEventListener('input', searchForLater);
//});
