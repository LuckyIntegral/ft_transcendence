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

        if (g_LobbySocket !== null) {
            g_LobbySocket.close();
            g_LobbySocket = null;
        }
    }

    function cleanUpContentStyles() {
        document.getElementById("content").style = "";
    }

    function removePopups() {
        var profilePopup = document.getElementById("profile-popup");
        if (profilePopup !== null) {
            profilePopup.remove();
        }
        var searchPopup = document.getElementById("searchPopup");
        if (searchPopup !== null) {
            searchPopup.remove();
        }
    }

    var routes = {
        profile: function () {
            removePopups();
            closeSockets();
            cleanUpContentStyles();
            loadProfilePage();
        },
        pong: function () {
            removePopups();
            cleanUpContentStyles();
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
            removePopups();
            cleanUpContentStyles();
            closeSockets();
            if (query_params === null || query_params === undefined) {
                let menu = new Menu3D();
                menu.start();
            } else {
                const img = new Image()
                img.onload = () => {
                  intro3dImage = img;
                  var gameToken = query_params.split("=")[1];
                  let game = new Game3D(gameToken);
                  game.loadGame(GameModes.PLAYER_VS_PLAYER);
                  query_params = null;
                }
                img.src = "static/images/tabletenis.jpg"
            }
        },
        friends: function () {
            removePopups();
            cleanUpContentStyles();
            closeSockets();
            loadFriendsPage();
        },
        leadrboard: function () {
            removePopups();
            cleanUpContentStyles();
            closeSockets();
            loadLeaderboardPage();
        },
        messages: function () {
            removePopups();
            cleanUpContentStyles();
            closeSockets();
            loadMessagesPage();
        },
        tournamentslobby: function () {
            removePopups();
            cleanUpContentStyles();
            closeSockets();
            if (query_params === null || query_params === undefined) {
                let menu = new Menu();
                menu.start();
            } else {
                var tournamentLobby = new TournamentLobby();
                var lobbyToken = query_params.split("=")[1];
                tournamentLobby.join(lobbyToken);
            }
        },
        tournamentmenu: function () {
            closeSockets();
            removePopups();
            cleanUpContentStyles();
            let tournamentMenu = new TournamentMenu();
            tournamentMenu.start();
        },
        default: function () {
            removePopups();
            cleanUpContentStyles();
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
