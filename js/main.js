// enchant.js main.js
// Copyright 2014 gotojo All Rights Reserved. 
enchant();

var core;
var starttime;
var oct=12*4;
var windowWidth=864;
var windowHeight=480;
var keyboardPosY=windowHeight-100;
var tempo=60000000/120; //BPM=120
var fps=30;
var pointHit=30;
var penalty=3;
var bonus=5;
var timeShowWord=500;//millisecond
var wordXpos=[];
var targets=[];
var maxnum=27;
var words=[];
var endLogo;
var score=0;
var playing=false;
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
	for (var i=0;i<128;i++) { words[i]=[]; }
})();
var scoreAreaHeight=32;
var dropStartPosY=scoreAreaHeight;
var lastPosY=windowHeight-32-1;
var dropHeight=lastPosY-dropStartPosY;
var TargetObj=Class.create(Sprite, {
	blink:0,
	framecount:0,
	oncount:0,
	touched:false,
	point:pointHit,
	num:0,
	initialize: function(num) {
		Sprite.call(this,32,32);
		this.num=num;
		this.x=wordXpos[num];
		this.y=lastPosY;
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
	noteon: function() { this.oncount++; this.point=pointHit;},
	noteoff: function() { if (this.oncount) this.oncount--;},
	blinkoffnow: function() {
		this.blink=0;
		this.frame=1;
	},
	ontouchstart: function() {
		this.touched=true;
		reqnoteon(this.num+oct+5);
	},
	ontouchend: function() {
		this.touched=false;
		reqnoteoff(this.num+oct+5);
	},
	midinoteon: function() {
		this.touched=true;
	},
	midinoteoff: function() {
		this.touched=false;
	},
	onenterframe: function() {
		//this.backgroundColor=this.touched?'rgba(255, 255, 255, 1.0)':'rgba(0, 0, 0, 1.0)';
		if (this.blink) {
			if ((core.frame%this.framecount)==0) {
				if (this.frame==1) { 
					this.frame=2; 
				} else {
					this.frame=1;
				} 
			}
		}
		if (playing&&this.touched) {
			if (this.oncount) { score+=this.point; this.point+=bonus; if (score>99999999) score=99999999; }
			else { score-=penalty; if (score<0) score=0; }
		}
	}
});
function notetonum(note) {
	var num=(note-5)-oct;
	while (num<0) num+=12;
	while (num>=maxnum) num-=12;
	return num;
}
var WordObjBase=Class.create(Sprite, {
	begintime:0,
	showtime:0,
	dropping:false,
	num:0,
	note:0,
	timestamp:0,
	nextframe:0,
	offtime:0,
	isbegin:false,
	initialize: function(note,word,width) {
		this.note=note;
		this.num=notetonum(note);
		Sprite.call(this,width,32);
		this.x = wordXpos[this.num];
		this.y = 32;
		this.opacity = 0.0;
		this.touchEnabled = false;
		core.rootScene.addChild(this);
	},
	begin: function(timestamp) { 
		this.timestamp=timestamp;
		this.begintime=Math.floor(timestamp-tempo*4/1000);
		this.showtime=this.begintime-timeShowWord;
	},
	onenterframe: function() {
		var curtime=window.performance.now()-starttime;
		if (this.begintime!=0) {
			if (this.dropping) {
				var framecount=tempo*4/1000000*fps;
				var downstep=dropHeight/framecount;
				this.y+=downstep;
				if (this.y>=lastPosY) {
					this.dropping=false;
					this.y=lastPosY;
					if (this.reachfunc) this.reachfunc();
				}
			}
			if (!this.isbegin&&(curtime>=this.begintime)) {
				this.dropping=true;
				this.isbegin=true;
				if (this.beginfunc) this.beginfunc();
			}
			if ((this.opacity!=1.0) && (curtime>=this.showtime)) {
				this.opacity = 1.0;			
			}
			if ((this.offtime!=0) && (curtime>=this.offtime)) {
				core.rootScene.removeChild(this);
				if (this.endfunc) this.endfunc();
			}
		}
	}
});
var WordObj=Class.create(WordObjBase, {
	initialize: function(note,word) {
		WordObjBase.call(this,note,word,32);
		this.image=core.assets['images/PocketMiku.png'];
		this.width=32;
		this.frame=word;
	},
	beginfunc: function() {
		targets[this.num].blinkon();
	},
	reachfunc: function() {
		targets[this.num].noteon();
	},
	endfunc: function() {
		for (var i=0;i<words.length;i++) {
			if (words[this.note][i] == this) { // may be i==0, for safety
				words[this.note].splice(i,1);
			}			
		}
		targets[this.num].blinkoff();
		targets[this.num].noteoff();
	},
});
var NegiObj=Class.create(WordObjBase, {
	initialize: function(note,word,timestamp) {
		WordObjBase.call(this,note,word,12);
		this.image=core.assets['images/negi.png'];
		this.x+=10;
	}
});
function noteon(note,word,timestamp) {
	var negi=new NegiObj(note,word);
	var word=new WordObj(note,word);
	word.begin(timestamp);
	word.negi=negi;
	words[note].push(word);
};
function noteoff(note,word,timestamp) {
	var obj;
	for (var i=0;i<words[note].length;i++) {
		if (words[note][i].offtime!=0) continue;
		obj=words[note][i];
		break;
	}
	if (!obj) return;
	obj.negi.begin(timestamp);
	obj.offtime=timestamp;
	obj.negi.offtime=timestamp;
};
function allnoteoff() {
	for (var note=0;note<words.length;note++) {
		for (var i=0;i<words[note].length;i++) {
			var wordobj=words[note][i];
			core.rootScene.removeChild(wordobj.negi);
			core.rootScene.removeChild(wordobj);
		}
		words[note] = [];
	}
	for (var i=0;i<targets.length;i++) {
		targets[i].oncount=0;
		targets[i].blinkoffnow();
		targets[i].midinoteoff();
	}
	clearreservenote();
	reqallnoteoff();
};
var waitinfo=null;
var reqSMF=null;
var infoText=Class.create(Label, {
	initialize: function(str) {
		Label.call(this,20,20);
		var startx=core.rootScene.width;
		var movex=core.rootScene.width+this.width
		this.x = startx;
		this.y = 50;
		this.color = 'rgba(255, 255, 255, 1.0)';
		this.font = "20px 'Arial'";
		this.text=str;
		this.tl.moveBy(movex*(-1), 0, 300).moveBy(movex,0,0).loop();
	},
	hidetext: function() {
		core.rootScene.removeChild(this);
	},
	showtext: function() {
		core.rootScene.addChild(this);
	}
});
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
var EndLogo=Class.create(Label, {
	initialize: function(f) {
		Label.call(this,450,115);
		this.x = core.rootScene.width/2-this.width/2;
		this.y = core.rootScene.height/2-this.height/2;
		this.color = 'rgba(255, 255, 255, 1.0)';
		this.font = "30px 'Arial'";
		this.text='score:'+('00000000'+score.toString(10)).slice(-8);
		this.cb=f;
	},
	hidelogo: function() {
		core.rootScene.removeChild(this);
		this.shown=false;
	},
	showlogo: function() {
		this.text='score:'+('00000000'+score.toString(10)).slice(-8);
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
				allnoteoff();
				starttime=window.performance.now();
				this.hidelogo();
				waitinfo.showtext();
				if (reqSMF) { reqSMF.hidetext(); reqSMF=null; }
				score=0;
				playing=true;
				play();
			}
		};
		core.rootScene.ontouchstart = function (e) {
			if (e.localY<keyboardPosY) {
				playing=false;
				stop();
				allnoteoff();
				startLogo.showlogo();
				endLogo.hidelogo();
			}
		};
		core.rootScene.addEventListener('enterframe',function() {
			scorelabel.text='score:'+('00000000'+score.toString(10)).slice(-8);
		});
		var bgimage= new Sprite(windowWidth,windowHeight);
		bgimage.image=core.assets['images/PocketMikuBG.png'];
		core.rootScene.addChild(bgimage);
		for (var i=0;i<maxnum;i++) {
			targets[i]=new TargetObj(i);
		}
		reqSMF = new infoText('曲を選んでね');
		reqSMF.showtext();
		waitinfo = new infoText('レッツゴー');
		var startLogo = new StartLogo(startFunction);
		endLogo = new EndLogo(startFunction.showlogo);
		var scorelabel = new Label('score:000000');
		scorelabel.color = 'rgba(255, 255, 255, 1.0)';
		scorelabel.font = "20px 'Arial'";
		core.rootScene.addChild(scorelabel);
		for (var i=0;i<maxnum;i++) {
			if (!asciiObj[i]) {
				asciiObj[i]=new AsciiObj(i,acsiitbl[i]);
			}
		}
	}
	core.start();
};
var curword=0;
// parent->iframe
function onmessage(message,timestamp) {
	if (message[0]==0xf0) {
		var sysexhead39 = [0xF0,0x43,0x79,0x09,0x11,0x0A,0x00];
		var sysexhead = [0xF0,0x43,0x79,0x09,0x00,0x50,0x11,0x0A,0x00];
		if (message.length==(sysexhead.length+1+1)) {
			//for (var i=0;i<sysexhead.length;i++) if (message[i]!=sysexhead[i]) return;
			//if (message[sysexhead.length+1] != 0xf7) return;
			//curword=message[sysexhead.length];
		} else if (message.length >= (sysexhead39.length+1+1)) {
			for (var i=0;i<sysexhead39.length;i++) if (message[i]!=sysexhead39[i]) return;
			if (message[sysexhead39.length+1] != 0xf7) return;
			curword=message[sysexhead39.length];
		}
	} else if ((message[0]==0x90) && (message[2]!=0)) { // note on
		var note = message[1];
		noteon(note,curword,timestamp);
	} else if ((message[0]==0x80) || (message[0]==0x90)) {
		var note = message[1];
		noteoff(note,curword,timestamp);
	}
}
function onsongend() {
	playing=false;
	if (endLogo) endLogo.showlogo();
}
var reserveNote=[];
var ReserveMidiEvent=Class.create(Node, {
	initialize: function(note,timestamp,fison) {
		Node.call(this);
		core.rootScene.addChild(this);
		var time=timestamp-window.performance.now();
		if (time==0) { fison?noteon(note):noteoff(note); }
		else {
			var frame=time/1000*core.fps;
			this.tl.delay(frame).then(function() {
				var target=targets[notetonum(note)];
				fison?target.midinoteon():target.midinoteoff();
				//fison?target.ontouchstart():target.ontouchend();
				core.rootScene.removeChild(this);
				for (var i=0;i<reserveNote.length;i++) {
					if (reserveNote[i]==this) {
						reserveNote.splice(i,1);
					}
				}
			});
			core.rootScene.addChild(this);
		}
	}
});
function onnoteon(note,timestamp) {
	targets[notetonum(note)].midinoteon();
}
function onnoteoff(note,timestamp) {
	targets[notetonum(note)].midinoteoff();
}
function clearreservenote() {
	for (var i=0;i<reserveNote.length;i++) {
		core.rootScene.removeChild(reserveNote[i]);
	}
	reserveNote=[];
}
function settempo(newtempo,timestamp) {
	tempo=newtempo;
}
function onplaystart(newtempo,timestamp) {
	waitinfo.hidetext();
}
function onsmfready(newtempo,timestamp) {
	if (reqSMF) {
		reqSMF.hidetext();
		reqSMF=null;
	}
}
var asciiYposW=423;
var asciiYposB=377;
var asciiObj=[];
var isWhite=[1,0,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,0,1,1,0,1,0,1,1,0,1];
var acsiitbl=['Z','S','X','D','C','F','V', 'B','H','N','J','M', ',','L','.',';','/',':','_',
				'I','9','O','0','P','@','^','['];
var AsciiObj=Class.create(Label, {
	initialize: function(num,code) {
		Label.call(this,32,32);
		this.x = wordXpos[num]+10;
		this.y = isWhite[num]?asciiYposW:asciiYposB;
		this.color = 'rgb(255, 255, 255)';
		this.opacity = 0.0;
		this.font = "18px 'Arial'";
		this.text=code;
		core.rootScene.addChild(this);
	}
});

function onshowascii(f) {
	var o=f?0.5:0.0;
	for (var i=0;i<maxnum;i++) {
		asciiObj[i].opacity=o;
	}
}
function asciitonote(ascii) {
	for (var i=0;i<acsiitbl.length;i++) {
		if (acsiitbl[i]==ascii) {
			return i+oct;
		}
	}
	return -1;
}
//
// enchant.jsにはキーボードショートカットがある?
// コンフリクトしてるっぽい
//
function onkbdon(ascii) {
	//var note=asciitonote(ascii);
	//if (note>=0) noteon(note,curword,window.performance.now());
}
function onkbdoff(ascii) {
	//var note=asciitonote(ascii);
	//if (note>=0) noteoff(note,curword,window.performance.now());
}
// iframe->parent
function play() {
	window.parent.play();
}

function stop() {
	window.parent.stop();
}
function reqnoteon(note) {
	window.parent.reqnoteon(note);
}
function reqnoteoff(note) {
	window.parent.reqnoteoff(note);
}
function reqallnoteoff() {
	window.parent.reqallnoteoff();
}

// utility
function rand(n) {
	return Math.floor(Math.random()*(n+1));
}

