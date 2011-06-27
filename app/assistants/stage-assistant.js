var bannerError =  function(error, params){
	launchParams = params || {action: "nothing"};
	Mojo.Controller.getAppController().showBanner({messageText: error, icon: 'images/error-icon.png'}, launchParams, "error");	
}

function StageAssistant() {}

StageAssistant.prototype.setup = function() {
	this.controller.pushScene("detect");
};