class Lobby {
    constructor() {
        this.gameSocket = null;
        this.playerId = null;
        this.playersConnected = 0;
    }

    join(gameToken, game) {
        this.gameSocket = new WebSocket(`ws://${window.location.host}/ws/game/${gameToken}/`);
        this.game = game;

        this.gameSocket.onopen = () => {
            console.log(`Game WebSocket connection established on ws://${window.location.host}/ws/game/${gameToken}/.`);
            this.gameSocket.send(JSON.stringify({ auth_header: "Bearer " + localStorage.getItem("access") }));
        };

        this.gameSocket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            console.log("Received data", data);
            if (data.event === "assign_role") {
                this.playerId = data.role;
                this.game.playerId = data.role;
                console.log(`Assigned role: ${this.playerId}`);
            }

            if (data.event === "player_connected") {
                this.playersConnected = data.players_connected;
                if (data.isFinished === true || this.playersConnected === 69) {
                    console.log("Game is finished. Displaying end game message.");
                    this.game.drawEndGameMessage(`GAME OVER! ${data.winner} WINS!`);
                    window.removeEventListener("keydown", this.boundKeyPress);
                    window.removeEventListener("keyup", this.boundKeyPress);
                    this.gameOver = true;
                } else if (data.isExpired === true) {
                    window.removeEventListener("keydown", this.boundKeyPress);
                    window.removeEventListener("keyup", this.boundKeyPress);
                    console.log("Game has expired. Displaying end game message.");
                    this.gameOver = true;
                } else if (this.playersConnected === 2) {
                    console.log("Both players connected. Starting game.");
                    this.game.startCountdown();
                }
                console.log(`Players connected: ${this.playersConnected}`);
            }

            if (data.event === "game_move") {
                this.game.updatePositions(data.player1_pos, data.player2_pos, data.ball_pos, data.update_type);
            }
        };

        this.gameSocket.onclose = () => {
            console.log("Game WebSocket connection closed.");
        };

        this.gameSocket.onerror = (e) => {
            console.error("Game WebSocket error:", e);
        };
    }

    sendGameData(data) {
        if (this.gameSocket.readyState === WebSocket.OPEN) {
            data.event = "move";
            this.gameSocket.send(JSON.stringify(data));
        }
    }
}
