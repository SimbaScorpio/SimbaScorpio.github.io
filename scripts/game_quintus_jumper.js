/*
  Programming and art made by Jiangchuan Hu
  You can freely look at the code below,
  but you are not allowed to use the code or art to make your own games
*/
$(document).ready(function() {
	Jumper();
})

function Jumper() {
	// initialize Quintus enginee including most of its modules
	Q = Quintus({
			imagePath: '../sources/images/Jumper/',
			audioPath: '../sources/audio/Jumper/',
			dataPath: '../sources/data/Jumper/',
			development: true
		}).include('Sprites, Scenes, Input, 2D, UI, Audio, Anim');
	Q.setup({ maximize: true }).enableSound();

	// load pictures, sounds and jsons the game needs
	pictures = ['background.png'];
	sounds = ['jump.mp3', 'die.mp3', 'win.mp3'];
	jsons = ['level.json'];
	src = pictures.concat(sounds).concat(jsons);
	Q.load(src, function(){ loadReady() }, {
		progressCallback: function(loaded, total) {
			console.log(loaded + "/" + total);
		}
	});

	loadReady = function() {
		Q.stageScene('background', 0)
		loadNextLevel()
	}

	groundY = 550;

	Q.Sprite.extend('Player', {
		init: function(p) {

		},
		detect: function(collision) {

		},
		pass: function() {

		},
		die: function() {

		},
		draw: function(ctx) {

		},
		step: function(dt) {

		}
	});


	loadNextLevel = function() {}

	Q.scene('background', function(stage) {
		stage.insert(new Q.Repeater({ asset: 'background.png', z: 0 }));
	});
}