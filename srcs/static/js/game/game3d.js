// import { THREE } from "./main";

class Game3D {
    constructor(lobbyId) {
        this.lobbyId = lobbyId;
        this.setListeners();
        this.lobby = new GameLobby();
        this.playerId = null;
        this.lastUpdateTime = 0;
        this.buffer = null;
		this.userName = null;
		this.opponentName = null;
        this.keystate = { w: false, s: false, a: false, d: false, W: false, S: false, A: false, D: false };
        this.isGameStarted = false;
        this.gameOverTimer = 0.0;
        this.updateInterval = 1000 / GameConstants.FPS;
		this.ai_mode = 'hard';
		this.finishGame = false;
    }

    updateCountdown(countdown) {
        if (this.gameOver) return;
        this.ctx.drawImage(intro3dImage, 0, 0, GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT);

        this.ctx.fillStyle = "WHITE";
        this.ctx.font = "40px theren-regular";
        this.ctx.textAlign = "center";
        this.ctx.fillText(`Game starting in ${countdown > 0 ? countdown : 'now'}`, GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 4);
        if (countdown > 0) {
            setTimeout(() => {
                this.updateCountdown(countdown - 1);
            }, 1000);
        } else {
            this.start();
        }
    }

    startCountdown() {
        this.updateCountdown(3);
    }

    adjustToPlayerRole(role) {
        if (role === "player2") {
            this.camera.position.x = 0.0;
            this.camera.position.y = 1.23;
            this.camera.position.z = -2.7;
            this.camera.lookAt(0, 0, 0);
            this.bobo.setPosition(-2.1, -1.0, 0.0)
            this.bobo.setRotationY(-Math.PI / 2 + Math.PI);
        } else {
            this.initCamera();
        }
    }

    // Initialize the THREE.js scene
    initThreeJs(gameMode) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, GameConstants.GAME_WIDTH / GameConstants.GAME_HEIGHT, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this.canvas_three });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.renderer.setSize(GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT); //window.innerWidth, window.innerHeight)
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 3.0;

        // Create the controls for the camera
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.minPolarAngle = 0;
        controls.maxPolarAngle = Math.PI / 2;
        // controls.minAzimuthAngle = -Math.PI / 2;
        // controls.maxAzimuthAngle = Math.PI / 2;
        controls.minDistance = 2.3;
        controls.maxDistance = 4;

        // Set the background color of the scene
        this.scene.background = new THREE.Color(0x55ceff);

        this.mixer;
        this.bobo;
        this.headBone = null;
        this.modelReady = false;
        this.animationActions = []; // all actions
        this.activeAction; // current action
        this.lastAction; // last action played

		this.sounds = {};

        //Meshes
        this.level_mesh = null;
        this.paddle_mesh1 = null;
        this.paddle_mesh2 = null;
		this.effect_mesh = null;

        //Audio
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);
        this.ping = new THREE.Audio(this.listener);
        this.pong = new THREE.Audio(this.listener);
		this.force= new THREE.Audio(this.listener);
		this.pwin = new THREE.Audio(this.listener);
		this.plost = new THREE.Audio(this.listener);
		this.gwin = new THREE.Audio(this.listener);
		this.glost = new THREE.Audio(this.listener);
		this.applause = new THREE.Audio(this.listener);

        // this.gameOver = false;
        this.assetsLoaded = false;
        this.showLoadingScreen = false;
        this.loadingProgress = 0;
        this.initLights();
        this.initCamera();

    }

    // Create the lights for the scene
    initLights() {
        const light = new THREE.PointLight(0xffffff, 0.05);
        //light.castShadow = true;
        const dirlight = new THREE.DirectionalLight(0x6666ff, 5.5);
        dirlight.castShadow = true;
        dirlight.shadow.mapSize.set(2048, 2048);
        dirlight.shadow.bias = -0.00001;
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        const hemiLight = new THREE.HemisphereLight(0xffffbb, 0xffffff, 0.4);

        light.position.set(1, 12, 5);
        dirlight.position.set(1, 20, 1);
        dirlight.lookAt(0, 0, 0);
        this.scene.add(light);
        this.scene.add(ambientLight);
        this.scene.add(hemiLight);
        this.scene.add(dirlight);
    }

    // Create the camera for the scene
    initCamera() {
        this.camera.position.x = 0.0;
        this.camera.position.y = 1.23;
        this.camera.position.z = 2.7;
        this.camera.lookAt(0, 0, 0);
    }

    // Load the Environment of the town models
    loadLevel(loader) {
        // Load Level
        loader.load(
            "static/assets3d/town/town4.glb",
            function (gltf) {
                gltf.scene.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                this.level_mesh = gltf.scene;
                this.level_mesh.castShadow = true;
                this.scene.add(this.level_mesh);
            }.bind(this),

            function (xhr) {
                // console.log((xhr.loaded / xhr.total * 100) + '% Level loaded')
            },

			function (error){
				console.log('An error happened')
			}
		);
	}

	loadEffect (loader) {
		// Load Effect
		loader.load(
			'static/assets3d/town/effect.glb',
			function (gltf) {
				gltf.scene.traverse(function (child){
						if (child.isMesh) {
							child.material.transparent = true;
							child.material.antialias = true;
							child.material.alphaTest = 0.1;
							child.material.blending = THREE.AdditiveBlending;
							child.material.opacity = 0.0;
						}
				});
				this.effect_mesh = gltf.scene;
				this.effect_mesh.timer = 0.0;
				this.scene.add(this.effect_mesh)
			}.bind(this),

            function (xhr) {
                // console.log((xhr.loaded / xhr.total * 100) + '% Level loaded')
            },

            function (error) {
                console.log("An error happened");
            }
        );
    }

	loadEffect (loader) {
		// Load Effect
		loader.load(
			'static/assets3d/town/effect.glb',
			function (gltf) {
				gltf.scene.traverse(function (child){
						if (child.isMesh) {
							child.material.transparent = true;
							child.material.antialias = true;
							child.material.alphaTest = 0.1;
							child.material.blending = THREE.AdditiveBlending;
							child.material.opacity = 0.0;
						}
				});
				this.effect_mesh = gltf.scene;
				this.effect_mesh.timer = 0.0;
				this.effect_apply = false;
				this.scene.add(this.effect_mesh)
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
    loadPaddles(loader) {
        // Load Paddle
        loader.load(
            "static/assets3d/town/paddle2.glb",
            function (gltf) {
                gltf.scene.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        if (child.material.color !== undefined) {
                            child.material.color.set(0xffffff);
                        }
                        if (child.material.emissive !== undefined) {
                            child.material.emissive.set(0x111111);
                        }
                        child.castShadow = true;
                    }
                });
                this.paddle_mesh1 = gltf.scene;
                this.paddle_mesh1.castShadow = true;
                this.paddle_mesh1.scale.set(
                    GameConstants3D.PADL_SCALE,
                    GameConstants3D.PADL_SCALE,
                    GameConstants3D.PADL_SCALE
                );
                this.scene.add(this.paddle_mesh1);
                this.paddle_mesh2 = this.paddle_mesh1.clone();
                this.paddle_mesh2.castShadow = true;
                this.paddle_mesh2.scale.set(
                    GameConstants3D.PADL_SCALE,
                    GameConstants3D.PADL_SCALE,
                    GameConstants3D.PADL_SCALE
                );
                this.scene.add(this.paddle_mesh2);
            }.bind(this),
            function (xhr) {
                // console.log((xhr.loaded / xhr.total * 100) + '% Paddle loaded')
            },
            function (error) {
                console.log("An error happened");
            }
        );
    }

    loadBobo(loader) {
        loader.load(
            "static/assets3d/town/bobo2.glb",
            function (object) {
                object.scene.traverse(function (child) {
                    if (child.isMesh) {
                        child.castShadow = true
                    }
                    if (child.isBone && child.name == "mixamorig1Neck")
                    {
                        this.headBone = child;
                    }

                }.bind(this));
				let animationsByName = {};
				for (let clip of object.animations) {
					animationsByName[clip.name] = clip;
				}
                this.bobo = new Bobo(object.scene, animationsByName);
                this.bobo.setPosition(2.1, -1.0, 0.0)
                this.bobo.setRotationY(-Math.PI / 2);
				this.bobo.headBone = this.headBone;
                this.scene.add(this.bobo.mesh);
            }.bind(this),
            function (xhr) {
                // console.log((xhr.loaded / xhr.total * 100) + '% Bobo loaded')
            },
            function (error) {
                console.log("An error happened");
            }
        );
    }

    loadSounds(loadingManager) {
        // 	// Load Sound
        var audioLoader = new THREE.AudioLoader(loadingManager);
        audioLoader.load(
            "static/assets3d/sounds/ping.mp3",
            function (buffer) {
                this.ping.setBuffer(buffer);
                this.ping.setLoop(false);
                this.ping.setVolume(0.3);
				this.sounds['ping'] = this.ping;
            }.bind(this)
        );
        audioLoader.load(
            "static/assets3d/sounds/pong.mp3",
            function (buffer) {
                this.pong.setBuffer(buffer);
                this.pong.setLoop(false);
                this.pong.setVolume(0.6);
				this.sounds['pong'] = this.pong;
            }.bind(this)
        );
		audioLoader.load('static/assets3d/sounds/force.mp3',
		function(buffer){
			this.force.setBuffer(buffer);
			this.force.setLoop(false);
			this.force.setVolume(0.22);
			this.sounds['force'] = this.force;
		}.bind(this));
		audioLoader.load('static/assets3d/sounds/pointwin.mp3',
		function(buffer){
			this.pwin.setBuffer(buffer);
			this.pwin.setLoop(false);
			this.pwin.setVolume(0.3);
			this.sounds['point_win'] = this.pwin;
		}.bind(this));
		audioLoader.load('static/assets3d/sounds/gamewin.mp3',
		function(buffer){
			this.gwin.setBuffer(buffer);
			this.gwin.setLoop(false);
			this.gwin.setVolume(0.6);
			this.sounds['game_win'] = this.gwin;
		}.bind(this));
		audioLoader.load('static/assets3d/sounds/applause.mp3',
		function(buffer){
			this.applause.setBuffer(buffer);
			this.applause.setLoop(false);
			this.applause.setVolume(0.22);
			this.sounds['applause'] = this.applause;
		}.bind(this));
		audioLoader.load('static/assets3d/sounds/pointlost.mp3',
		function(buffer){
			this.plost.setBuffer(buffer);
			this.plost.setLoop(false);
			this.plost.setVolume(0.22);
			this.sounds['point_lost'] = this.plost;
		}.bind(this));
		audioLoader.load('static/assets3d/sounds/gamelose.mp3',
		function(buffer){
			this.glost.setBuffer(buffer);
			this.glost.setLoop(false);
			this.glost.setVolume(0.22);
			this.sounds['game_lost'] = this.glost;
		}.bind(this));
	}


    loadAssets(gameMode) {
        var loadingManager = new THREE.LoadingManager();

        loadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
            this.showLoadingScreen = true;
            document.getElementById("canvas-ui").style.display = "block";
            this.loadscreen.drawLoadingScreen(0);
        }.bind(this);

        loadingManager.onLoad = function () {
            this.clearCanvas();
            this.assetsLoaded = true;
            this.showLoadingScreen = false;
            this.createGameElements(gameMode);
        }.bind(this);

        loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
            var progress = (itemsLoaded / itemsTotal) * 100;
            this.loadscreen.drawLoadingScreen(progress);
        }.bind(this);
        // Create a loader with the loading loadingManager
        var loader = new GLTFLoader(loadingManager);

        this.loadLevel(loader);

        this.loadBobo(loader);

		this.loadEffect(loader);

        this.loadPaddles(loader);

        this.loadSounds(loadingManager);
    }

    createGameElements(gameMode) {
        if (this.paddle_mesh1 === null || this.paddle_mesh2 === null) {
            console.error("paddle mesh is not loaded");
            return;
        }
        this.paddle1 = new Paddle3D("player1", this.paddle_mesh1);
        this.paddle2 = new Paddle3D("player2", this.paddle_mesh2);
        this.ball = new Ball3D(this.scene, this.sounds);
        this.gameMode = gameMode;
        this.gameOver = false;
        this.player1 = new Player3D("player1", this.paddle1);
        if (gameMode === GameModes.PLAYER_VS_AI) {
            this.playerId = "player1";
            this.player2 = new AI3D(this.paddle2, this.ai_mode, this.ball);
            this.start();
        } else {
            this.player2 = new Player3D("player2", this.paddle2);
            this.lobby.join(this.lobbyId, this);
			// console.log('lobby Id: ', this.lobbyId);
			// console.log('lobby.gameOver: ', this.lobby.gameOver);
			// console.log('lobby.playersConnected: ', this.lobby.playersConnected);
            this.displayWaitingMessage();
        }
    }

    initGameEngine(gameMode) {
        this.initThreeJs(gameMode);
        this.loadAssets(gameMode);
    }

    loadGame(gameMode, ai_mode) {
		this.ai_mode = ai_mode;
        this.stop();
        this.createCanvas();
        this.loadscreen = new Loading();
        this.initGameEngine(gameMode, ai_mode);
    }

    displayWaitingMessage() {
        this.ctx.drawImage(intro3dImage, 0, 0, GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT);
        this.ctx.fillStyle = "WHITE";
        this.ctx.font = "40px theren-regular";
        this.ctx.textAlign = "center";
        this.ctx.fillText("Waiting for opponent...",
                GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT /4);
    }

    createCanvas() {
        var content = document.getElementById("content");
        if (content === null) {
            console.error("Content is null");
            return;
        }
        content.style.position = "relative";
        content.style.width = "800px";
        content.style.height = "600px";
        content.style.margin = "0 auto";

        this.canvas_three = document.createElement("canvas");
        this.canvas_three.id = "canvas-three";
        this.canvas_three.width = GameConstants.GAME_WIDTH;
        this.canvas_three.height = GameConstants.GAME_HEIGHT;
        this.canvas_three.style.position = "absolute";
        this.canvas_three.style.top = 0;
        this.canvas_three.style.left = 0;
        this.canvas_three.style.width = "100%";
        this.canvas_three.style.height = "100%";

        content.textContent = "";
        content.appendChild(this.canvas_three);
        // console.log("Three this.canvas created");

        this.canvas_ui = document.createElement("canvas");
        this.canvas_ui.id = "canvas-ui";
        this.canvas_ui.width = GameConstants.GAME_WIDTH;
        this.canvas_ui.height = GameConstants.GAME_HEIGHT;
        this.canvas_ui.style.position = "absolute";
        this.canvas_ui.style.top = 0;
        this.canvas_ui.style.left = 0;
        this.canvas_ui.style.width = "100%";
        this.canvas_ui.style.height = "100%";
        this.canvas_ui.style.pointerEvents = "none";
        this.ctx = this.canvas_ui.getContext("2d");
        content.appendChild(this.canvas_ui);
    }

    start() {
        if (!this.isGameStarted) {
            this.isGameStarted = true;
            this.gameOver = false;
            // this.setUpCanvas()
            this.startNewGame();
        }
    }

    stop() {
        this.gameOver = true;
    }

    startNewGame() {
        // if (this.gameOver) return;
		this.playRandomClip(['idle', 'happyIdle', 'breathing', 'warriorIdle']);
        this.reset();
        this.boundKeyPress = this.keyPressHandler.bind(this);
        window.addEventListener("keydown", this.boundKeyPress);
        window.addEventListener("keyup", this.boundKeyPress);
		this.ball.pause_time = 3.0;
        // this.lastUpdateTime = performance.now();
        this.loop();
    }

	update_effect(dt) {
		if (this.effect_mesh !== null && this.effect_mesh.timer > 0.0) {
			this.effect_mesh.timer -= dt;

			if (this.effect_mesh.timer <= 0.0)
			{
				this.effect_mesh.timer = 0.0;
				this.effect_mesh.scale.set(0.6, 0.6, 0.6);
			}
			this.effect_mesh.traverse((child) => {
				if (child.isMesh) {
					child.material.transparent = true;
					child.material.opacity = GameConstants3D.EFFECT_OPACITY *
							this.effect_mesh.timer / GameConstants3D.EFFECT_DURATION;
				}
			});
			let scl = 0.6 + 0.5 * (1.0 - this.effect_mesh.timer / GameConstants3D.EFFECT_DURATION);
			this.effect_mesh.scale.set(scl, scl, scl);
		}
	}



    loop() {
        if (this.gameOver)
		{
			const now = performance.now();
			var dt = (now - this.lastUpdateTime) / 1000.0;
			this.bobo.update(dt);
			this.draw();
			if (this.renderer !== null && this.scene !== null && this.camera !== null)
				this.renderer.render(this.scene, this.camera)
			else
				return;
			var winner = this.player1.score > this.player2.score ? "player1" : "player2";
			if (this.playerId === winner) {
				this.drawEndGameClientMessage("You WON");
			} else {
				this.drawEndGameClientMessage("You LOST");
			}
			if (this.finishGame === true) {
				return;
			}
			this.lastUpdateTime = now;
            window.requestAnimationFrame(this.loop.bind(this));
		}
		else {
			this.update();
			this.draw();
			window.requestAnimationFrame(this.loop.bind(this));
		}
    }


    update() {
        const now = performance.now();
        var dt = (now - this.lastUpdateTime) / 1000.0;
        this.lastUpdateTime = now;

		this.update_effect(dt)
        this.checkGoals();
		this.bobo.update(dt);
        this.bobo.turnHead(this.ball, dt);

		if (this.playerId === "player1" || this.gameMode === GameModes.PLAYER_VS_AI) {
			this.ball.update(dt, [this.paddle1, this.paddle2], this.effect_mesh);
			this.player1.update(dt, this.keystate, this.ball, this.playerId);
			if (this.gameMode === GameModes.PLAYER_VS_AI) {
				this.player2.update(this.ball, dt);
			}
			else {
				this.lobby.sendGameData({
					event: "game_move",
					player1_pos: { x: this.player1.paddle.position.x,
                                    y: this.player1.paddle.position.y,
                                    z: this.player1.paddle.position.z,
                                    rot: this.player1.paddle.paddlemesh.rotation.y},
					ball_pos: { x: this.ball.position.x,
                                y: this.ball.position.y,
                                z: this.ball.position.z,
                                effect: this.effect_mesh.effect_apply},
				});
			}
		}
		else if (this.playerId === "player2") {
			this.player2.update(dt, this.keystate, this.ball, this.playerId);
			this.ball.update_client(dt,this.effect_mesh);
			// if (this.effect_mesh.effect_apply)
			// 	this.ball.applyEffect(this.effect_mesh, this.ball.position.x > 0? 1.0 : -1.0 , this.ball.position.y, this.ball.position.z);
			this.lobby.sendGameData({
				event: "game_move",
				player2_pos: { x: this.player2.paddle.position.x,
                                y: this.player2.paddle.position.y,
                                z: this.player2.paddle.position.z,
                                rot: this.player2.paddle.paddlemesh.rotation.y},
			});
		}
		this.renderer.render(this.scene, this.camera)
	}

    updatePositions(player1Pos, player2Pos, ballPos, updateType) {
        if (updateType === "host") {
            this.player1.paddle.position.x = player1Pos.x;
            this.player1.paddle.position.y = player1Pos.y;
            this.player1.paddle.position.z = player1Pos.z;
            this.player1.paddle.paddlemesh.position.x = player1Pos.x;
            this.player1.paddle.paddlemesh.position.y = player1Pos.y;
            this.player1.paddle.paddlemesh.position.z = player1Pos.z;
            this.player2.paddle.paddlemesh.rotation.y = player1Pos.rot;
			this.ball.prevPosition.copy(this.ball.position);
            this.ball.position.x = ballPos.x;
            this.ball.position.z = ballPos.z;
            this.ball.position.y = ballPos.y;
			this.effect_mesh.effect_apply = ballPos.effect;
        }
		else {
            this.player2.paddle.position.x = player2Pos.x;
            this.player2.paddle.position.y = player2Pos.y;
            this.player2.paddle.position.z = player2Pos.z;
            this.player2.paddle.paddlemesh.position.x = player2Pos.x;
            this.player2.paddle.paddlemesh.position.y = player2Pos.y;
            this.player2.paddle.paddlemesh.position.z = player2Pos.z;
            this.player2.paddle.paddlemesh.rotation.y = player2Pos.rot;
        }
    }

    updatePlayers(dt) {
        this.player1.update(dt, this.keystate, this.playerId);
        if (this.gameMode === GameModes.PLAYER_VS_AI) {
            this.player2.update(this.ball, dt);
        } else {
            this.player2.update(dt, this.keystate, this.playerId);
        }
    }

    checkGoals() {
        if (this.ball.position.z < GameConstants3D.GAME_OVER_TIME * GameConstants3D.TABLE_MIN_DEPTH) {
            this.player1.scoreGoal();
			if (this.playerId === 'player1') {
				if (this.player1.score < 5)
					this.playRandomClip(['cheering', 'clapping', 'victory', 'exited'])
				if (!this.sounds['point_win'].isPlaying)
					this.sounds['point_win'].play();
			}
			else if (this.playerId === 'player2'){
				if (this.player1.score < 5)
					this.playRandomClip(['rejected', 'defeat', 'defeat2', 'bored']);
				if (!this.sounds['point_lost'].isPlaying)
					this.sounds['point_lost'].play();
			}
            this.goal();
        } else if (this.ball.position.z > GameConstants3D.GAME_OVER_TIME * GameConstants3D.TABLE_MAX_DEPTH) {
            this.player2.scoreGoal();
			if (this.playerId === 'player1') {
				if (this.player2.score < 5)
					this.playRandomClip(['rejected', 'defeat', 'defeat2', 'bored']);
				if (!this.sounds['point_lost'].isPlaying)
					this.sounds['point_lost'].play();
			}
			else if (this.playerId === 'player2') {
				if (this.player2.score < 5)
					this.playRandomClip(['cheering', 'clapping', 'victory', 'exited'])
				if (!this.sounds['point_win'].isPlaying)
					this.sounds['point_win'].play();
			}
            this.goal();
        }
    }

    draw() {
        this.clearCanvas();
        if (this.lobbyId !== undefined) {
            this.ctx.fillStyle = "WHITE";
            this.ctx.font = "10px theren-regular";
            this.ctx.fillText(`Lobby ID: ${this.lobbyId}`, 40, 12);
        }
        this.drawScores();
    }

    clearCanvas() {
		if (this.ctx !== undefined)
        	this.ctx.clearRect(0, 0, GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT);
    }

    drawScores() {
        this.ctx.fillStyle = "WHITE";
        this.ctx.font = "20px theren-regular";
        this.ctx.fillText(
            (this.userName? this.userName+': ' : "Player: ") + ((this.playerId == 'player1') ? this.player1.score : this.player2.score),
            GameConstants.GAME_WIDTH / 6,
            GameConstants.GAME_HEIGHT - 35
        );
        this.ctx.fillText(
            (this.opponentName? this.opponentName+": " : "AI: ") + ((this.playerId == 'player1') ? this.player2.score : this.player1.score),
            GameConstants.GAME_WIDTH - GameConstants.GAME_WIDTH / 6,
            GameConstants.GAME_HEIGHT - 35
        );
    }

	reset_key_state() {
		this.keystate = { w: false, s: false, a: false, d: false, W: false, S: false, A: false, D: false };
	}

    reset() {
        this.player1.resetScore();
        this.player1.resetPaddles();
        this.player2.resetScore();
        this.player2.resetPaddles();
		this.reset_key_state();
        this.ball.resetPosition();
        this.canvas_three.removeEventListener("click", this.boundReset);
        this.gameOver = false;
    }

    checkIfOver() {
        if (this.player2.score >= 5) {
			if (this.playerId === 'player1'){
				this.playRandomClip(['sadIdle', 'sadIdle2', 'lookingAround', 'happyIdle']);
				if (!this.sounds['game_lost'].isPlaying)
					this.sounds['game_lost'].play();
			}
			else if (this.playerId === 'player2'){
				this.playRandomClip(['salsaDancing', 'sambaDancing']);
				if (!this.sounds['game_win'].isPlaying)
					this.sounds['game_win'].play();
			}
            // this.endGame();
        } else if (this.player1.score >= 5) {
			if (this.playerId === 'player1'){
				this.playRandomClip(['salsaDancing', 'sambaDancing']);
				if (!this.sounds['game_win'].isPlaying)
					this.sounds['game_win'].play();
			}
			else if (this.playerId === 'player2'){
				this.playRandomClip(['sadIdle', 'sadIdle2', 'lookingAround', 'happyIdle']);
				if (!this.sounds['game_lost'].isPlaying)
					this.sounds['game_lost'].play();
			}
            // this.endGame();
        }
		if ((this.player2.score >= 5 || this.player1.score >= 5) ) {
			if (this.gameMode !== GameModes.PLAYER_VS_AI) {
				this.lobby.gameSocket.send(JSON.stringify({
					event: "game_over",
					hostScore: this.player1.score,
					guestScore: this.player2.score}
            	));
			}
			this.endGame();
        }
    }

	playRandomClip(clips) {
		const randomString = clips[Math.floor(Math.random() * clips.length)];
		this.bobo.playAnimation(randomString, () => {
		});
	}

    endGame() {
        this.clearCanvas();
        var winner = this.player1.score > this.player2.score ? "player1" : "player2";
        if (this.playerId === winner) {
            this.drawEndGameClientMessage("You WON");
        } else {
            this.drawEndGameClientMessage("You LOST");
        }
        window.removeEventListener("keydown", this.boundKeyPress);
        window.removeEventListener("keyup", this.boundKeyPress);
		if (this.gameMode === GameModes.PLAYER_VS_PLAYER) {
        	this.canvas_three.addEventListener("click", this.goToChat);
		}
		else
			this.canvas_three.addEventListener("click", this.boundReset);
        this.gameOver = true;
    }

    drawEndGameMessage(message, player1, player2, score1, score2) {
        this.gameOver = true;
        this.ctx.drawImage(intro3dImage, 0, 0, GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT);
		this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
		this.ctx.fillRect(0, 0, GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT);
        this.ctx.textBaseline = "middle";
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = "WHITE";
        this.ctx.font = "50px theren-regular";
        this.ctx.fillText("GAME OVER", GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 8 );
		if (message.length > 17)
			this.ctx.font = "60px theren-regular";
		else
			this.ctx.font = "80px theren-regular";
		this.ctx.fillText(message, GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 4);
		if (player1 !== "" && player2 !== "" && score1 !== "" && score2 !== "")	{
			this.ctx.font = "50px theren-regular";
			this.ctx.fillText(player1 + "  vs  " + player2, GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2);
			this.ctx.font = "60px theren-regular";
			this.ctx.fillText(score1 + " - " + score2, GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2 + 65);
		}
		this.ctx.font = "20px theren-regular";
		if (this.gameMode === GameModes.PLAYER_VS_PLAYER) {
        	this.canvas_three.addEventListener("click", this.goToChat);
		}
		else
			this.canvas_three.addEventListener("click", this.boundReset);
		if (this.gameMode === GameModes.PLAYER_VS_PLAYER) {
        	this.ctx.fillText("Click to go back to messages", GameConstants.GAME_WIDTH / 2, 3 * GameConstants.GAME_HEIGHT / 4 + 60);
		}
		else
			this.ctx.fillText("Click to play again", GameConstants.GAME_WIDTH / 2, 3 * GameConstants.GAME_HEIGHT / 4 + 60);
        if (g_GameSocket !== null) {
            g_GameSocket.close();
			g_GameSocket = null;
        }
    }

    drawEndGameClientMessage(message) {
        this.gameOver = true;
        // this.ctx.drawImage(intro3dImage, 0, 0, GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT);
		this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
		this.ctx.fillRect(0, 0, GameConstants.GAME_WIDTH, GameConstants.GAME_HEIGHT);
        this.ctx.textBaseline = "middle";
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = "WHITE";
        this.ctx.font = "50px theren-regular";
        this.ctx.fillText("GAME OVER", GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 4);
		this.ctx.font = "120px theren-regular";
		this.ctx.fillText(message, GameConstants.GAME_WIDTH / 2, GameConstants.GAME_HEIGHT / 2);
		this.ctx.font = "20px theren-regular";
		if (this.gameMode === GameModes.PLAYER_VS_PLAYER) {
        	this.ctx.fillText("Click to finish", GameConstants.GAME_WIDTH / 2, 3 * GameConstants.GAME_HEIGHT / 4 );
		}
		else
			this.ctx.fillText("Click to play again", GameConstants.GAME_WIDTH / 2, 3 * GameConstants.GAME_HEIGHT / 4 );
        if (g_GameSocket !== null) {
            g_GameSocket.close();
			g_GameSocket = null;
        }
    }

	stopSounds() {
		for (let sound in this.sounds) {
			if (this.sounds[sound].isPlaying)
				this.sounds[sound].stop();
		}
	}

    goal() {
        this.checkIfOver();
        this.player1.resetPaddles();
        this.player2.resetPaddles();
        this.ball.resetPosition();
    }

    keyPressHandler = (event) => {
        if (event.type === "keydown") {
            this.keystate[event.key] = true;
        } else {
            this.keystate[event.key] = false;
        }
    };

    setListeners() {
        this.boundContextMenu = this.contextMenuHandler3d.bind(this);
        window.addEventListener("contextmenu", this.boundContextMenu);

        this.boundVisibilityChange = this.visibilityChangeHandler3d.bind(this);
        document.addEventListener("visibilitychange", this.boundVisibilityChange);

        this.boundBlur = this.blurHandler3d.bind(this);
        window.addEventListener("blur", this.boundBlur);

		this.hashChange = this.hashChangeHandler3d.bind(this);
		window.addEventListener("hashchange", this.hashChange);

        this.boundReset = this.resetHandler3d.bind(this);

		this.goToChat = this.goToChatHandler3d.bind(this);
    }

    contextMenuHandler3d(event) {
        event.preventDefault();
    }

	goToChatHandler3d() {
		this.finishGame = true;
		window.location.hash = 'messages';
	}

	hashChangeHandler3d() {
		if (this.isGameStarted) {
			this.stopGame();
			this.finishGame = true;
			this.reset_key_state();
		}
	}

    visibilityChangeHandler3d() {
		if (document.hidden) {
			this.stopGame();
		}
    }

	stopGame() {
		this.stopSounds();
		this.endGame();
		// location.reload();
	}

    blurHandler3d() {
		if (!this.isGameStarted || this.gameMode === GameModes.PLAYER_VS_PLAYER)
		{
			this.reset_key_state();
			return;
		}
		else {
			this.stopGame();
			// this.deallocate();
			// window.location.hash = 'pong3d';
		}
	}

	deallocate() {
		cancelAnimationFrame(this.loop);
		while(this.scene.children.length > 0){
			this.scene.remove(this.scene.children[0]);
		}
		// this.renderer.dispose();
		this.scene = null;
	}

    resetHandler3d() {
        this.startNewGame();
    }
}
