enchant();

var core;
var startframe;
var oct=12*4;
var WordObj=Class.create(Sprite, {
	beginframe:0,
	endframe:0,
	initialize: function(note,word,timestamp) {
		var num=(note-5)-oct;
		var maxnum=27;
		while (num<0) num+=12;
		while (num>maxnum) num-=12;
		Sprite.call(this,32,32);
		this.x = num*32;
		this.y = 0;
		this.frame = word;		
		this.image = core.assets['images/PocketMiku.png'];
		//this.opacity(0.0);
		this.beginframe=Math.floor(timestamp*core.fps/1000)+startframe;
		core.rootScene.addChild(this);
		console.log("beginframe:"+this.beginframe);
	},
	onenterframe: function() {
		this.y+=3;
		if (core.frame==this.beginframe) {
			//this.opacity(1.0);
			console.log("begin fire:"+core.frame);
		}
		if ((this.endframe!=0) && (core.frame>=this.endframe)) {
			console.log("end fire:"+core.frame);
			core.rootScene.removeChild(this);
		}
	},
	noteoff: function(timestamp) {
		this.endframe=Math.floor(timestamp*core.fps/1000)+startframe;
		console.log("endframe:"+this.endframe);
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
			startframe=core.frame;
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
var words=[];
var curword=0;
var tempo=60000000/120; //BPM=120

// parent->iframe
function onmessage(message,timestamp) {
	if (message[0]==0xf0) {
		var sysexhead = [0xF0,0x43,0x79,0x09,0x11,0x0A,0x00];
		if (message.length != (sysexhead.length+1+1)) return;
		for (var i=0;i<sysexhead.length;i++) {
			if (message[i] != sysexhead[i]) return;
		}
		if (message[sysexhead.length+1] != 0xf7) return;
		curword=message[sysexhead.length];
	} else if ((message[0]==0x90) && (message[2]!=0)) { // note on
		var note = message[1];
		words[note.toString(16)] = new WordObj(note,curword,timestamp-tempo*4/1000);
	} else if ((message[0]==0x80) || (message[0]==0x90)) {
		var note = message[1];
		if (words[note.toString(16)]) {
			words[note.toString(16)].noteoff(timestamp);
			delete words[note.toString(16)];
		}
	}
}
function onsongend() {
}
function settempo(tempo,timestamp) {
	tempo=tempo;
}
// iframe->parent
function play() {
	window.parent.play();
}

function stop() {
	window.parent.stop();
}

function rand(n) {
	return Math.floor(Math.random()*(n+1));
}

