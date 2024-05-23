var g_LobbySocket = null;

class TournamentLobby {
    constructor() {
        this.lobbySocket = null;
        this.playerId = null;
        this.playersConnected;
        this.gameOver = false;
    }

    join(lobbyToken) {
        this.lobbySocket = new WebSocket(`ws://${window.location.host}/ws/tournament/${lobbyToken}/`);
        g_LobbySocket = this.lobbySocket;

        this.lobbySocket.onopen = () => {
            console.log(
                `Tournament Lobby WebSocket connection established on ws://${window.location.host}/ws/game/${gameToken}/.`
            );
            this.lobbySocket.send(JSON.stringify({ auth_header: "Bearer " + localStorage.getItem("access") }));
        };
    }

    createCanvas() {
        const content = document.getElementById("content");
        if (content === null) {
            console.error("Content is null");
            return;
        }
        const canvas = document.createElement("canvas");
        canvas.id = "game";
        content.textContent = "";
        content.appendChild(canvas);
        console.log("Canvas created");
    }

    setUpCanvas() {
        this.canvas = document.getElementById("game");
        if (!this.canvas) {
            console.error("Canvas element not found");
            return;
        }
        this.context = this.canvas.getContext("2d");
        this.canvas.width = GameConstants.GAME_WIDTH;
        this.canvas.height = GameConstants.GAME_HEIGHT;
        console.log("Canvas set up");
    }

    displayWaitingMessage() {
        this.createCanvas()
        this.setUpCanvas()
        this.clearCanvas();
        this.context.fillStyle = "WHITE";
        this.context.font = "40px Arial";
        this.context.textAlign = "center";
        this.context.fillText(
            "Waiting for participants...",
            GameConstants.GAME_WIDTH / 2,
            GameConstants.GAME_HEIGHT / 2
        );
    }

    clearCanvas() {
        this.context.fillStyle = "BLACK";
        this.context.fillRect(0, 0, GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT);
    }

}
