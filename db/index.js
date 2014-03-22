var sqlite3 = require("sqlite3").verbose();
var path = require('path');
var fs = require('fs');
var db;

var fileName = path.join(__dirname, 'apex_analyzer.db');

exports.init = function(callback){

	if(!db){
		db = new sqlite3.Database(fileName, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function(err){
			if(err){console.log("Error opening db: " + err); return;}

			db.get("SELECT * FROM app_info",[], function(err, row){
				db.serialize(function() {
					var version = 0
					if(err){
						db.run("CREATE TABLE app_info (dbVersion INTEGER)");
						db.run("INSERT INTO app_info VALUES(0)");
					} else {
						version = row.dbVersion;
					}

					switch(version){
						case 0:
							db.run("CREATE TABLE orgs (name TEXT, username TEXT, password TEXT)");
					}

					db.run("UPDATE app_info SET dbVersion = ?", 1);
				});
			})
		});
	}
}

exports.getOrgList = function(callback){
	exports.init();

	db.all("SELECT rowid, * FROM orgs", [], callback);
}

exports.addOrg = function(name, username, password, callback){
	exports.init();

	db.run("INSERT INTO orgs VALUES(?,?,?)", [name, username, password], callback);
}

exports.getOrg = function(id, callback){
	exports.init();

	db.get("SELECT rowid, * FROM orgs WHERE rowid = ?", [id], callback);
}