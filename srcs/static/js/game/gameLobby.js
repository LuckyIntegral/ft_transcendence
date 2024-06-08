var g_GameSocket = null;

class GameLobby {
    constructor() {
        this.gameSocket = null;
        this.playerId = null;
        this.playersConnected = 0;
        this.gameOver = false;
    }

    join(gameToken, game) {
        this.gameSocket = new WebSocket(`wss://${window.location.host}/ws/game/${gameToken}/`);
        g_GameSocket = this.gameSocket;
        this.game = game;

        this.gameSocket.onopen = () => {
            console.log(`Game WebSocket connection established on wss://${window.location.host}/ws/game/${gameToken}/.`);
            this.gameSocket.send(JSON.stringify({ auth_header: "Bearer " + localStorage.getItem("access") }));
        };

        this.gameSocket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.event === "assign_role") {
                this.playerId = data.role;
                this.game.playerId = data.role;
                if (this.game instanceof Game3D) {
					this.game.userName = data.username;
					this.game.opponentName = data.opponent;
					console.log('Opponent name: ' + data.opponent);
                    game.adjustToPlayerRole(data.role);
                }
                console.log(`Assigned role: ${this.playerId}`);
            }

            if (data.event === "player_connected") {
                this.playersConnected = data.players_connected;
                console.log(data);
                if (data.isFinished === true) {
                    this.gameOver = true;
                    console.log("Game is finished. Displaying end game message.");
                    if (this.game instanceof Game3D) {
                    	this.game.drawEndGameMessage(`${data.winner} WON!`, game.userName, game.opponentName, 
						 `${data.hostScore}`,`${data.guestScore}`);
					}
					else {
                    	this.game.drawEndGameMessage(`GAME OVER! ${data.winner} WON!`);
					}
                    // this.game.drawEndGameMessage(`GAME OVER! ${data.winner} WINS!`);
                    window.removeEventListener("keydown", this.boundKeyPress);
                    window.removeEventListener("keyup", this.boundKeyPress);
                } else if (data.isExpired === true) {
                    this.gameOver = true;
                    window.removeEventListener("keydown", this.boundKeyPress);
                    window.removeEventListener("keyup", this.boundKeyPress);
                    this.game.drawEndGameMessage("Invitation link expired.");
                } else if (this.playersConnected === 2) {
                    console.log("Both players connected. Starting game.");
                    this.game.startCountdown();
                }
                console.log(`Players connected: ${this.playersConnected}`);
            }
            if (data.event === "game_move" && this.gameOver === false) {
                // console.log("Received game move data.");
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
        if (this.gameSocket.readyState === WebSocket.OPEN && this.gameOver === false) {
            data.event = "move";
            this.gameSocket.send(JSON.stringify(data));
        }
    }
}
