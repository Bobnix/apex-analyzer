var _ = require('underscore'); 

module.exports = {
	properties: {
		enabled : true,
		nameRegex : /^[a-z][a-zA-Z]*$/
	},
	test: function(record){
		var self = this;
		_.each(record.SymbolTable.methods, function(method){
		  if(!method.name.match(self.properties.nameRegex)){
		    console.log("Invalid method name: " + method.name + " in class " + record.SymbolTable.name);
		  }
		});
	}
};