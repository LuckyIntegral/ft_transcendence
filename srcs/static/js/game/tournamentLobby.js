var g_LobbySocket = null;

class TournamentLobby {
    constructor() {
        this.lobbySocket = null;
        this.game_token = null;
        this.clickHandler = this.clickHandler.bind(this);
    }

    join(lobbyToken) {
        this.lobbySocket = new WebSocket(`wss://${window.location.host}/ws/tournament/${lobbyToken}/`);
        g_LobbySocket = this.lobbySocket;

        this.createCanvas()
        this.setUpCanvas()

        this.lobbySocket.onopen = () => {
            this.lobbySocket.send(JSON.stringify({ auth_header: "Bearer " + localStorage.getItem("access") }));
        };
        this.lobbySocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.stage === "None") {
                this.displayLobbyNotFoundMessage();
            }
            if (data.stage === "tournament_over") {
                this.displayGameOverMessage(data.results);
            }
            if (data.stage === "semifinal_game_ready" && data.username === localStorage.getItem("username")) {
                this.game_token = data.game_token;
                this.displayJoinSemifinalGameMessage(data.game_token);
            }
            if (data.stage === "final_game_ready" && data.username === localStorage.getItem("username")) {
                this.game_token = data.game_token;
                this.displayJoinFinalGameMessage(data.game_token);
            }
            if (data.stage === "waiting_for_semifinals" && data.username === localStorage.getItem("username")) {
                this.displaySemifinalsWaitingMessage();
            }
            if (data.stage === "eliminated" && data.username === localStorage.getItem("username")) {
                this.displayEliminatedMessage();
            }
            if (data.stage === "waiting_for_finals" && data.username === localStorage.getItem("username")) {
                this.displayWaitingForFinalsMessage();
            }
            this.lobbySocket.send(JSON.stringify({ type: "pong" }));
        }
        this.lobbySocket.onclose = () => {
        }
    }

    clickHandler() {
        this.joinGame(this.game_token);
    }

    joinGame(game_token) {
        // open new tab with game and switch to it
        window.open(`/#pong?game-token=${game_token}`, "_blank");
        window.focus();
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
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
    }

    setUpCanvas() {
        if (!this.canvas) {
            console.error("Canvas element not found");
            return;
        }
        this.canvas.width = GameConstants.GAME_WIDTH;
        this.canvas.height = GameConstants.GAME_HEIGHT;
    }

    displayEliminatedMessage() {
        this.clearCanvas();
        this.context.fillStyle = "WHITE";
        this.context.font = "30px Arial";
        this.context.textAlign = "center";
        this.context.fillText(
            "You have been eliminated from the tournament.",
            GameConstants.GAME_WIDTH / 2,
            GameConstants.GAME_HEIGHT / 2
        );
        this.canvas.removeEventListener("click", this.clickHandler);
    }

    displayWaitingForFinalsMessage() {
        this.clearCanvas();
        this.context.fillStyle = "WHITE";
        this.context.font = "30px Arial";
        this.context.textAlign = "center";
        this.context.fillText(
            "Waiting for the finals to begin...",
            GameConstants.GAME_WIDTH / 2,
            GameConstants.GAME_HEIGHT / 2
        );
        this.canvas.removeEventListener("click", this.clickHandler);
    }

    displaySemifinalsWaitingMessage() {
        this.clearCanvas();
        this.context.fillStyle = "WHITE";
        this.context.font = "30px Arial";
        this.context.textAlign = "center";
        this.context.fillText(
            "Waiting for all participants...",
            GameConstants.GAME_WIDTH / 2,
            GameConstants.GAME_HEIGHT / 2
        );
        this.canvas.removeEventListener("click", this.clickHandler);
    }

    displayFinalsWaitingMessage() {
        this.clearCanvas();
        this.context.fillStyle = "WHITE";
        this.context.font = "30px Arial";
        this.context.textAlign = "center";
        this.context.fillText(
            "Waiting for all participants...",
            GameConstants.GAME_WIDTH / 2,
            GameConstants.GAME_HEIGHT / 2
        );
        this.canvas.removeEventListener("click", this.clickHandler);
    }

    displayJoinSemifinalGameMessage(game_token) {
        this.clearCanvas();
        this.context.fillStyle = "WHITE";
        this.context.font = "30px Arial";
        this.context.textAlign = "center";
        this.context.fillText(
            "Your semifinal game is ready.\nClick to join the game",
            GameConstants.GAME_WIDTH / 2,
            GameConstants.GAME_HEIGHT / 2
        );
        this.canvas.removeEventListener("click", this.clickHandler);
        this.canvas.addEventListener("click", this.clickHandler);
    }

    displayJoinFinalGameMessage(game_token) {
        this.clearCanvas();
        this.context.fillStyle = "WHITE";
        this.context.font = "30px Arial";
        this.context.textAlign = "center";
        this.context.fillText(
            "Your final game is ready.\nClick to join the game",
            GameConstants.GAME_WIDTH / 2,
            GameConstants.GAME_HEIGHT / 2
        );
        this.canvas.removeEventListener("click", this.clickHandler);
        this.canvas.addEventListener("click", this.clickHandler);
    }

    displayGameOverMessage(results) {
        this.clearCanvas();
        this.canvas.removeEventListener("click", this.clickHandler);
        this.context.fillStyle = "WHITE";
        this.context.font = "40px Arial";
        this.context.textAlign = "center";
        this.context.fillText(
            "Tournament Over",
            GameConstants.GAME_WIDTH / 2,
            GameConstants.GAME_HEIGHT / 2
        );
        this.context.font = "20px Arial";
        this.context.fillText(
            "Results:",
            GameConstants.GAME_WIDTH / 2,
            GameConstants.GAME_HEIGHT / 2 + 30
        );
        this.context.font = "15px Arial";
        if (!Array.isArray(results)) {
            this.context.fillText(
                "Loading...",
                GameConstants.GAME_WIDTH / 2,
                GameConstants.GAME_HEIGHT / 2 + 50
            );
            return;
        }
        if (results.length === 0) {
            this.context.fillText(
                "Tournament was cancelled.",
                GameConstants.GAME_WIDTH / 2,
                GameConstants.GAME_HEIGHT / 2 + 50
            );
            return;
        }
        for (let i = 0; i < results.length; i++) {
            this.context.fillText(
                `${results[i].username}, aka ${results[i].displayName}: ${results[i].place}`,
                GameConstants.GAME_WIDTH / 2,
                GameConstants.GAME_HEIGHT / 2 + 50 + i * 20
            );
        }
    }

    displayLobbyNotFoundMessage() {
        this.clearCanvas();
        this.context.fillStyle = "WHITE";
        this.context.font = "30px Arial";
        this.context.textAlign = "center";
        this.context.fillText(
            "Lobby not found.",
            GameConstants.GAME_WIDTH / 2,
            GameConstants.GAME_HEIGHT / 2
        );
    }

    clearCanvas() {
        this.context.fillStyle = "BLACK";
        this.context.fillRect(0, 0, GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT);
    }

}
