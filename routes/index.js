var db = require('../db');
var salesforce = require('../salesforce');
var util = require('util');
/*
 * GET home page.
 */

exports.index = function(req, res){
	db.getOrgList(function(err, rows){
		console.log(util.inspect(rows));
		res.render('index', {title: 'Apex Analyzer', orgList: rows });
	});
};

exports.getOrgSetup = function(req, res){
	res.render('orgSetup', {title: 'Apex Analyzer: Org Setup'});
};

exports.postOrgSetup = function(req, res){
	salesforce.login(req.body.username, req.body.password, function(accessToken, instanceUrl){
		db.addOrg(req.body.name, req.body.username, req.body.password, function(){
			res.redirect('/');
		})
		
	});
};

exports.getOrg = function(req, res){
	db.getOrg(parseInt(req.params.orgId), function(err, row){
		if(err){console.log("Error reading: " + err); return;}
		console.log(util.inspect(row));
		salesforce.getClassData(row.username, row.password, function(){
			res.render('orgSetup', {title: 'Apex Analyzer: ' + row.name});
		})
		
	})
	
};