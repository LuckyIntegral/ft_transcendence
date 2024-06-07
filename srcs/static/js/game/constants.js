const GameConstants = {
    WINNING_SCORE: 5,
    BALL_SPEED: 6,
    BALL_BASE_ACCELERATION: 8,
    BALL_ACCELERATION_RATE: 1.02,
    BALL_RADIUS: 10,
    BALL_COLOR: "WHITE",
    GAME_WIDTH: 800,
    GAME_HEIGHT: 600,
    PADDLE_WIDTH: 10,
    PADDLE_HEIGHT: 100,
    PADDLE_PADDING: 10,
    PLAYER_SPEED: 10,
    AI_SPEED: 1.1,
    FPS: 120,
    INTERPOLATION_FACTOR: 0.1,
};

const GameConstants3D = {
	GRAVITY: 9.81,
	BALL_RADIUS: 0.03,
	BALL_HEIGHT: 0.2,
	BALL_Y_SPEED: 1.7,
	BALL_X_MAX_SPEED_RATIO: 1.5,
	BALL_RADIUS: 0.04,
    BALL_PAUSE_TIME: 1.0,
	TABLE_MAX_DEPTH: 1.8,
	TABLE_MIN_DEPTH: -1.8,
	TABLE_HALF_WIDTH: 1.0,
	PADL_SCALE : 1.5,
	PADL_H_RANGE: 1.11,   // Paddle horizontal movement range from center
	PADL_V_RANGE: 0.5,  // Paddle vertical movement range from 0 (isn't needed) 
	PADDLE_WIDTH: 0.22,
	PADDLE_YPOS: 0.2,   // Default Paddle height from the table
	PADDLE_DIST_TO_BALL: 0.2,  // Distance from paddle to ball for y movement
    LOADBAR_WIDTH: 500,
    LOADBAR_HEIGHT: 5,
	GAME_OVER_TIME: 1.8,
    EFFECT_DURATION: 0.4,
	EFFECT_OPACITY: 0.4,
	ERROR_RANGE: 0.05,
};

const GameModes = {
    PLAYER_VS_AI: 0,
    PLAYER_VS_PLAYER: 1,
};

const MenuConstants = {
    BUTTON_WIDTH: 400,
    BUTTON_HEIGHT: 50,
    BUTTON_INTENSITY: 100,
    BUTTON_COLOR: "WHITE",
};

const PlayerPosition = {
    PLAYER1: {
        x: 20,
        y: GameConstants.GAME_HEIGHT / 2 - 50,
    },
    PLAYER2: {
        x: GameConstants.GAME_WIDTH - 30,
        y: GameConstants.GAME_HEIGHT / 2 - 50,
    },
};
