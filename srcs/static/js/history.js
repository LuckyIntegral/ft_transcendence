document.addEventListener("DOMContentLoaded", function () {
    var query_params = null;

    function closeSockets() {
        if (chatSocket !== null) {
            chatSocket.close();
            chatSocket = null;
        }
        if (g_GameSocket !== null) {
            g_GameSocket.close();
            g_GameSocket = null;
        }
    }
    var routes = {
        profile: function () {
            closeSockets();
            loadProfilePage();
        },
        pong: function () {
            closeSockets();
            if (query_params === null || query_params === undefined) {
                let menu = new Menu();
                menu.start();
            } else {
                var gameToken = query_params.split("=")[1];
                let game = new Game(gameToken);
                game.loadGame(GameModes.PLAYER_VS_PLAYER);
                query_params = null;
            }
        },
        pong3d: function() {
            let menu3d = new Menu3D()
            menu3d.start()
            previousRoute = 'pong3d';
        },
        friends: function () {
            closeSockets();
            loadFriendsPage();
        },
        leadrboard: function () {
            closeSockets();
            loadLeaderboardPage();
        },
        messages: function () {
            closeSockets();
            loadMessagesPage();
        },
        default: function () {
            closeSockets();
            document.getElementById("content").textContent = "Default page";
        },
    };

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
