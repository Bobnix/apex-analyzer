var plugins = [];

require("fs").readdirSync("./checkPlugins").forEach(function(file) {
	if(file.match(/.*.js$/) && file != "index.js"){
		var temp = require("./" + file);
		if(temp.properties.enabled == true){
		  plugins.push(temp);
		}
	}
});

module.exports = plugins;