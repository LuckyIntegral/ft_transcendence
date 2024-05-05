// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Tournament {
    struct Player {
        string name;
        uint place;
    }

    struct Game {
        string name;
        mapping(uint => Player) players;
        uint playerCount;
    }

    mapping(uint => Game) public games;
    uint public gameCount;
    event GameCreated(uint256 gameId);

    function createGame(string memory _name, string[] memory _playerNames, uint[] memory _playerPlaces) public returns (uint) {
        require(_playerNames.length == _playerPlaces.length, "Names and places arrays must have the same length");

        uint gameId = gameCount++;
        Game storage game = games[gameId];
        game.name = _name;

        for (uint i = 0; i < _playerNames.length; i++) {
            game.players[game.playerCount++] = Player(_playerNames[i], _playerPlaces[i]);
        }

        emit GameCreated(gameId);
        return gameId;
    }

    function getGameName(uint _gameId) public view returns (string memory) {
        return games[_gameId].name;
    }

    function getPlayerName(uint _gameId, uint _playerId) public view returns (string memory) {
        return games[_gameId].players[_playerId].name;
    }

    function getPlayerPlace(uint _gameId, uint _playerId) public view returns (uint) {
        return games[_gameId].players[_playerId].place;
    }
}
