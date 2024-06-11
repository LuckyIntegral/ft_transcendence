class Bobo {
	constructor (mesh, animations) {
		this.mesh = mesh;
		this.animations = animations;
		this.headTurnTime = 1.0;
		this.turnTime = 0.0;
		this.turnGoal = 1.0;
		this.mixer = new THREE.AnimationMixer(this.mesh);
		this.defaultState = 'idle';
		this.currentState = this.defaultState;
		this.currentAction = this.mixer.clipAction(this.animations[this.defaultState]);
		this.currentAction.play();
	}

	playDefaultAnimation () {
		const nextAction = this.mixer.clipAction(this.animations[this.defaultState]);
		nextAction.reset();
		nextAction.loop = THREE.LoopRepeat;
		nextAction.play();
		this.currentAction.crossFadeTo(nextAction, 0.5, true);
		this.turnGoal = 1.0;
		this.currentAction = nextAction;
		this.currentState = this.defaultState;
	}

	turnHead(target, dt) {
		let speed = 0.0;
		if (this.turnGoal == 1.0){
			this.turnTime += dt;
			speed = this.turnTime / this.headTurnTime ;
			if (speed >= 1.0) {
				speed = 1.0;
				this.turnTime = this.headTurnTime;
			}
		}
		else if (this.turnGoal == 0.0)
		{
			this.turnTime -= dt;
			speed = this.turnTime / this.headTurnTime;
			if (speed < 0.0){
				speed = 0.0;
				this.turnTime = 0.0;
			}
		}
		const originalRotation = this.headBone.quaternion.clone();
		this.headBone.lookAt(new THREE.Vector3(0.6 * target.position.x , 0.3 * target.position.y - 0.6, target.position.z));
		const targetRotation = this.headBone.quaternion.clone();
		this.headBone.quaternion.copy(originalRotation);
		this.headBone.quaternion.slerp(targetRotation, speed);
    }

	setPosition (x, y, z) {
		this.mesh.position.set(x, y, z);
	}

	setRotationY (y) {
		this.mesh.rotation.y = y;
	}

	playAnimation(state, onFinish) {
		if (this.animations[state]) {
			const nextAction = this.mixer.clipAction(this.animations[state]);
			nextAction.reset();
			nextAction.loop = THREE.LoopOnce;
			nextAction.clampWhenFinished = true;
			nextAction.play();
			if (this.currentAction) {
				this.currentAction.crossFadeTo(nextAction, 0.5, true);
			}
			this.currentAction = nextAction;
			this.currentState = state;

			this.turnGoal = 0.0;

			const finishListener = (event) => {
				if (event.action === nextAction) {
					this.mixer.removeEventListener('finished', finishListener);
					if (onFinish) onFinish();
					this.playDefaultAnimation();
				}
			};

			this.mixer.addEventListener('finished', finishListener);
		}
	}

	update(dt) {
		this.mixer.update(dt);
	}
}
