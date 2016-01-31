var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var fs      = require('fs');

var app = express();

app.get('/scrape', function(req, res){

  var url = 'http://www.imdb.com/title/tt1229340/';

  request(url, function(error, response, html){

    if(!error){
      var $ = cheerio.load(html);
      var title, release, rating;
      var json = {title: "", release: "", rating: ""};

      $('.header').filter(function(){
        var data = $(this);
        title = data.children().first().text();
        release = data.children().last().children().text();

        json.title = title;
        json.release = release;
      });

      $('.star-box-giga-star').filter(function(){
        var data = $(this);
        rating = data.text();
        json.rating = rating;
      });
    }
    else {
      console.log(error);
    }

    // Now format and save the data.
    fs.writeFile(
      './json_output/output.json',
      JSON.stringify(json, null, 4),
      function(err){
        console.log(err);
        console.log('File successfully written!');});

    // Send message to browser
    var message = "<p>Magic happens on port 8081</p>";
    message += "<p>Check your terminal.</p>"
    res.send(message);

  });

});

app.listen('8081')
console.log('Magic happens on port 8081 - http://localhost:8081/scrape');
exports = module.exports = app;

