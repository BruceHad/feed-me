"use strict";

var config = require('./config.js'); // separate config file
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var fs      = require('fs');
var jstoxml = require('jstoxml');
var app = express();


function addDays(d, days){
  d.setTime( d.getTime() + days * 86400000 );
  return d;
}

function getNext(html){
  var $ = cheerio.load(html);
  return $('.comic-nav-next').attr('href');
}

app.get('/', function(req, res){
  res.send('Hello World!');
});

app.get('/scrape', function(req, res){

  // Read log file and update config then get HTML for pages to be scraped.
  var logFile = config.logPath+config.shortName+'.log';
  fs.readFile(logFile, "utf-8", function(error, res){
    if(error || res.length == 0)
      console.error('Error reading log file, use defaults instead: ', error);
    else {
      res = res.split('|');
      config.firstURL = res[0];
      config.tally = parseInt(res[1], 10);
    }
    console.log(config.tally, config.firstURL);
    getHTML();
  });
  
  // (recursive) requests HTML from URL and add to items
  // Once items is full update config and buildRss
  var items = [];
  function getHTML(){
    var url = config.firstURL;
    if(items.length >= config.pageCount){
      config.next = url;
      buildRSS(items);
      res.send('Check your console');
    }
    else {
      request(url, function(error, response, html){
        if(error) console.error('Error requesting html: ', error);
        items.push(scrapePage(html, url));
        console.log(config.tally, items.length, url);
        config.firstURL = getNext(html);
        getHTML();
      });
    }
  }
  
  function scrapePage(html, url){
    var epoch = new Date(0); // hack(K6MD doesn't publish actual dates to copy.)
    var $ = cheerio.load(html);
    var item = [
      {title: $('title').text()},
      {link: url},
      {author: $('.post-author').find('a').text()},
      {_name: 'enclosure',
        _attrs: {
          url: $('#comic').find('img').attr('src'),
          length: "0",
          type: "image/jpg"
        }
      },
      {description: $('.post-info').text() + $('.entry').text()},
      {_name: 'guid',
        _content: url,
        _attrs: {isPermaLink: false}
      },
      {pubDate: addDays(epoch, config.tally).toUTCString()}
    ];
    config.tally += 1;
    return item;
  }
  
  // Build JSON from Items and convert to RSS
  // write to output .rss file
  function buildRSS(items){
    var today = new Date();
    var rss = {
      _name: "rss",
      _attrs: {version: "2.0", "xmlns:atom":"http://www.w3.org/2005/Atom"},
      _content: {
        channel: [
          {title: config.title},
          {link: config.link},
          {description: config.description},
          {language: config.language},
          {pubDate: today.toUTCString()},
          {lastBuildDate: today.toUTCString()},
          {_name: "atom:link",
            _attrs: {
              href: config.publish + config.shortName+'.rss',
              rel: "self",
              type: "application/rss+xml"
            }
          }
        ]
      }
    };
    
    for (var key in items){
      rss._content.channel.push({item: items[key]});
    }
    
    // Now convert to RSS and save the data to file.
    var feed_path = config.outputPath+config.shortName+'.rss';
    fs.writeFile(feed_path,
      jstoxml.toXML(rss, {header: false, indent: '  '}),
      function(error){
        if(error)
          console.error('Error writing RSS file: ', error);
        console.log('RSS File successfully written!');
    });
    updateLog();
  }
  
  //Write log file
  function updateLog(){
    var log_path = config.logPath+config.shortName+'.log';
    var log = config.next;
    log += '|'+ (config.tally);
    fs.writeFile(log_path, log, function(error){
        if(error)
          console.error('Error writing log file: ', error);
        console.log('Log File successfully written!');
    });
  }

});

app.listen('8080');
console.log('Magic happens on port 8080');
exports = module.exports = app;
