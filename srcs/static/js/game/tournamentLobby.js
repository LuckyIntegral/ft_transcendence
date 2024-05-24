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
        this.lobbySocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "ping") {
                this.lobbySocket.send(JSON.stringify({ type: "pong" }));
                if (data.stage === "game_over") {
                    this.displayGameOverMessage(data.results);
                }
                if (data.stage === "assign_semifinals") {
                    this.displaySemifinalsWaitingMessage();
                }
            }
        }
    }

    joinGame(gameToken) {
        // open new tab with game and switch to it
        window.open(`/#pong?game-token=${gameToken}`, "_blank");
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

    displaySemifinalsWaitingMessage() {
        this.createCanvas()
        this.setUpCanvas()
        this.clearCanvas();
        this.context.fillStyle = "WHITE";
        this.context.font = "40px Arial";
        this.context.textAlign = "center";
        this.context.fillText(
            "Waiting for all participants...",
            GameConstants.GAME_WIDTH / 2,
            GameConstants.GAME_HEIGHT / 2
        );
    }

    displayFinalsWaitingMessage() {
        this.clearCanvas();
        this.context.fillStyle = "WHITE";
        this.context.font = "40px Arial";
        this.context.textAlign = "center";
        this.context.fillText(
            "Waiting for all participants...",
            GameConstants.GAME_WIDTH / 2,
            GameConstants.GAME_HEIGHT / 2
        );
    }

    displayJoinGameMessage(gameToken) {
        this.clearCanvas();
        this.context.fillStyle = "WHITE";
        this.context.font = "40px Arial";
        this.context.textAlign = "center";
        this.context.fillText(
            "Your game is ready.\nClick to join the game",
            GameConstants.GAME_WIDTH / 2,
            GameConstants.GAME_HEIGHT / 2
        );
        this.canvas.addEventListener("click", () => {
            this.joinGame(gameToken);
        });
    }

    displayGameOverMessage(results) {
        this.clearCanvas();
        this.context.fillStyle = "WHITE";
        this.context.font = "40px Arial";
        this.context.textAlign = "center";
        this.context.fillText(
            "Game Over",
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
        for (let i = 0; i < results.length; i++) {
            this.context.fillText(
                `${results[i].username}, aka ${results[i].displayName}: ${results[i].place}`,
                GameConstants.GAME_WIDTH / 2,
                GameConstants.GAME_HEIGHT / 2 + 50 + i * 20
            );
        }
    }

    clearCanvas() {
        this.context.fillStyle = "BLACK";
        this.context.fillRect(0, 0, GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT);
    }

}
