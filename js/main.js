enchant();

var core;
var startframe;
var oct=12*4;
var windowWidth=864;
var windowHeight=480;
var tempo=60000000/120; //BPM=120
var fps=30;
var frameShowWord=15;
var wordXpos=[];
var targets=[];
var maxnum=27;
var words=[];
(function() {
	var wordXposLeft=12;
	var wordXposGapWB=27;
	var idx=0;
	var offset=wordXposLeft;
	for (var i=0;i<7;i++) { wordXpos[idx]=offset+wordXposGapWB*idx; idx++; }
	offset+=wordXposGapWB;
	for (var i=0;i<5;i++) { wordXpos[idx]=offset+wordXposGapWB*idx; idx++; }
	offset+=wordXposGapWB;
	for (var i=0;i<7;i++) { wordXpos[idx]=offset+wordXposGapWB*idx; idx++; }
	offset+=wordXposGapWB;
	for (var i=0;i<5;i++) { wordXpos[idx]=offset+wordXposGapWB*idx; idx++; }
	offset+=wordXposGapWB;
	for (var i=0;i<3;i++) { wordXpos[idx]=offset+wordXposGapWB*idx; idx++; }
	for (var i=0;i<128;i++) {
		words[i]=[];
	}
})();
var scoreAreaHeight=32;
var dropStartPosY=scoreAreaHeight;
var lastPosY=windowHeight-32;
var dropHeight=lastPosY-dropStartPosY;
var BlinkTargetObj=Class.create(Sprite, {
	blink:0,
	framecount:0,
	initialize: function(num) {
		Sprite.call(this,32,32);
		this.x=wordXpos[num];
		this.y=lastPosY-1;
		this.image=core.assets['images/maru.png'];
		this.frame=1;
		core.rootScene.addChild(this);
	},
	blinkon: function() {
		this.framecount=Math.floor(tempo/2/1000000*core.fps);
		this.blink++;
	},
	blinkoff: function() {
		if (this.blink) this.blink--;
		if (this.blink==0) this.frame=1;
	},
	onenterframe: function() {
		if (this.blink) {
			if ((core.frame%this.framecount)==0) {
				if (this.frame==1) { 
					this.frame=2; 
				} else {
					this.frame=1;
				} 
			}
		}
	}
});
var WordObjBase=Class.create(Sprite, {
	beginframe:0,
	showframe:0,
	endframe:0,
	dropping:false,
	downstep:0,
	num:0,
	note:0,
	initialize: function(note,word,timestamp,width) {
		this.note=note;
		var num=(note-5)-oct;
		while (num<0) num+=12;
		while (num>maxnum) num-=12;
		this.num=num;
		Sprite.call(this,width,32);
		this.x = wordXpos[num];
		this.y = 32;
		this.opacity = 0.0;
		var framecount=tempo*4/1000000*fps;
		this.downstep=dropHeight/framecount;
		core.rootScene.addChild(this);
		//console.log("beginframe:"+this.beginframe);
	},
	begin: function(timestamp) { 
		this.beginframe=Math.floor((timestamp-tempo*4/1000)*core.fps/1000)+startframe;
		this.showframe=this.beginframe-frameShowWord;
	},
	onenterframe: function() {
		if (this.beginframe!=0) {
			if (this.dropping) {
				if (this.y>=lastPosY) {
					this.dropping=false;
				} else {
					this.y+=this.downstep;
				}
			}
			if (core.frame==this.showframe) {
				this.opacity = 1.0;			
			}
			if ((this.beginframe!=0) &&(core.frame==this.beginframe)) {
				//console.log("begin fire:"+core.frame);
				this.dropping=true;
				if (this.beginfunc) this.beginfunc();
			}
			if ((this.endframe!=0) && (core.frame>=this.endframe)) {
				//console.log("end fire:"+core.frame);
				core.rootScene.removeChild(this);
				if (this.endfunc) this.endfunc();
			}
		}
	}
});
var WordObj=Class.create(WordObjBase, {
	initialize: function(note,word,timestamp) {
		WordObjBase.call(this,note,word,timestamp,32);
		this.image=core.assets['images/PocketMiku.png'];
		this.width=32;
		this.frame=word;
		words[note].push(this);
	},
	beginfunc: function() {
		targets[this.num].blinkon();
	},
	endfunc: function() {
		for (var i=0;i<words.length;i++) {
			if (words[this.note][i] == this) { // may be i==0, for safety
				words[this.note].splice(i,1);
			}			
		}
		targets[this.num].blinkoff();
	}
});
var NegiObj=Class.create(WordObjBase, {
	initialize: function(note,word,timestamp) {
		WordObjBase.call(this,note,word,timestamp,12);
		this.image=core.assets['images/negi.png'];
		this.x+=10;
	}
});
function noteon(note,word,timestamp) {
	var negi=new NegiObj(note,word,timestamp);
	var word=new WordObj(note,word,timestamp);
	word.begin(timestamp);
	word.negi=negi;
};
function noteoff(note,word,timestamp) {
	var obj;
	for (var i=0;i<words[note].length;i++) {
		if (words[note][i].endframe!=0) {
			continue;
		}
		obj=words[note][i];
		break;
	}
	if (!obj) return;
	obj.negi.begin(timestamp);
	var endframe=Math.floor(timestamp*core.fps/1000)+startframe;
	obj.endframe=endframe;
	obj.negi.endframe=endframe;
};
var StartLogo=Class.create(Sprite, {
	shown:false,
	initialize: function(f) {
		Sprite.call(this,450,115);
		this.image = core.assets['images/start.png'];
		this.x = core.rootScene.width/2-this.width/2;
		this.y = core.rootScene.height/2-this.height/2;
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
	core.preload('images/maru.png');
	core.preload('images/PocketMikuBG.png');
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
		var bgimage= new Sprite(windowWidth,windowHeight);
		bgimage.image=core.assets['images/PocketMikuBG.png'];
		core.rootScene.addChild(bgimage);
		for (var i=0;i<maxnum;i++) {
			targets[i]=new BlinkTargetObj(i);
		}
		var startLogo = new StartLogo(startFunction);
	}
	core.start();

};
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
		noteon(note,curword,timestamp);
	} else if ((message[0]==0x80) || (message[0]==0x90)) {
		var note = message[1];
		noteoff(note,curword,timestamp);
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

