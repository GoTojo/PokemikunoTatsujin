enchant();

var core;

var WordObj=Class.create(Sprite, {
	initialize: function(note,word) {
		var num=(note-5);
		var maxnum=27;
		if (num<0) num+=12;
		while (num>maxnum) num-=12;
		Sprite.call(this,32,32);
		this.x = num*32;
		this.y = rand(100);
		this.frame = word;		
		this.image = core.assets['images/PocketMiku.png'];

		core.rootScene.addChild(this);
	},
	remove: function() {
		this.parentNode.removeChild(this);
	}
});

var StartLogo=Class.create(Sprite, {
	initialize: function(f) {
		Sprite.call(this,450,115);
		this.image = core.assets['images/start.png'];
		this.x = core.rootScene.width/2-this.width/2;
		this.y = core.rootScene.height/2-this.height/2
		this.ontouchstart=f;
		core.rootScene.addChild(this);
	}
});

window.onload = function() {
	core = new Core(864,480);
	core.rootScene.backgroundColor = "black";

	core.fps = 30;
	core.preload('images/PocketMiku.png');
	core.preload('images/start.png');
	var isStart=false;

	core.onload = function() {
		var bears = [];
		var startFunction = function() {
			this.parentNode.removeChild(this);
			play();
		};
		core.rootScene.ontouchstart = function () {
			stop();
			var startLogo = new StartLogo(startFunction);
		}
		var startLogo = new StartLogo(startFunction);
	}
	core.start();

};

var starttime=0;
var words=[];
// parent->iframe
function onmessage(message,word,timestamp) {
	console.log(message+','+word+','+timestamp);
	if ((message[0]==0x90) && (message[2]!=0)) { // note on
		var note = message[1];
		if (!words[note.toString(16)]) words[note.toString(16)] = new WordObj(note,word);
	} else if ((message[0]==0x80) || (message[0]==0x90)) {
		var note = message[1];
		if (words[note.toString(16)]) {
			words[note.toString(16)].remove();
			delete words[note.toString(16)];
		}
	}
}
// iframe->parent
function play() {
	starttime=window.parent.play();
}

function stop() {
	window.parent.stop();
}

function rand(n) {
	return Math.floor(Math.random()*(n+1));
}

