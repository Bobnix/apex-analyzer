var sf = require('node-salesforce');
var _ = require('underscore');
var express = require("express");
var logfmt = require("logfmt");
var plugins = require("./checkPlugins");
var properties = require("./properties.js");

var app = express();
app.use(logfmt.requestLogger());
app.use(express.compress());

var records = [];

var conn = new sf.Connection({
  // you can change loginUrl to connect to sandbox or prerelease env.
  loginUrl : 'https://login.salesforce.com',
  maxRequest : 1000
});

conn.login(properties.username, properties.password, function(err, userInfo) {
  if (err) { return console.error(err); }

  queryForClasses();

});

var queryForClasses = function(){
  conn.tooling.query("SELECT Id, Name, Body FROM ApexClass WHERE NamespacePrefix = null", function(err, result) {
    if (err) { return console.error(err); }
    //console.log("Found " + result.totalSize + " classe(s)");

    records = result.records;

    deleteOldMetadata();
  });
}

var deleteOldMetadata  = function(){
  conn.tooling.query("SELECT Id, Name from MetadataContainer where Name = 'UnusedApexMethods'", function(err, result) {
    if (err) { return console.error(err); }

    if(result.records.length > 0){
      conn.tooling.sobject("MetadataContainer").destroy(result.records[0].Id, function(err, ret) {
        if (err || !ret.success) { return console.error(err, ret); }
        //console.log('Deleted Successfully : ' + ret.id);
        createMetadataContainer();
      });
    } else {
      createMetadataContainer();
    }

  });
}

var createMetadataContainer = function(){
  conn.tooling.sobject("MetadataContainer").create({ Name : 'UnusedApexMethods' }, function(err, ret) {
    if (err || !ret.success) { return console.error(err, ret); }
    //console.log("Created MetadataContainer id : " + ret.id);

    var tempClassMembers = [];
    _.each(records, function(record){
      tempClassMembers.push({
        Body: record.Body,
        ContentEntityId: record.Id,
        MetadataContainerId: ret.id,

      });
    });

    createApexClassMember(tempClassMembers, ret.id);

  });
}

var createApexClassMember = function(tempClassMembers, containerId){
  conn.tooling.sobject("ApexClassMember").create(tempClassMembers, function(err, rets) {
    if (err) { return console.error(err); }
    for (var i=0; i < rets.length; i++) {
      if (rets[i].success) {
        //console.log("Created ApexClassMember id : " + rets[i].id);
      }

    }

    createAsyncRequest(containerId);
    
  });
}

var createAsyncRequest = function(containerId){
  conn.tooling.sobject("ContainerAsyncRequest").create({ MetadataContainerId : containerId, IsCheckOnly: true }, function(err, ret) {
    if (err || !ret.success) { return console.error(err, ret); }
    //console.log("Created ContainerAsyncRequest id : " + ret.id);

    queryForAsyncRequest(ret.id, containerId)

  });
}

var queryForAsyncRequest = function(requestId, containerId){
  setTimeout(function(){
    conn.tooling.query("SELECT State, CompilerErrors  from ContainerAsyncRequest where Id = '"+requestId+"'", function(err, result) {
      if (err) { return console.error(err); }
      if(result.records[0].State == "Queued"){
        queryForAsyncRequest(requestId);
      } else if(result.records[0].State == "Failed"){
        console.log("Failed: " + result.records[0].CompilerErrors);
      } else {
        queryForClassMembers();
      }

    });

  }, 1000);
}

var queryForClassMembers = function(){
  conn.tooling.query("SELECT Body, ContentEntityId, SymbolTable FROM ApexClassMember WHERE MetadataContainer.Name = 'UnusedApexMethods'", function(err, result) {
    if (err) { return console.error(err); }
    //console.log("Found " + result.totalSize + " class member(s)");

    records = result.records;

    _.each(records, function(record){
      processResults(record);
    });
  });
}

var processResults = function(record){
  if(record.SymbolTable != null){
    _.each(plugins, function(plugin){
      plugin.test(record);
    });
  }
}