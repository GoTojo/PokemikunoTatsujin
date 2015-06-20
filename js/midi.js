// WebMIDI main
// Copyright 2014 gotojo All Rights Reserved. 
var midiAccess = null;
var output = null;

function listInputsAndOutputs(access) {
	if (typeof midiAccess.inputs === "function") {
		var inputs = midiAccess.inputs();	
		var outputs = midiAccess.outputs();		
	} else {
       var inputIterator = midiAccess.inputs.values();
        inputs = [];
        for (var o = inputIterator.next(); !o.done; o = inputIterator.next()) {
            inputs.push(o.value)
        }
        var outputIterator = midiAccess.outputs.values();
        outputs = [];
        for (var o = outputIterator.next(); !o.done; o = outputIterator.next()) {
            outputs.push(o.value)
        }
	}

	for (var i = 0; i < inputs.length; i++) {
		var option = document.createElement("option");

		option.setAttribute("value", "midiInput");
		option.appendChild(document.createTextNode(inputs[i].name));
		document.getElementById("midiInputSelect").appendChild(option);
		//console.log('input['+i+']:'+inputs[i].name);
	}

	for (var i = 0; i < outputs.length; i++) {
		var option = document.createElement("option");
		option.setAttribute("value", "midiOuput");
		option.appendChild(document.createTextNode(outputs[i].name));
		document.getElementById("midiOutputSelect").appendChild(option);
		//console.log('output['+i+']:'+outputs[i].name);
	}
};

function onMIDISuccess(access) {
	midiAccess = access;
	//console.log("midi ready!");
	listInputsAndOutputs(access);
};

function onMIDIFailure(msg) {
	alert("Failed to midi available- " + msg);
};

function selectMidiInput() {
	var select = document.getElementById("midiInputSelect");
	var options = document.getElementById("midiInputSelect").options;
	var value = options.item(select.selectedIndex).value;
	if (select.selectedIndex==0) return;
	if (typeof midiAccess.inputs === "function") {
		var inputs = midiAccess.inputs();	
		var outputs = midiAccess.outputs();		
	} else {
       var inputIterator = midiAccess.inputs.values();
        inputs = [];
        for (var o = inputIterator.next(); !o.done; o = inputIterator.next()) {
            inputs.push(o.value)
        }
        var outputIterator = midiAccess.outputs.values();
        outputs = [];
        for (var o = outputIterator.next(); !o.done; o = outputIterator.next()) {
            outputs.push(o.value)
        }
	}

	try { 
		var input = inputs[select.selectedIndex-1];
		input.onmidimessage = onMIDIMessage;
	} catch (e) {
		alert("Exception! Couldn't get i/o ports." + e );
	}
};

function selectMidiOutput() {
	var select = document.getElementById("midiOutputSelect");
	var options = document.getElementById("midiOutputSelect").options;
	var value = options.item(select.selectedIndex).value;
	if (select.selectedIndex==0) return;
	if (typeof midiAccess.inputs === "function") {
		var inputs = midiAccess.inputs();	
		var outputs = midiAccess.outputs();		
	} else {
       var inputIterator = midiAccess.inputs.values();
        inputs = [];
        for (var o = inputIterator.next(); !o.done; o = inputIterator.next()) {
            inputs.push(o.value)
        }
        var outputIterator = midiAccess.outputs.values();
        outputs = [];
        for (var o = outputIterator.next(); !o.done; o = outputIterator.next()) {
            outputs.push(o.value)
        }
	}
	try { 
		output = outputs[select.selectedIndex-1];
		console.log('output('+output.name+')is selected')
	} catch (e) {
		alert("Exception! Couldn't get i/o ports." + e );
	}
};
var pbtbl = [
	-6656,-6144,-5632,-5120,-4608,-4096,-3584,
	-3072,-2560,-2048,-1536,-1024,
	-512,0,512,1024,1536,2048,2560,
	3072,3584,4096,4608,5120,
	5632,6144,6656
];
function nsx32tomidi(note,pb) {
	var i=0;
	for (;i<pbtbl.length;i++) {
		if (pbtbl[i]>=pb) {
			break;
		}
	}
	return note+i-13;
}
var pb=0;
var cur39note=-1;
function onMIDIMessage(e) {
	//console.log(e);
	if (nsx39mode) {
		if (e.data[0]==0xe0) {
			pb=(e.data[2]<<7)+e.data[1]-(0x2000);
		} else if (e.data[0]==0x90) {
			cur39note=nsx32tomidi(e.data[1],pb);
			onnoteon(cur39note,window.performance.now());
		} else if (e.data[0]==0x80) {
			onnoteoff(cur39note,window.performance.now());
			cur39note=-1;
		}
	} else {
		if (((e.data[0]==0x90)&&(e.data[2]==0x00))||(e.data[0]==0x80)) { // note off
			onnoteoff(e.data[1],window.performance.now());
			if (output) output.send(e.data);
		} else if (e.data[0]==0x90) { // note on
			onnoteon(e.data[1],window.performance.now());
			if (output) output.send(e.data);
		} else {
			if (output) output.send(e.data);		
		}
	}
}
