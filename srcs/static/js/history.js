var previousRoute = null;

function checkAndReload() {
    if (previousRoute === "pong") {
        location.reload();
    }
}

document.addEventListener("DOMContentLoaded", function () {
    var query_params = null;
    var routes = {
        profile: function () {
            loadProfilePage();
            previousRoute = "profile";
        },
        pong: function () {
            if (query_params === null) {
                let menu = new Menu();
                menu.start();
                previousRoute = "pong";
            } else {
                // to be implemented
            }
        },
        friends: function () {
            loadFriendsPage();
            previousRoute = "friends";
        },
        leadrboard: function () {
            loadLeaderboardPage();
            previousRoute = "leadrboard";
        },
        messages: function () {
            loadMessagesPage();
            previousRoute = "messages";
        },
        default: function () {
            document.getElementById("content").textContent = "Default page";
            previousRoute = "default";
        },
    };

    // Function to handle hash changes
    function handleHashChange() {
        validateToken();
        if (localStorage.getItem("access") === null) {
            window.location.hash = "default";
            return;
        }
        var hash = window.location.hash.slice(1); // Remove the '#' from the hash
        parts = hash.split("?", 2);
        hash = parts[0];
        query_params = parts[1];
        var routeFunction = routes[hash];
        console.log("hash: " + hash);
        if (routeFunction) {
            routeFunction();
        } else {
            routes["default"]();
        }
    }

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    // Handle the initial hash
    handleHashChange();
});

//document.addEventListener('DOMContentLoaded', function() {
//    document.getElementById('friendRequestInput').addEventListener('input', searchForLater);
//});
