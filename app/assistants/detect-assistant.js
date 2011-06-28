function DetectAssistant() {}

DetectAssistant.prototype.setup = function() {
		
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
};

DetectAssistant.prototype.cleanup = function(event) {
	this.audioRecorder.unload();	
};
DetectAssistant.prototype.startCallback = function(event) {	
	if(!this.isWorking){
		this.isWorking = true;

		this.randomInt = Math.floor(Math.random()*99999);

		this.audioRecorder.startAudioCapture(/*Mojo.appPath +*/ "/media/internal/audio/recording" + this.randomInt + ".wav", 
			{audioCaptureFormat: this.getAudioCaptureFormat()}
		);

		setTimeout(this.stopCallback.bind(this), 8000);

		this.animateText("Listening");
		
		this.playModel.disabled = true;
		this.controller.modelChanged(this.playModel);

		this.controller.get("recordButton").addClassName("recording");

	}

	this.controller.get('spinner').mojo.start();

};

DetectAssistant.prototype.stopCallback = function(event) {
	
	this.playModel.disabled = false;
	this.controller.modelChanged(this.playModel);

	this.controller.get("recordButton").removeClassName("recording");
	this.controller.get("recordButton").addClassName("analyzing");	
	this.stopAnimatingTextUpdate();
	this.animateText("Analyzing");

	this.audioRecorder.stopAudioCapture();

	//var filePath = "/media/internal/audio/recording" + this.randomInt +  ".wav";
	//@TODO: Send file to plugin
	setTimeout(this.gotResponse.bind(this), 8000);

};

DetectAssistant.prototype.gotResponse = function(transport){

	this.isWorking = false;
	this.controller.get('spinner').mojo.stop();

	var transport = {
	    response: {
	        status: {
	            version: "4.2",
	            code: 0,
	            message: "Success"
	        },
	        songs: [
	            {
	                score: 80,
	                title: "Assassin",
	                message: "OK (match type 6)",
	                artist_id: "AROCZUC1187B9AD05B",
	                artist_name: "Muse",
	                id: "SOFUGZY12B0B808249"
	            },
	            {
	                score: 65,
	                title: "Walk",
	                message: "OK (match type 6)",
	                artist_id: "AROCZUC1187B9AD05B",
	                artist_name: "Foo Fighters",
	                id: "SOFUGZY12B0B808249"
	            },
	            {
	                score: 48,
	                title: "Accidents Will Happen",
	                message: "OK (match type 6)",
	                artist_id: "AROCZUC1187B9AD05B",
	                artist_name: "Elvis Costello",
	                id: "SOFUGZY12B0B808249"
	            },
	            {
	                score: 25,
	                title: "Some say...",
	                message: "OK (match type 6)",
	                artist_id: "AROCZUC1187B9AD05B",
	                artist_name: "My Grandma",
	                id: "SOFUGZY12B0B808249"
	            }
	        ]
	    }
	}
	if(transport.response.status.code === 0){
		this.controller.stageController.pushScene("song-details", transport.response.songs);
	} else {
		bannerError("No Match. Try again.")
	}

	this.controller.get("recordButton").removeClassName("analyzing");

	this.stopAnimatingTextUpdate();

}
DetectAssistant.prototype.animateText = function(text){
	var div = this.controller.get("text-update");
		div.innerHTML = text;
		div.show();

	this.animateTextUpdate = true;

	function addDot(){
		if(this.animateTextUpdate){
			div.innerHTML += ".";
			this.t = setTimeout(addDot.bind(this), 300);
			if(div.innerHTML.length - 4 === text.length){
				div.innerHTML = text;
			}	
		} else {
			div.innerHTML = text;
		}
	}	

	this.t = setTimeout(addDot.bind(this), 300);
}

DetectAssistant.prototype.stopAnimatingTextUpdate = function(div){
	this.animateTextUpdate = false;
	this.controller.get("text-update").hide();
	clearTimeout(this.t);

	//this.audioRecorder.vuData
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