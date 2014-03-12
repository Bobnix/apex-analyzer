module.exports = {
	properties: {
		enabled : true
	},
	test: function(record){
	  if(record.SymbolTable.methods.length >= 10){
	    console.log("Too many methods in class " + record.SymbolTable.name);
	  }
	}
}