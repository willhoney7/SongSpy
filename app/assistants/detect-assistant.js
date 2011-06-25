function DetectAssistant() {}

DetectAssistant.prototype.setup = function() {
	
	this.gctx = document.getElementById('waveform-canvas').getContext('2d');
	
	this.controller.setupWidget("recordButton", 
		{},
    	this.recordModel = {
			label : "Go!",
         	disabled: false,
		 	buttonClass: 'affirmative'
     	}
    );
    this.controller.setupWidget("spinner",
		{
	    	spinnerSize: "large"
	  	},
	  	this.spinnerModel = {
			spinning: false
	  	}
	); 

	this.controller.setupWidget("playButton",
        {
			type: Mojo.Widget.activityButton
		},
        this.playModel = {
			label: "Play",
			disabled: true
        }
    );
	  
	this.startCallback = this.startCallback.bind(this);
	this.playCallback = this.playCallback.bind(this);
	this.controller.listen(this.controller.get('playButton'), Mojo.Event.tap, this.playCallback);
	this.controller.listen(this.controller.get('recordButton'), Mojo.Event.tap, this.startCallback);
	
	var mediaCaptureLib = MojoLoader.require({
		name: "mediacapture",
		version: "1.0"
	});	  
	if(mediaCaptureLib){
		this.audioRecorder = mediaCaptureLib.mediacapture.MediaCapture();
		
		this.audioRecorder.load(
			this.audioRecorder.captureDevices[0].deviceUri,
			{}
		);
		//this.audioRecorder.addEventListener("error", this.handleError, false);
		
	}else{
		Mojo.Log.error("Error loading media capture lib.");
	}
};

DetectAssistant.prototype.activate = function(event) {
	this.controller.listen(this.controller.get('playButton'), Mojo.Event.tap, this.playCallback);
	this.controller.listen(this.controller.get('recordButton'), Mojo.Event.tap, this.startCallback);
};

DetectAssistant.prototype.deactivate = function(event) {
	/* remove all event handlers*/
	this.controller.stopListening(this.controller.get('playButton'), Mojo.Event.tap, this.playCallback);
	this.controller.stopListening(this.controller.get('recordButton'), Mojo.Event.tap, this.startCallback);
    //this.audioRecorder.removeEventListener("error", this.handleError, false);
	this.stopGrapher();
};

DetectAssistant.prototype.cleanup = function(event) {
	this.audioRecorder.unload();	
};
DetectAssistant.prototype.startCallback = function(event) {	
	this.randomInt = Math.floor(Math.random()*99999);
	this.controller.get('area-to-update1').innerText = 'Recording ...';
	this.audioRecorder.startAudioCapture(/*Mojo.appPath +*/ "/media/internal/audio/recording" + this.randomInt + ".wav", 
		{audioCaptureFormat: this.getAudioCaptureFormat()}
	);

	setTimeout(this.stopCallback.bind(this), 5000);
	this.startGrapher();

	this.playModel.disabled = true;
	this.controller.modelChanged(this.playModel);

	this.recordModel.disabled = true;
	this.recordModel.label = "Analyzing...";
	this.controller.modelChanged(this.recordModel);
	
	this.controller.get('spinner').mojo.start();

};

DetectAssistant.prototype.stopCallback = function(event) {
	this.controller.get('area-to-update1').innerText = 'Recording finished, press play';
	this.controller.get('spinner').mojo.stop();
	
	this.playModel.disabled = false;
	this.controller.modelChanged(this.playModel);

	this.recordModel.disabled = false;
	this.recordModel.label = "Go!";

	this.controller.modelChanged(this.recordModel);
	
	this.audioRecorder.stopAudioCapture();
	this.stopGrapher();

	//var filePath = "/media/internal/audio/recording" + this.randomInt +  ".wav";
	//@TODO: Send file to plugin
};

function getGraphColor(isRecording){
	if (isRecording){
		return "rgb(0, 200, 0)";
	}
	else {
		return "rgb(50, 100, 50)";
	}
}

DetectAssistant.prototype.grapher = function(){
	// Get most recent sample of VU data.
	if (0 != this.audioRecorder.vuData.length){
		var vuData = this.audioRecorder.vuData.pop();
		var height = 80 * vuData.peak[0];

		if (this.gctx){
			this.gctx.fillStyle = getGraphColor(this.audioRecorder.audioCapture);
			this.gctx.fillRect(this.x, 80-height, 4, 80);
		}
	}

	this.x+=5;
	if (this.x == 300) {
		this.gctx.fillStyle = "rgb(0, 0, 0)"
		this.gctx.clearRect(0, 0, 300, 80);
		this.x = 0;
	}
}	

DetectAssistant.prototype.startGrapher = function(){	
	this.x = 0
	this.gctx.fillStyle = "rgb(0, 0, 0)"
	this.gctx.clearRect(0, 0, 300, 80);
	this.gtimer = window.setInterval(this.grapher.bind(this), 100);
	
}

DetectAssistant.prototype.stopGrapher= function(){
	if (this.gtimer){
		window.clearInterval(this.gtimer);
		this.gtimer = 0;
	}
}

DetectAssistant.prototype.playCallback = function(event) {
	this.myAudioObj = new Audio();
	this.myAudioObj.src = /*Mojo.appPath +*/ "/media/internal/audio/recording" + this.randomInt +  ".wav";
	this.myAudioObj.addEventListener("ended", function(){
		this.controller.get('spinner').mojo.stop();
	}.bind(this), false);
	this.myAudioObj.load();
	this.myAudioObj.play();	
};

DetectAssistant.prototype.getAudioCaptureFormat = function(){
	var fmt; 
	for (var i = 0; i < this.audioRecorder.supportedAudioFormats.length; i++){
		fmt = this.audioRecorder.supportedAudioFormats[i];
		if (fmt.samplerate === 44100){
			return fmt;
		}
	}
};