class Game3D {
	constructor (lobbyId) {
		this.lobbyId = lobbyId
		this.setListeners()
		this.lobby = new Lobby()
		this.playerId = null
		this.lastUpdateTime = 0
		// this.buffer = null
		this.keystate = {'w': false, 's': false, 'a': false, 'd': false, 'W': false, 'S': false, 'A': false, 'D': false}
		this.isGameStarted = false
		this.updateInterval = 1000 / GameConstants.FPS
	}

	// Initialize the THREE.js scene
	initThreeJs () {
		this.scene = new THREE.Scene()
		this.camera = new THREE.PerspectiveCamera(
			75, GameConstants.GAME_WIDTH / GameConstants.GAME_HEIGHT, 0.1, 1000) 
		this.renderer = new THREE.WebGLRenderer({antialias: true, canvas: this.canvas_three})
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFShadowMap;
		this.renderer.setSize(GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT) //window.innerWidth, window.innerHeight)
		this.renderer.toneMapping = THREE.ReinhardToneMapping;
		this.renderer.toneMappingExposure = 3.0;

		// Create the controls for the camera
		const controls = new OrbitControls(this.camera, this.renderer.domElement)
		controls.enableDamping = true
		controls.dampingFactor = 0.25
		controls.minPolarAngle = 0;
		controls.maxPolarAngle = Math.PI / 2;
		// controls.minAzimuthAngle = -Math.PI / 2;
		// controls.maxAzimuthAngle = Math.PI / 2;
		controls.minDistance = 2.3;
		controls.maxDistance = 4;

		// Set the background color of the scene
		this.scene.background = new THREE.Color(0x55CEFF)

		//Meshes
		this.level_mesh = null;
		this.paddle_mesh1 = null;
		this.paddle_mesh2 = null;

		//Audio
		// this.linstener = new THREE.AudioListener();
		// this.camera.add(listener);
		// this.sound = new THREE.Audio(listener);

		// this.gameOver = false;
		this.assetsLoaded = false;
		this.showLoadingScreen = false;
		this.loadingProgress = 0;

		this.loadAssets();

		// this.boundReset = this.startNewGame.bind(this);
		// this.startNewGame();
	}

	// Create the lights for the scene
	initLights () {
		const light = new THREE.PointLight(0xffffff, 0.05)
		//light.castShadow = true;
		const dirlight = new THREE.DirectionalLight(0x6666ff, 5.5)
		dirlight.castShadow = true;
		dirlight.shadow.mapSize.set(2048, 2048);
		dirlight.shadow.bias = -0.00001;
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
		const hemiLight = new THREE.HemisphereLight( 0xffffbb, 0xffffff, 0.4 );

		light.position.set(1, 12, 5)
		dirlight.position.set(1, 20, 1)
		dirlight.lookAt(0, 0, 0)
		this.scene.add(light)
		this.scene.add(ambientLight)
		this.scene.add(hemiLight)	
		this.scene.add(dirlight)
	}

	// Create the camera for the scene
	initCamera () {
		this.camera.position.x = 0.0
		this.camera.position.y = 1.0
		this.camera.position.z = 2.7
		this.camera.lookAt(0, 0, 0)
	}

	// Load the Environment of the town models
	loadLevel (loader) {
		// Load Level
		loader.load(
			'static/assets3d/town/town3.glb',
			function (gltf) {
				gltf.scene.traverse(function (child){
					if (child instanceof THREE.Mesh){
						child.castShadow = true;
						child.receiveShadow = true;
					}
				});
				this.level_mesh = gltf.scene;
				this.level_mesh.castShadow = true;
				this.scene.add(this.level_mesh)
			}.bind(this),

			function (xhr){
				// console.log((xhr.loaded / xhr.total * 100) + '% Level loaded')
			},

			function (error){
				console.log('An error happened')
			}
		);
	}

	// load the paddles models
	loadPaddles (loader) {
		// Load Paddle
		loader.load(
			'static/assets3d/town/paddle2.glb',
			function (gltf) {
				gltf.scene.traverse(function (child){
					if (child instanceof THREE.Mesh){
						if (child.material.color !== undefined){
							child.material.color.set(0xffffff);
						} 
						if (child.material.emissive !== undefined){
							child.material.emissive.set(0x111111);
						} 
						child.castShadow = true;
					}
				});
				this.paddle_mesh1 = gltf.scene;
				this.paddle_mesh1.castShadow = true;
				this.scene.add(this.paddle_mesh1);
				this.paddle_mesh2 = this.paddle_mesh1.clone();
				this.paddle_mesh2.castShadow = true;
				this.scene.add(this.paddle_mesh2);
			}.bind(this),
			function (xhr){
				// console.log((xhr.loaded / xhr.total * 100) + '% Paddle loaded')
			},
			function (error){
				console.log('An error happened')
			}
		);
	}

	// loadSounds () {
	// 	// Load Sound
	// 	var audioLoader = new THREE.AudioLoader(loadingManager);

	// 	audioLoader.load('static/assets3d/sounds/ping.mp3', 
	// 	function(this.buffer){
	// 		this.sound.setBuffer(this.buffer);
	// 		this.sound.setLoop(false);
	// 		this.sound.setVolume(0.5);
	// 	}.bind(this));
	// }

	loadAssets () {
		var loadingManager = new THREE.LoadingManager();

		loadingManager.onStart = function(url, itemsLoaded, itemsTotal) {
			this.showLoadingScreen = true;
			document.getElementById('canvas-ui').style.display = 'block';
			this.loadscreen.drawLoadingScreen(0);
		}.bind(this);
		
		loadingManager.onLoad = function() {
			// document.getElementById('canvas-ui').style.display = 'none';
			this.clearCanvas();
			// this.sound.play();
			this.assetsLoaded = true;
			this.showLoadingScreen = false;
			if (this.paddle_mesh1 === null || this.paddle_mesh2 === null) {
				console.error('paddle mesh is not loaded')
				return
			}
			this.createGameElements(GameModes.PLAYER_VS_PLAYER);
			this.start()
		}.bind(this);
		
		loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
			var progress = itemsLoaded / itemsTotal * 100;
			// console.log('Loading...', url, progress, '%');
			this.loadscreen.drawLoadingScreen(progress);	
			// document.getElementById('progressBar').style.width = progress + '%';
		}.bind(this);
		// Create a loader with the loading loadingManager
		var loader = new GLTFLoader(loadingManager);

		this.loadLevel(loader);

		this.loadPaddles(loader);

		// this.loadSounds();
	}

	createGameElements (gameMode) {
		this.paddle1 = new Paddle3D('player1', this.paddle_mesh1);
		this.paddle2 = new Paddle3D('player2', this.paddle_mesh2);
		this.ball = new Ball3D(this.scene, this.loader);

		this.player1 = new Player3D('player1', this.paddle1)
		if (gameMode === GameModes.PLAYER_VS_AI) {
			this.player2 = new AI3D()
		} 
		else {
			this.player2 = new Player3D('player2', this.paddle2)
		}
		this.gameOver = false
		this.gameMode = gameMode
	}

	initGameEngine () {
		this.initThreeJs()
		this.initLights()
		this.initCamera()
	}

	loadGame (gameMode, playerId) {
		this.stop()
		this.createCanvas()
		this.loadscreen = new Loading()
		this.initGameEngine() //(gameMode, playerId)
		// this.createGameElements(gameMode)
		if (gameMode === GameModes.PLAYER_VS_AI) {
			this.playerId = "player1"
			this.start();
		}
		else {
			this.lobby.join(this.lobbyId, this);
			this.displayWaitingMessage();
		}
		// this.playerId = playerId
		// this.lobby.join(this.lobbyId, this, playerId)
	}

	displayWaitingMessage() {
        this.clearCanvas();
        this.ctx.fillStyle = "WHITE";
        this.ctx.font = "40px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("Waiting for opponent...", GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2);
    }

	createCanvas () {
		var content = document.getElementById('content')
		content.style.position = 'relative'
		content.style.width = '800px';
		content.style.height = '600px';
		content.style.margin = '0 auto';


		if (content === null) {
			console.error('Content is null')
			return
    	}

		this.canvas_three = document.createElement('canvas')
		this.canvas_three.id = 'canvas-three'
		this.canvas_three.width = GameConstants.GAME_WIDTH
		this.canvas_three.height = GameConstants.GAME_HEIGHT 
		this.canvas_three.style.position = 'absolute'
		this.canvas_three.style.top = 0
		this.canvas_three.style.left = 0
		this.canvas_three.style.width = '100%'
		this.canvas_three.style.height = '100%'

		content.textContent = ''
		content.appendChild(this.canvas_three);
		console.log('Three this.canvas created')

		this.canvas_ui = document.createElement('canvas')
		this.canvas_ui.id = 'canvas-ui'
		this.canvas_ui.width = GameConstants.GAME_WIDTH 
		this.canvas_ui.height = GameConstants.GAME_HEIGHT 
		this.canvas_ui.style.position = 'absolute'
		this.canvas_ui.style.top = 0
		this.canvas_ui.style.left = 0
		this.canvas_ui.style.width = '100%'
		this.canvas_ui.style.height = '100%'
		this.canvas_ui.style.pointerEvents = 'none'
		this.ctx = this.canvas_ui.getContext('2d')
		content.appendChild(this.canvas_ui)
		console.log('UI Canvas created')
	}

	start () {
		if (!this.isGameStarted) {
			this.isGameStarted = true;
			this.gameOver = false;
			console.log('Game started')
		// this.setUpCanvas()
			this.startNewGame()
		}
	}

	stop () {
		this.gameOver = true
	}

	// setUpCanvas () {
	// 	this.canvas = document.getElementById('game')
	// 	this.context = this.canvas.getContext('2d')
	// 	this.canvas.width = GameConstants.GAME_WIDTH
	// 	this.canvas.height = GameConstants.GAME_HEIGHT
	// 	console.log('Canvas set up')
	// }

	startNewGame () {
		this.reset()
		this.boundKeyPress = this.keyPressHandler.bind(this)
		window.addEventListener('keydown', this.boundKeyPress)
		window.addEventListener('keyup', this.boundKeyPress)
		this.loop()
	}

	loop () {
		this.update()
		if (this.gameOver === false) {
			// console.log('Game3D.loop(): this.gameOver =' + this.gameOver)
			this.draw()
			window.requestAnimationFrame(this.loop.bind(this))
   		}
	}

	update () {
		const now = performance.now()
		var dt = (now - this.lastUpdateTime) / 1000.0
		this.lastUpdateTime = now

		// this.updatePlayers(dt)
		// this.ball.update(dt, [this.paddle1, this.paddle2])

		// if (this.paddle1)
		// 	this.paddle1.update(dt, this.keystate);
		// if (this.paddle2)
		// 	this.paddle2.update(dt, this.keystate);

		if (this.playerId === "player1" || this.gameMode === GameModes.PLAYER_VS_AI) {
			this.player1.update(dt, this.keystate);
			this.ball.update(dt, [this.paddle1, this.paddle2]);
			if (this.gameMode === GameModes.PLAYER_VS_AI) {
				this.player2.move(this.ball, this.player1);
			} else {
				this.lobby.sendGameData({
					event: "game_move",
					player1_pos: { x: this.player1.x, y: this.player1.y },
					ball_pos: { x: this.ball.x, y: this.ball.y },
				});
			}
		} 
		else if (this.playerId === "player2") {
			this.player2.update(dt, this.keystate);
			this.lobby.sendGameData({
				event: "game_move",
				player2_pos: { x: this.player2.x, y: this.player2.y },
			});
		}
		this.renderer.render(this.scene, this.camera)
	}

//   updatePositions (player1Pos, player2Pos, ballPos) {
//     this.player1.targetX = player1Pos.x
//     this.player1.targetY = player1Pos.y
//     this.player2.targetX = player2Pos.x
//     this.player2.targetY = player2Pos.y
//     this.ball.targetX = ballPos.x
//     this.ball.targetY = ballPos.y
//   }


  updatePositions(player1Pos, player2Pos, ballPos, updateType) {
	if (updateType === "host") {
		this.player1.paddle.position.x = player1Pos.x;
		this.player1.paddle.position.y = player1Pos.y;
		this.ball.position.x = ballPos.x;
		this.ball.position.y = ballPos.y;
	} else {
		this.player2.paddle.position.x = player2Pos.x;
		this.player2.paddle.position.y = player2Pos.y;
	}
  }

  updatePlayers (dt) {
    this.player1.update(dt, this.keystate)
    if (this.gameMode === GameModes.PLAYER_VS_AI) {
    	this.player2.move(this.ball, this.player1)
    } else {
      	this.player2.update(dt, this.keystate)
    }
  }

//   checkCollisions () {
//     let player =
//       this.ball.x < GameConstants.GAME_WIDTH / 2 ? this.player1 : this.player2
//     if (this.collision(this.ball, player)) {
//       this.handleCollision(player)
//     }
//   }

//   handleCollision (player) {
//     this.ball.accelerate()

//     let collidePoint =
//       this.ball.y - (player.y + GameConstants.PADDLE_HEIGHT / 2)
//     collidePoint = collidePoint / (GameConstants.PADDLE_HEIGHT / 2)
//     let angleRadius = (Math.PI / 4) * collidePoint
//     let direction = player === this.player1 ? 1 : -1

//     this.ball.xSpeed = direction * this.ball.speed * Math.cos(angleRadius)
//     this.ball.ySpeed = this.ball.speed * Math.sin(angleRadius)
//   }

//   collision (ball, player) {
//     player.left = player.x
//     player.right = player.x + GameConstants.PADDLE_WIDTH
//     player.top = player.y
//     player.bottom = player.y + GameConstants.PADDLE_HEIGHT

//     ball.top = ball.y - GameConstants.BALL_RADIUS
//     ball.bottom = ball.y + GameConstants.BALL_RADIUS
//     ball.left = ball.x - GameConstants.BALL_RADIUS
//     ball.right = ball.x + GameConstants.BALL_RADIUS

//     return (
//       ball.right > player.left &&
//       ball.top < player.bottom &&
//       ball.left < player.right &&
//       ball.bottom > player.top
//     )
//   }

  checkGoals () {
    if (this.ball.position.z - GameConstants3D.BALL_RADIUS < 
	GameConstants3D.TABLE_MIN_DEPTH) {
    	this.player2.scoreGoal()
    	this.goal()
    }
	else if (this.ball.position.z + GameConstants.BALL_RADIUS >
 	GameConstants3D.TABLE_MAX_DEPTH) {
    	this.player1.scoreGoal()
    	this.goal()
    }
  }

  draw () {
    this.clearCanvas()
    if (this.lobbyId !== undefined) {
		this.ctx.fillStyle = 'WHITE'
		this.ctx.font = '20px Arial'
		this.ctx.fillText(`Lobby ID: ${this.lobbyId}`, 10, 20)
    }
    this.drawScores()
  }

  clearCanvas () {
	this.ctx.clearRect(0, 0, GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT)

    // this.context.fillStyle = 'BLACK'
    // this.context.fillRect(
    //   0,
    //   0,
    //   GameConstants.GAME_WIDTH,
    //   GameConstants.GAME_HEIGHT
    // )
  }

  drawScores () {
  	this.ctx.fillStyle = 'WHITE'
    this.ctx.font = '75px Arial'
    this.ctx.fillText(
    	this.player1.score,
    	GameConstants.GAME_WIDTH / 4,
    	GameConstants.GAME_HEIGHT / 5
    )
    this.ctx.fillText(
    	this.player2.score,
    	(3 * GameConstants.GAME_WIDTH) / 4,
    	GameConstants.GAME_HEIGHT / 5
    )
  }

  reset () {
    this.player1.resetScore()
    console.log(`Player1 score: ${this.player1.score}`)
    this.player1.resetPaddles()
    console.log(`Player1 : Paddle resetted`)
    this.player2.resetScore()
    console.log(`Player2 score: ${this.player2.score}`)
    this.player2.resetPaddles()
    console.log(`Player2 : Paddle resetted`)
    this.ball.resetPosition()
    console.log(`Ball position: ${this.ball.position.x}-${this.ball.position.y}`)
    // this.canvas_ui.removeEventListener('click', this.boundReset)
    this.gameOver = false
  }

  checkIfOver () {
    if (this.player2.score >= 5) {
      this.endGame(this.player2)
    } else if (this.player1.score >= 5) {
      this.endGame(this.player1)
    }
  }

  endGame (winner) {
    this.clearCanvas()

    if (winner === this.player2) {
      this.drawEndGameMessage('GAME OVER')
    } else {
      this.drawEndGameMessage('YOU WIN')
    }

    window.removeEventListener('keydown', this.boundKeyPress)
    window.removeEventListener('keyup', this.boundKeyPress)
    this.canvas_ui.addEventListener('click', this.boundReset)
    this.gameOver = true
  }

  drawEndGameMessage (message) {
    this.ctx.textBaseline = 'middle'
    this.ctx.textAlign = 'center'
    this.ctx.fillStyle = 'WHITE'
    this.ctx.font = '40px Arial'
    this.ctx.fillText(
      message,
      GameConstants.GAME_WIDTH / 2,
      GameConstants.GAME_HEIGHT / 2 - 50
    )
    this.ctx.fillText(
      'Click to play again',
      GameConstants.GAME_WIDTH / 2,
      GameConstants.GAME_HEIGHT / 2 + 50
    )
  }

  goal () {
    this.checkIfOver()
    this.player1.resetPaddles()
    this.player2.resetPaddles()
    this.ball.resetPosition()
  }

  keyPressHandler = event => {
	if (event.type === 'keydown') {
		this.keystate[event.key] = true;
	}
	else {
		this.keystate[event.key] = false;
	}
    // console.log(`Key pressed: ${event.type} - ${event.key}`)
  }

  setListeners () {
    this.boundContextMenu = this.contextMenuHandler.bind(this)
    window.addEventListener('contextmenu', this.boundContextMenu)

    this.boundVisibilityChange = this.visibilityChangeHandler.bind(this)
    document.addEventListener('visibilitychange', this.boundVisibilityChange)

    this.boundBlur = this.blurHandler.bind(this)
    window.addEventListener('blur', this.boundBlur)

    this.boundReset = this.resetHandler.bind(this)
  }

  contextMenuHandler (event) {
    event.preventDefault()
  }

  visibilityChangeHandler () {
    if (document.hidden) {
      this.endGame(this.player2)
    }
  }

  blurHandler () {
  }

  resetHandler () {
    this.startNewGame()
  }
}
