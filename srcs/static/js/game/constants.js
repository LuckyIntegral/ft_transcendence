const GameConstants = {
  WINNING_SCORE: 5,
  BALL_SPEED: 6,
  BALL_BASE_ACCELERATION: 8,
  BALL_ACCELERATION_RATE: 1.02,
  BALL_RADIUS: 10,
  BALL_COLOR: 'WHITE',
  GAME_WIDTH: 800,
  GAME_HEIGHT: 600,
  PADDLE_WIDTH: 10,
  PADDLE_HEIGHT: 100,
  PADDLE_PADDING: 10,
  PLAYER_SPEED: 10,
  AI_SPEED: 1.1
}

const GameModes = {
  PLAYER_VS_AI: 0,
  PLAYER_VS_PLAYER: 1
}

const MenuConstants = {
  BUTTON_WIDTH: 400,
  BUTTON_HEIGHT: 50,
  BUTTON_INTENSITY: 100,
  BUTTON_COLOR: 'WHITE'
}

const PlayerPosition = {
  PLAYER1: {
    x: 20,
    y: GameConstants.GAME_HEIGHT / 2 - 50
  },
  PLAYER2: {
    x: GameConstants.GAME_WIDTH - 30,
    y: GameConstants.GAME_HEIGHT / 2 - 50
  }
}