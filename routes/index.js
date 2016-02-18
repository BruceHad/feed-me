var express = require('express');
var fs      = require('fs');
var config = require('../config.js'); // separate config file
var router = express.Router();



// Check and read logFile
var logFile = config.outputPath+config.shortName+'.log';
fs.readFile(logFile, "utf-8", function(error, res){
  if(error || res.length == 0)
    console.error('Error reading log file, use defaults instead.');
  else {
    res = res.split('|');
    config.firstURL = res[0];
    config.tally = parseInt(res[1], 10);
  }
});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', config);
});

module.exports = router;
