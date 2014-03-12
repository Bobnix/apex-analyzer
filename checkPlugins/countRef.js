var _ = require('underscore'); 

module.exports = {
	properties: {
		enabled : true
	},
	test: function(record){
		_.each(record.SymbolTable.methods, function(method){
		  if(method.references.length == 0 && !record.SymbolTable.name.match(/.*[t|T]est$/)){
		    console.log("Missing method ref : " + method.name + " in class " + record.SymbolTable.name);
		  }
		});
	}
};