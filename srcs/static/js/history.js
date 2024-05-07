// import loadGamePage from './game.js';
// import loadProfilePage from './profile.js';

// Define your routes
var previousRoute = null;

function checkAndReload() {
    if (previousRoute === 'pong') {
        location.reload();
    }
}

// Define your routes
document.addEventListener('DOMContentLoaded', function() {
    var routes = {
        'profile': function() {
            checkAndReload();
            loadProfilePage();
            previousRoute = 'profile';
        },
        'pong': function() {
            loadGamePage();
            previousRoute = 'pong';
        },
        'friends': function() {
            checkAndReload();
            loadFriendsPage();
            previousRoute = 'friends';
        },
        'leadrboard': function() {
            checkAndReload();
            loadLeaderboardPage();
            previousRoute = 'leadrboard';
        },
        'messages': function() {
            checkAndReload();
            loadMessagesPage();
            previousRoute = 'messages';
        },
        'default': function() {
            checkAndReload();
            document.getElementById('content').textContent = 'Default page';
            previousRoute = 'default';
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
