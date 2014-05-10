	var midiAccess = null;
	var output = null;

	function listInputsAndOutputs(access) {
		var inputs = midiAccess.inputs();
		var outputs = midiAccess.outputs();

		for ( i = 0; i < inputs.length; i++) {
			var option = document.createElement("option");

			option.setAttribute("value", "midiInput");
			option.appendChild(document.createTextNode(inputs[i].name));
			document.getElementById("midiInputSelect").appendChild(option);
			console.log('input['+i+']:'+inputs[i].name);
		}

		for ( i = 0; i < outputs.length; i++) {
			var option = document.createElement("option");
			option.setAttribute("value", "midiOuput");
			option.appendChild(document.createTextNode(outputs[i].name));
			document.getElementById("midiOutputSelect").appendChild(option);
			console.log('output['+i+']:'+outputs[i].name);
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
		try { 
			var inputs = midiAccess.inputs();
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
		try { 
			var outputs = midiAccess.outputs();
			output = outputs[select.selectedIndex-1];
		} catch (e) {
			alert("Exception! Couldn't get i/o ports." + e );
		}
	};

	function onMIDIMessage(e) {
		console.log(e);
	}
