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
                    game.adjustToPlayerRole(data.role);
                }
            }

            if (data.event === "player_connected") {
                this.playersConnected = data.players_connected;
                if (data.isFinished === true) {
                    this.gameOver = true;
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
                    this.game.startCountdown();
                }
            }
            if (data.event === "game_move" && this.gameOver === false) {
                // console.log("Received game move data.");
                this.game.updatePositions(data.player1_pos, data.player2_pos, data.ball_pos, data.update_type);
            }
        };

        this.gameSocket.onclose = () => {
        };

        this.gameSocket.onerror = (e) => {
        };
    }

    sendGameData(data) {
        if (this.gameSocket.readyState === WebSocket.OPEN && this.gameOver === false) {
            data.event = "move";
            this.gameSocket.send(JSON.stringify(data));
        }
    }
}
