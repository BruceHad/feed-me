"use strict";

var express = require('express');
var fs = require('fs');
var config = require('../config.js');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  // Check and read logFile
  var logFile = config.outputPath+config.shortName+'.log';
  fs.readFile(logFile, "utf-8", function(error, res){
    if(error || res.length == 0)
      console.error('Error reading log file, use defaults instead.');
    else {
      var log = JSON.parse(res);
      config.firstUrl = log.nextUrl;
      config.lastUrl = log.lastUrl;
      config.tally = parseInt(log.tally, 10);
    }
    render();
  });
  function render(){
    if(req.query.update) config.success = true;
    else config.success = false;
    res.render('index', config);
  }
});

module.exports = router;
