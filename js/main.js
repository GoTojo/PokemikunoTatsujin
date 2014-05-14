enchant();

var core;
var startframe;
var oct=12*4;
var windowWidth=864;
var windowHeight=480;
var tempo=60000000/120; //BPM=120
var fps=30;
var frameShowWord=15;
var WordObj=Class.create(Sprite, {
	beginframe:0,
	endframe:0,
	dropping:false,
	downstep:0,
	negi:undefined,
	negibeginframe:0,
	negidropping:false,
	negidownstep:0,
	initialize: function(note,word,timestamp) {
		var num=(note-5)-oct;
		var maxnum=27;
		while (num<0) num+=12;
		while (num>maxnum) num-=12;
		Sprite.call(this,32,32);
		this.x = num*32;
		this.y = 32;
		this.frame = word;		
		this.image = core.assets['images/PocketMiku.png'];
		this.opacity = 0.0;
		this.beginframe=Math.floor((timestamp-tempo*4/1000)*core.fps/1000)+startframe;
		var framecount=tempo*4/1000000*fps;
		this.downstep=(windowHeight-32)/framecount;
		this.negidownstep=(windowHeight-32)/framecount;
		this.negi=new Sprite(12,30);
		this.negi.image=core.assets['images/negi.png'];
		this.negi.x = this.x+10;
		this.negi.y = 32;
		this.negi.opacity=0.0;
		core.rootScene.addChild(this.negi);
		core.rootScene.addChild(this);
		//console.log("beginframe:"+this.beginframe);
	},
	onenterframe: function() {
		if (this.dropping) {
			if (this.y>=windowHeight-32) {
				this.dropping=false;
			} else {
				this.y+=this.downstep;
			}
		}
		if (core.frame==this.beginframe-frameShowWord) {
			this.opacity = 1.0;			
		}
		if (core.frame==this.beginframe) {
			//console.log("begin fire:"+core.frame);
			this.dropping=true;
		}
		if ((this.endframe!=0) && (core.frame>=this.endframe)) {
			//console.log("end fire:"+core.frame);
			core.rootScene.removeChild(this);
			if (this.negi) core.rootScene.removeChild(this.negi);
		}
		if (core.frame==this.negibeginframe) {
			//console.log("begin fire:"+core.frame);
			this.negi.opacity=1.0;
			this.negidropping=true;
		}
		if (this.negidropping) {
			if (this.negi.y>=windowHeight-32) {
				this.negidropping=false;
			} else {
				this.negi.y+=this.negidownstep;
			}
		}
	},
	noteoff: function(timestamp) {
		this.negibeginframe=Math.floor((timestamp-tempo*4/1000)*core.fps/1000)+startframe;
		this.endframe=Math.floor(timestamp*core.fps/1000)+startframe;
		var framecount=tempo*4/1000000*fps;
	},
	removeall: function() {
		this.dropping=false;
		this.negidropping=false;
		core.rootScene.removeChild(this);
		core.rootScene.removeChild(this.negi);
	}
});

var StartLogo=Class.create(Sprite, {
	shown:false,
	initialize: function(f) {
		Sprite.call(this,450,115);
		this.image = core.assets['images/start.png'];
		this.x = core.rootScene.width/2-this.width/2;
		this.y = core.rootScene.height/2-this.height/2
		this.ontouchstart=f;
		this.showlogo();
	},
	hidelogo: function() {
		core.rootScene.removeChild(this);
		this.shown=false;
	},
	showlogo: function() {
		core.rootScene.addChild(this);
		this.shown=true;
	}
});

window.onload = function() {
	core = new Core(windowWidth,windowHeight);
	core.rootScene.backgroundColor = "black";

	core.fps = fps;
	core.preload('images/PocketMiku.png');
	core.preload('images/start.png');
	core.preload('images/negi.png');
	var isStart=false;

	core.onload = function() {
		var startFunction = function() {
			if (window.parent.checkReady()) {
				startframe=core.frame;
				this.hidelogo();
				play();
			}
		};
		core.rootScene.ontouchstart = function () {
			stop();
			startLogo.showlogo();
		}
		var startLogo = new StartLogo(startFunction);
	}
	core.start();

};
var words=[];
var curword=0;

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
		words[note.toString(16)] = new WordObj(note,curword,timestamp);
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

