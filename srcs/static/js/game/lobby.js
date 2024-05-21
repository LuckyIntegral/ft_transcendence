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
        };

        this.gameSocket.onmessage = (e) => {
            const data = JSON.parse(e.data);

            if (data.event === "assign_role") {
                this.playerId = data.role;
                this.game.playerId = data.role;
                console.log(`Assigned role: ${this.playerId}`);
            }

            if (data.event === "player_connected") {
                this.playersConnected = data.players_connected;
                if (this.playersConnected === 2) {
                    this.game.start();
                }
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
