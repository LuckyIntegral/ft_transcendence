var g_LobbySocket = null;

class TournamentLobby {
    constructor() {
        this.lobbySocket = null;
    }

    join(lobbyToken) {
        this.lobbySocket = new WebSocket(`ws://${window.location.host}/ws/tournament/${lobbyToken}/`);
        g_LobbySocket = this.lobbySocket;

        this.createCanvas()
        this.setUpCanvas()

        this.lobbySocket.onopen = () => {
            console.log(
                `Tournament Lobby WebSocket connection established on ws://${window.location.host}/ws/game/${lobbyToken}/.`
            );
            this.lobbySocket.send(JSON.stringify({ auth_header: "Bearer " + localStorage.getItem("access") }));
        };
        this.lobbySocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.stage === "tournament_over") {
                this.displayGameOverMessage(data.results);
            }
            if (data.stage === "semifinal_game_ready" && data.username === localStorage.getItem("username")) {
                this.displayJoinSemifinalGameMessage(data.game_token);
            }
            if (data.stage === "final_game_ready" && data.username === localStorage.getItem("username")) {
                this.displayJoinFinalGameMessage(data.game_token);
            }
            if (data.stage === "waiting_for_semifinals" && data.username === localStorage.getItem("username")) {
                this.displaySemifinalsWaitingMessage();
            }
            console.log(data.stage)
            console.log(data.username)
            console.log(localStorage.getItem("username"))
            this.lobbySocket.send(JSON.stringify({ type: "pong" }));
        }
        this.lobbySocket.onclose = () => {
            console.log("Tournament Lobby WebSocket connection closed.");
        }
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
        console.log("Canvas created");
    }

    setUpCanvas() {
        if (!this.canvas) {
            console.error("Canvas element not found");
            return;
        }
        this.canvas.width = GameConstants.GAME_WIDTH;
        this.canvas.height = GameConstants.GAME_HEIGHT;
        console.log("Canvas set up");
    }

    displaySemifinalsWaitingMessage() {
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

    displayJoinSemifinalGameMessage(game_token) {
        this.clearCanvas();
        this.context.fillStyle = "WHITE";
        this.context.font = "40px Arial";
        this.context.textAlign = "center";
        this.context.fillText(
            "Your semifinal game is ready.\nClick to join the game",
            GameConstants.GAME_WIDTH / 2,
            GameConstants.GAME_HEIGHT / 2
        );
        this.canvas.addEventListener("click", () => {
            this.joinGame(game_token);
        });
    }

    displayJoinFinalGameMessage(game_token) {
        this.clearCanvas();
        this.context.fillStyle = "WHITE";
        this.context.font = "40px Arial";
        this.context.textAlign = "center";
        this.context.fillText(
            "Your final game is ready.\nClick to join the game",
            GameConstants.GAME_WIDTH / 2,
            GameConstants.GAME_HEIGHT / 2
        );
        this.canvas.removeEventListener("click", () => {
            this.joinGame(game_token);
        });
        this.canvas.addEventListener("click", () => {
            this.joinGame(game_token);
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
