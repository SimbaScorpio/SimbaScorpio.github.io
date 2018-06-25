/*
  Programming and art made by Jiangchuan Hu
  You can freely look at the code below,
  but you are not allowed to use the code or art to make your own games
*/
$(document).ready(function() {
	var h = $('#game-canvas').attr('height');
	$('.container-fluid').css('margin-top', ($(window).get(0).innerHeight-h)/2);
	Adventure();
})

function Adventure() {
	// initialize Quintus enginee including most of its modules
	Q = Quintus({
			imagePath: '../sources/images/game/Adventure/',
			audioPath: '../sources/audio/game/Adventure/',
			dataPath: '../sources/data/game/Adventure/',
			development: true
		}).include('Sprites, Scenes, Input, 2D, UI, Audio, Anim');
	Q.setup({ maximize: true }).enableSound();

	// load pictures, sounds and jsons the game needs
	pictures = ['background.png', 'mark.png', 'tiles.png'];
	sounds = ['background.mp3', 'jump.mp3', 'coin.mp3', 'die.mp3', 'yeah.mp3'];
	jsons = ['tiles.json', 'level1.json', 'level2.json', 'level3.json', 'level4.json', 'level5.json', 'level6.json'];
	src = pictures.concat(sounds).concat(jsons);
	Q.load(src, function(){ loadReady() }, {
		progressCallback: function(loaded, total) {
			progress(loaded, total);
		}
	});

	loadReady = function() {
		$('.progress').hide();
		$('.logo').hide();
		Q.compileSheets('tiles.png', 'tiles.json');
		Q.stageScene('background', 0);
		loadNextLevel();
	}

	progress = function(loaded, total) {
		$('#progress-bar').css('width', loaded/total*100 + '%');
	}

	MAXLEVEL = 6

	Q.state.reset({ sound: true, level: 1, coins: 0, die: 0 });

	Q.controls();	// Mention that Q.controls() should be called after setting touchControls 
					// and before setting keyboardControls.	

	// Player
	Q.Sprite.extend('Player', {
		init: function(p) {
			this._super(p, {
				z: 10,           // z-order the higher the fronter
				w: 32,           // width
				h: 50,           // height
				ay: 20,          // verticle accelerate
				speed: 5,        // move speed
				rake: 60,        // rake when move
				ratio: 0,        // speed / rake when move
				bounce: 600,     // -vy when jump
				jumping: false,  // whether jumping
				movable: true    // whether movable
			});
			this.add('2d, tween');
			Q.input.on('leftUp, rightUp', this, function(){ this.p.ratio = 0 });
		},
		draw: function(ctx) {
			ctx.fillStyle = '#282828';
			ctx.transform(1, 0, this.p.ratio, 1, 0, 0);
			ctx.fillRect(-this.p.cx, -this.p.cy, this.p.w, this.p.h);
		},
		die: function() {
			if (currentSound()) { Q.audio.play('die.mp3'); }
			Q.state.inc('die', 1);
			Q.state.set('coins', 0);
			loadNextLevel();
		},
		pass: function() {
			this.del('2d');
			this.p.movable = false;
			if (currentSound()) { Q.audio.play('yeah.mp3', { debounce: 1000 }); }
			this.animate({ angle: 360 }, 0.5, Q.Easing.Linear, {
				callback: function() {
					Q.state.inc('level', 1);
					loadNextLevel();
				}
			});
		},
		step: function(dt) {
			if (this.p.movable) {
				if (Q.inputs['left']) {
					this.p.x -= this.p.speed;
					this.p.ratio = this.p.speed / this.p.rake;
				}
				if (Q.inputs['right']) {
					this.p.x += this.p.speed;
					this.p.ratio = - this.p.speed / this.p.rake;
				}
				if (Q.inputs['up'] && this.p.jumping == false) {
					if (currentSound()) { Q.audio.play('jump.mp3'); }
					this.p.vy = -this.p.bounce;
					this.p.jumping = true;
				}
				if (this.p.vy == 0 && !Q.inputs['up']) {
					this.p.jumping = false;
				} else {
					this.p.jumping = true;
				}
			}
			if (this.p.y > 2000) { this.die(); }
		}
	});

	// Lava
	Q.Sprite.extend('Lava', {
		init: function(p) {
			this._super(p, {
				z: 2,
				sheet: 'red',
				speed: 0,
				direct: 0,
				gravity: 0,
			});
			this.add('2d');
			this.on('hit', function(collision) {
				if (collision.obj.isA('Player')) {
					collision.obj.die();
				}
			});
			this.on('bump.left, bump.right, bump.top, bump.bottom', function(collision) {
				this.p.speed = -this.p.speed;
			});
		},
		step: function(dt) {
			if (this.p.direct == 0) { this.p.x += this.p.speed; }
			if (this.p.direct == 1) { this.p.y += this.p.speed; }
		}
	});
	
	// Coin
	Q.Sprite.extend('Coin', {
		init: function(p) {
			this._super(p, {
				z: 20,           // z-order the higher the fronter
				w: 22,           // width
				h: 32,           // height
				vy: 0.5,         // shake speed
				scope: 12,       // shake scope
				timer: 0,        // caculate time
				shaking: true,   // should stop shaking when disappear
				scale: 1,        // default scale 1
				type: Q.SPRITE_FRIENDLY
			});
			this.add('tween');
		},
		getCoin: function() {
			if (this.p.shaking == true) {
				if (currentSound()) { Q.audio.play('coin.mp3'); }
				Q.state.inc('coins', 1);
				this.p.shaking = false;
				this.animate({ scale: 0 }, 0.2, Q.Easing.Linear, {
					callback: function() {
						this.destroy(); 
					}
				});
			}
		},
		draw: function(ctx) {
			ctx.fillStyle = 'yellow';
			ctx.fillRect(-this.p.cx, -this.p.cy, this.p.w, this.p.h);
		},
		step: function(dt) {
			if (Q.overlap(this.p.player, this)) { this.getCoin(); }
			if (this.p.shaking) {
				this.p.timer = this.p.timer + 1;
				if ((this.p.timer / this.p.scope) % 2 == 0) { this.p.vy = -this.p.vy; }
				this.p.y += this.p.vy;
			}
		}
	});

	// this sprite is used for development
	Q.Sprite.extend('Develop', {
		init: function(p) {
			this._super(p, {
				z: 100,           // z-order the higher the fronter
				x: 0,             // default x position
				y: 0,             // default y position
				w: 10000,         // default width
				h: 1000,          // default height
				gap: 100,         // default gap per line
				type: 32,         // Q.SPRITE_UI
			});
			this.addText();
		},
		draw: function(ctx) {
			ctx.strokeStyle = '#FFFFFF';
			for (x = 0; x < this.p.w; x += this.p.gap) {
				ctx.beginPath()
				ctx.moveTo(x, 0);
				ctx.lineTo(x, this.p.h);
				ctx.stroke();
			}
		},
		addText: function() {
			for (x = 0; x < this.p.w; x += this.p.gap) {
				this.p.stage.insert(new Q.UI.Text({  x: x, y: 200, label: x+"" }));
			}
		}
	});

	Q.TileLayer.extend('myTileLayer', {
		collidableTile: function(tileNum) { return tileNum > 1; }
	});

	initLevel = function(stage, position, boundingBox) {
		player = stage.insert(new Q.Player(position));
		player.p.stage = stage;

		dataAsset = 'level' + currentLevel() + '.json';
		layer = stage.collisionLayer(new Q.myTileLayer({ dataAsset: dataAsset, sheet: 'tiles', z: 1 }));
		
		if (stage.has('viewport')) { stage.del('viewport'); }
		stage.add('viewport').follow(player, { x: true, y: false }, boundingBox);
		stage.viewport.moveTo(0, 150);

		stage.on('destroy', function(){ player.destroy(); });

		return { player: player, layer: layer };
	};

	addLava = function(stage, tileLayer) {
		tiles = tileLayer.p.tiles;
		tileW = tileLayer.p.tileW;
		tileH = tileLayer.p.tileH;
		for (i = 0; i < tiles.length - 1; ++i) {
			for (j = 0; j < tiles[i].length - 1; ++j) {
				if (tiles[i][j] == 1) {
					stage.insert( new Q.Lava({ x: j*tileW+tileW/2, y: i*tileH+tileH/2 }) );
				}
			}
		}
	};

	loadNextLevel = function() {
		Q.clearStage(1);
		Q.state.off('change.coins');
		Q.state.set('coins', 0);
		if (currentLevel() <= MAXLEVEL) {
			Q.stageScene('level' + currentLevel(), 1, { sort: true });  // true for using z-order
		} else {
			Q.stageScene('win', 1);
		}
	};

	currentLevel = function() { return Q.state.get('level'); };
	currentSound = function() { return Q.state.get('sound'); };

	Q.scene('background', function(stage) {
		stage.insert( new Q.Repeater({ asset: 'background.png', z: 0 }) );
		Q.audio.play('background.mp3', { loop: true });
		Q.state.on('change.sound', function() {
			if (currentSound() == true) {
				Q.audio.play('background.mp3', { loop: true });
			} else {
				Q.audio.stop('background.mp3');
			}
		});
	});

	Q.scene('win', function(stage) {
		stage.insert( new Q.UI.Text ({
			label: 'You win',
			color: 'white',
			family: 'Pico',
			size: 150,
			x: stage.options.w/2,
			y: stage.options.h/3,
		}));
		stage.insert( new Q.UI.Text ({
			label: 'Died: ' + Q.state.get('die'),
			color: 'white',
			family: 'Pico',
			size: 50,
			x: stage.options.w/2,
			y: stage.options.h/2,
		}));
		stage.insert( new Q.UI.Text ({
			label: 'Press \'up\' to try again',
			color: 'white',
			family: 'Pico',
			size: 50,
			x: stage.options.w/2,
			y: stage.options.h/4*3,
		}));
		Q.input.on('up', function() {
			if (currentLevel() > MAXLEVEL) {
				Q.state.set({ level: 1, coins: 0, die: 0 });
				loadNextLevel();
			}
		});
	});

	Q.scene('level1', function(stage) {
		position = { x: 400, y: 500 };
		boundingBox = { minX: 100, maxX: 3000, minY: 0, maxY: 1000 };
		init = initLevel(stage, position, boundingBox);
		addLava(stage, init.layer);
		stage.insert (new Q.Coin ({ x: 1990, y: 440, player: init.player }));
		stage.insert (new Q.Coin ({ x: 2067, y: 440, player: init.player }));
		stage.insert (new Q.Coin ({ x: 2500, y: 570, player: init.player }));
		stage.insert (new Q.Coin ({ x: 2600, y: 570, player: init.player }));
		stage.insert (new Q.Coin ({ x: 2750, y: 350, player: init.player }));

		stage.insert (new Q.UI.Text ({ label: 'Use arrow keys to move', x: 400, y: 200, color: 'white', family: 'Pico', size: 30 }));
		stage.insert (new Q.UI.Text ({ label: 'Red things are bad', x: 1330, y: 200, color: 'white', family: 'Pico', size: 30 }));
		stage.insert (new Q.UI.Text ({ label: 'Coins should be picked', x: 2030, y: 200, color: 'white', family: 'Pico', size: 30 }));

		Q.state.on('change.coins', function() {
			if (Q.state.get('coins') >= 5) {
				init.player.pass();
			}
		});
		// stage.insert(new Q.Develop ({ stage: stage }));
	});

	Q.scene('level2', function(stage) {
		position = { x: 400, y: 500 };
		boundingBox = { minX: 100, maxX: 3200, minY: 0, maxY: 1000 };
		init = initLevel(stage, position, boundingBox);
		addLava(stage, init.layer);
		stage.insert (new Q.Coin ({ x: 1695, y: 365, player: init.player }));
		stage.insert (new Q.Coin ({ x: 2720, y: 320, player: init.player }));
		stage.insert (new Q.Coin ({ x: 2820, y: 320, player: init.player }));
		stage.insert (new Q.Coin ({ x: 2720, y: 540, player: init.player }));
		stage.insert (new Q.Coin ({ x: 2820, y: 540, player: init.player }));
		stage.insert (new Q.Lava ({ x: 400, y: 10*32+16, speed: 2 }));
		stage.insert (new Q.Lava ({ x: 22*32+16, y: 15*32+16, direct: 1, speed: 2 }));
		stage.insert (new Q.Lava ({ x: 27*32+16, y: 18*32+16, direct: 1, speed: 2 }));
		stage.insert (new Q.Lava ({ x: 2720, y: 12*32+16, speed: 2 }));
		stage.insert (new Q.Lava ({ x: 2820, y: 19*32+16, speed: 2 }));

		stage.insert (new Q.UI.Text ({ label: 'Left right..Left right..', x: 400, y: 200, color: 'white', family: 'Pico', size: 30 }));

		Q.state.on('change.coins', function() {
			if (Q.state.get('coins') >= 5) {
				init.player.pass();
			}
		});
		// stage.insert(new Q.Develop ({ stage: stage }));
	});

	Q.scene('level3', function(stage) {
		position = { x: 400, y: 500 };
		boundingBox = { minX: 100, maxX: 3200, minY: 0, maxY: 1000 };
		init = initLevel(stage, position, boundingBox);
		addLava(stage, init.layer);

		stage.insert (new Q.Coin ({ x: 655, y: 465, player: init.player }));
		stage.insert (new Q.Coin ({ x: 3000, y: 365, player: init.player }));
		stage.insert (new Q.Coin ({ x: 3040, y: 365, player: init.player }));
		stage.insert (new Q.Coin ({ x: 3000, y: 450, player: init.player }));
		stage.insert (new Q.Coin ({ x: 3040, y: 450, player: init.player }));
		stage.insert (new Q.Lava ({ x: 32*32+16, y: 14*32+16, speed: 2 }));
		stage.insert (new Q.Lava ({ x: 32*32+16, y: 15*32+16, speed: 2 }));
		stage.insert (new Q.Lava ({ x: 53*32+16, y: 15*32+16, direct: 1, speed: 2 }));

		Q.state.on('change.coins', function() {
			if (Q.state.get('coins') >= 5) {
				init.player.pass();
			}
		});
		// stage.insert(new Q.Develop ({ stage: stage }));
	});

	Q.scene('level4', function(stage) {
		position = { x: 360, y: 500 };
		boundingBox = { minX: 100, maxX: 3000, minY: 0, maxY: 1000 };
		init = initLevel(stage, position, boundingBox);
		addLava(stage, init.layer);

		stage.insert (new Q.Coin ({ x: 240, y: 550, player: init.player }));
		stage.insert (new Q.Coin ({ x: 1325, y: 240, player: init.player }));
		stage.insert (new Q.Coin ({ x: 2300, y: 480, player: init.player }));
		stage.insert (new Q.Coin ({ x: 2300, y: 570, player: init.player }));
		stage.insert (new Q.Coin ({ x: 2500, y: 570, player: init.player }));
		stage.insert (new Q.Lava ({ x: 37*32+16, y: 8*32+16, direct: 1, speed: 2 }));
		stage.insert (new Q.Lava ({ x: 45*32+16, y: 8*32+16, direct: 1, speed: 2 }));
		stage.insert (new Q.Lava ({ x: 2000, y: 13*32+16, direct: 1, speed: 3 }));
		stage.insert (new Q.Lava ({ x: 2100, y: 16*32+16, direct: 1, speed: 3 }));
		stage.insert (new Q.Lava ({ x: 2200, y: 19*32+16, direct: 1, speed: 3 }));
		stage.insert (new Q.Lava ({ x: 2500, y: 13*32+16, speed: 3 }));

		stage.insert (new Q.UI.Text ({ label: 'Funny to see you die =v=', x: 430, y: 400, color: 'white', family: 'Pico', size: 30 }));
		
		Q.state.on('change.coins', function() {
			if (Q.state.get('coins') >= 5) {
				init.player.pass();
			}
		});
		// stage.insert(new Q.Develop ({ stage: stage }));
	});

	Q.scene('level5', function(stage) {
		position = { x: 500, y: 500 };
		boundingBox = { minX: 100, maxX: 3200, minY: 0, maxY: 1000 };
		init = initLevel(stage, position, boundingBox);	
		addLava(stage, init.layer);

		stage.insert (new Q.Coin ({ x: 895, y: 405, player: init.player }));
		stage.insert (new Q.Coin ({ x: 1055, y: 405, player: init.player }));
		stage.insert (new Q.Coin ({ x: 1215, y: 405, player: init.player }));
		stage.insert (new Q.Coin ({ x: 2495, y: 270, player: init.player }));
		stage.insert (new Q.Coin ({ x: 2785, y: 270, player: init.player }));
		stage.insert (new Q.Lava ({ x: 30*32+16, y: 10*32+16, direct: 1, speed: 5 }));
		stage.insert (new Q.Lava ({ x: 35*32+16, y: 20*32+16, direct: 1, speed: 5 }));
		stage.insert (new Q.Lava ({ x: 1900, y: 17*32+16, speed: 6 }));
		stage.insert (new Q.Lava ({ x: 2025, y: 18*32+16, speed: 5 }));
		stage.insert (new Q.Lava ({ x: 2150, y: 19*32+16, speed: 4 }));
		stage.insert (new Q.Lava ({ x: 2275, y: 20*32+16, speed: 3 }));
		stage.insert (new Q.Lava ({ x: 2400, y: 21*32+16, speed: 2 }));

		stage.insert (new Q.UI.Text ({ label: 'Much more difficult ≖‿≖✧', x: 450, y: 200, color: 'white', family: 'Pico', size: 30 }));

		Q.state.on('change.coins', function() {
			if (Q.state.get('coins') >= 5) {
				init.player.pass();
			}
		});
		// sstage.insert(new Q.Develop ({ stage: stage }));
	});

	Q.scene('level6', function(stage) {
		position = { x: 400, y: 280 };
		boundingBox = { minX: 100, maxX: 3300, minY: 0, maxY: 1000 };
		init = initLevel(stage, position, boundingBox);
		addLava(stage, init.layer);

		for (i = 1850; i < 2010; i += 120) {
			for (j = 190; j < 310; j += 90) {
				stage.insert (new Q.Coin ({ x: i, y: j, player: init.player }));
			}
		}
		for (i = 2080; i < 2380; i += 100) {
			stage.insert (new Q.Coin ({ x: i, y: 580, player: init.player }));
		}
		for (j = 580; j < 660; j += 80) {
			stage.insert (new Q.Coin ({ x: 380, y: j, player: init.player }));
		}

		stage.insert (new Q.Lava ({ x: 36*32+16, y: 20*32+16, direct: 1, speed: 3 }));
		stage.insert (new Q.Lava ({ x: 28*32+16, y: 20*32+16, direct: 1, speed: 2 }));
		stage.insert (new Q.Lava ({ x: 28*32+16, y: 18*32+16, direct: 1, speed: 2 }));
		stage.insert (new Q.Lava ({ x: 20*32+16, y: 18*32+16, direct: 1, speed: 2 }));
		stage.insert (new Q.Lava ({ x: 20*32+16, y: 22*32+16, direct: 1, speed: 2 }));
		
		for (i = 83; i < 85; ++i) {
			stage.insert (new Q.Lava ({ x: i*32+16, y: 22*32+16, direct: 1, speed: 2 }));
		}
		for (i = 89; i < 91; ++i) {
			stage.insert (new Q.Lava ({ x: i*32+16, y: 22*32+16, direct: 1, speed: 2 }));
		}
		
		stage.insert (new Q.Lava ({ x: 76*32+16, y: 18*32+16, direct: 1, speed: 2 }));
		stage.insert (new Q.Lava ({ x: 62*32+16, y: 18*32+16, direct: 1, speed: 2 }));
		stage.insert (new Q.Lava ({ x: 70*32+16, y: 20*32+16, speed: 2 }));
		
		stage.insert (new Q.Lava ({ x: 70*32+16, y: 8*32+16, speed: 3 }));
		stage.insert (new Q.Lava ({ x: 80*32+16, y: 9*32+16, speed: 3 }));
		stage.insert (new Q.Lava ({ x: 90*32+16, y: 10*32+16, speed: 3 }));

		stage.insert (new Q.UI.Text ({ label: 'You won\'t pass this last level', x: 500, y: 200, color: 'white', family: 'Pico', size: 30 }));
		stage.insert (new Q.UI.Text ({ label: '(┙>∧<)┙へ┻┻', x: 450, y: 250, color: 'white' }));

		Q.state.on('change.coins', function() {
			if (Q.state.get('coins') >= 10) {
				init.player.pass();
			}
		});
		// stage.insert(new Q.Develop ({ stage: stage }));
	});
}
