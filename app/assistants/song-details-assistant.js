function SongDetailsAssistant(results) {
	this.results = results;
}

SongDetailsAssistant.prototype.setup = function() {
	var content = Mojo.View.render({collection: this.results, formatters: {
		"score": function(value, model){
			if(model.score >= 80){
				return "green";
			} else if (model.score >= 60){
				return "yellow";
			} else if (model.score >= 40){
				return "orange";
			} else {
				return "red";
			}
		}
	}, template: 'song-details/item'});
	this.controller.get("results-container").innerHTML =  content;
};

SongDetailsAssistant.prototype.activate = function(event) {
	
};

SongDetailsAssistant.prototype.deactivate = function(event) {
	
};

SongDetailsAssistant.prototype.cleanup = function(event) {

};
