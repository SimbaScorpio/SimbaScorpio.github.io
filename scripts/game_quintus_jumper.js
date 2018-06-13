/*
  Programming and art made by Jiangchuan Hu
  You can freely look at the code below,
  but you are not allowed to use the code or art to make your own games
*/
$(document).ready(function() {
	var h = $('#game-canvas').attr('height');
	$('.container-fluid').css('margin-top', ($(window).get(0).innerHeight-h)/2);
	Jumper();
})

function Jumper() {
	// initialize Quintus enginee including most of its modules
	Q = Quintus({
			imagePath: '../sources/images/game/Jumper/',
			audioPath: '../sources/audio/game/Jumper/',
			dataPath: '../sources/data/game/Jumper/',
			development: true
		}).include('Sprites, Scenes, Input, 2D, UI, Audio, Anim');
	Q.setup("game-canvas").enableSound();

	// load pictures, sounds and jsons the game needs
	pictures = ['background.png'];
	sounds = ['jump.mp3', 'die.mp3', 'win.mp3'];
	jsons = ['level.json'];
	src = pictures.concat(sounds).concat(jsons);
	Q.load(src, function(){ loadReady() }, {
		progressCallback: function(loaded, total) {
			progress(loaded, total);
		}
	});

	loadReady = function() {
		$('.progress').hide();
		$('.logo').hide();
		Q.stageScene('background', 0);
		loadNextLevel();
	}

	progress = function(loaded, total) {
		$('#progress-bar').css('width', loaded/total*100 + '%');
	}

	Q.state.reset({ die: 0, level: 1, maxLevel: 100, sound: true });

	Q.controls();	// Mention that Q.controls() should be called after setting touchControls 
					// and before setting keyboardControls.	
	Q.input.keyboardControls({
		SPACE: 'up'
	});

	canvasWidth = $('#game-canvas').attr('width');
	canvasHeight = $('#game-canvas').attr('height');
	rtt = canvasHeight/800;
	groundY = Math.floor(550*rtt);

	Q.Sprite.extend('Player', {
		init: function(p) {
			this._super(p, {
				x: 100, y: 400,
				w: 42*rtt, h: 42*rtt,
				vx: 0, vy: 0,
				ax: 0, ay: 0,
				gravity: 0.02*rtt,
				jumpable: false,
				start: false,
				hidden: false
			});
			this.add('2d, tween');
			this.on('hit', this, this.detect);
		},
		detect: function(collision) {
			if (collision.obj.isA('Ground') && this.p.hidden == false) {
				this.p.vy = 0;
				this.p.jumpable = true;
				if (currentLevel() != 1) {
					if (this.p.start == false) {
						this.p.start = true;
					}
				}
			} else { this.die(); }
		},
		pass: function() {
			Q.state.inc('level', 1);
			loadNextLevel();
		},
		die: function() {
			if (this.p.hidden == false) {
				Q.state.inc('die', 1);
				if (currentSound()) {
					Q.audio.play('die.mp3');
				}
				for (var i = 0; i < 9; ++i) {
					this.p.stage.insert(new Q.Sparkle({
						x: this.p.x,
						y: this.p.y
					}));
				}
				this.p.hidden = true;
				this.p.vx = 0;
				this.animate ({ angle:0 }, 0.2, Q.Easing.Linear, {
					callback: function() { loadNextLevel(); }
				});
			}
		},
		draw: function(ctx) {
			ctx.fillStyle = 'white';
			ctx.fillRect(-this.p.cx, -this.p.cy, this.p.w, this.p.h);
		},
		step: function(dt) {
			if (this.p.start == true) {
				this.p.vx = 5.5*rtt;
				this.p.x += this.p.vx;
			}
			this.p.y += this.p.vy;
			if (Q.inputs['up'] && this.p.jumpable == true) {
				if (currentLevel() == 1) {
					this.p.start = true;
				}
				this.p.jumpable = false;
				this.p.vy = -9.5*rtt;
				this.animate({ angle: 180 + this.p.angle }, 0.9);
				if (currentSound()) {
					Q.audio.play('jump.mp3');
				}
			}
			if (this.p.y > groundY - this.p.h/2) {
				this.p.y = groundY - this.p.h/2;
			}
			if (this.p.x > this.p.stage.options.w + this.p.w/2) {
				this.pass();
			}
		}
	});

	Q.Sprite.extend('Ground', {
		init: function(p) {
			this._super(p, {
				x: 0, y: groundY,
				w: 14000, h: 2
			});
		},
		draw: function(ctx) {
			ctx.fillStyle = 'white';
			ctx.fillRect(this.p.x, -this.p.h/2, this.p.w, this.p.h);
		}
	});

	Q.Sprite.extend('Brick', {
		init: function(p) {
			this._super(p, {
				w: 42*rtt, h: 0, hi: 0
			});
			this.add('tween');
			this.show();
		},
		draw: function(ctx) {
			ctx.fillStyle = 'white';
			ctx.fillRect(-this.p.cx, this.p.cy, this.p.w, this.p.hi);
		},
		show: function() {
			this.p.y = groundY - this.p.h/2;
			this.animate({ hi: -this.p.h }, 0.5);
		}
	});

	Q.Sprite.extend('Brick2', {
		init: function(p) {
			this._super(p, {
				w: 39*rtt, h: Math.floor(14*rtt)+1, y: Math.floor(groundY - 42*rtt - 13*rtt)
			});
		},
		draw: function(ctx) {
			ctx.fillStyle = 'white';
			ctx.fillRect(-this.p.cx, -this.p.cy, this.p.w, this.p.h);
		}
	});

	Q.Sprite.extend('Sparkle', {
		init: function(p) {
			this._super(p, {
				w: 10, h: 10,
				vx: Math.random() * 18 - 3,
				vy: Math.random() * 18 - 14,
				ax: 0, ay: 0.5,
				type: Q.SPRITE_FRIENDLY
			});
		},
		draw: function(ctx) {
			ctx.fillStyle = 'rgba(255,255,255,0.95)'
			ctx.fillRect(-this.p.cx, -this.p.cy, this.p.w, this.p.h);
		},
		step: function(dt) {
			this.p.x += this.p.vx;
			this.p.y += this.p.vy;
			this.p.vy += this.p.ay;
		}
	})

	loadNextLevel = function() {
		Q.clearStage(1);
		if (currentLevel() > maxLevel()) {
			Q.clearStage(2);
			Q.stageScene('win', 1);
		} else {
			Q.stageScene('level', 1);
		}
	}

	Q.scene('background', function(stage) {
		stage.insert(new Q.Repeater({ asset: 'background.png', z: 0 }));
	});

	addBrick = function(stage, tiles) {
		Q.state.set('maxLevel', tiles.length);
		row = currentLevel() - 1;
		for (var i = 0; i < tiles[row].length - 1; ++i) {
			if (tiles[row][i] != 0) {
				if (tiles[row][i] == -1) {
					stage.insert(new Q.Brick2({ x: canvasWidth/42*i }));
				} else {
					stage.insert(new Q.Brick({ x: canvasWidth/42*i, h: tiles[row][i]*21*rtt }));
				}
			}
		}
	}

	currentLevel = function() { return Q.state.get('level'); }
	currentDie = function() { return Q.state.get('die'); }
	maxLevel = function() { return Q.state.get('maxLevel'); }
	currentSound = function() { return Q.state.get('sound'); }

	Q.scene('level', function(stage) {
		stage.insert(new Q.Ground());
		player = stage.insert(new Q.Player({ stage: stage }));
		layer = new Q.TileLayer({ dataAsset: 'level.json' });
		addBrick(stage, layer.p.tiles);
		stage.insert(new Q.UI.Text({
			label: currentDie().toString(),
			color: 'white',
			family: 'Pico',
			size: 50,
			x: canvasWidth/8,
			y: groundY + 50
		}));
		stage.insert(new Q.UI.Text({
			label: currentLevel() + "/" + maxLevel(),
			color: 'white',
			family: 'Pico',
			size: 50,
			x: canvasWidth/8*7,
			y: groundY + 50
		}));
		if (currentLevel() == 1) {
			stage.insert(new Q.UI.Text({
				label: 'Press \'space\' or \'up\' to start',
				color: 'white',
				family: 'Pico',
				size: 50,
				x: canvasWidth/2,
				y: 150
			}));
		}
		stage.on('destroy', function(){ player.destroy(); });
	});

	Q.scene('win', function(stage) {
		Q.audio.stop();
		if (currentSound()) {
			Q.audio.play('win.mp3');
		}
		stage.insert(new Q.UI.Text({
			label: 'Died: ' + currentDie(),
			color: 'white',
			family: 'Pico',
			size: 50,
			x: canvasWidth/2,
			y: canvasHeight/2
		}));
		stage.insert(new Q.UI.Text({
			label: 'Press \'space\' or \'up\' to try again',
			color: 'white',
			family: 'Pico',
			size: 50,
			x: canvasWidth/2,
			y: canvasHeight/4*3
		}));
		Q.input.on('up', function(){
			if (currentLevel() > maxLevel()) {
				Q.state.set({ die: 0, level: 1 });
				loadNextLevel();
			}
		});
	});
}