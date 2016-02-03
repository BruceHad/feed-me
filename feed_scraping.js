"use strict";

// http://killsixbilliondemons.com/comic/chapter-3/|41


var today = new Date();
var epoch = new Date(0);
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

function scrapePage(html, url){
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

function getNext(html){
  var $ = cheerio.load(html);
  return $('.comic-nav-next').attr('href');
}

function buildRSS(items){
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
  // Now format and save the data.
  var path = config.outputPath+config.shortName+'.rss';
  fs.writeFile(
    path,
    jstoxml.toXML(rss, {header: false, indent: '  '}),
    function(err){
      if(err) console.log(err);
      else console.log('Feed File successfully written!');
  });

  //Write log
  var path = config.logPath+config.shortName+'.log';
  var log = items[items.length-1][1].link;
  log += '|'+ (config.tally);
  console.log(log);
  fs.writeFile(path, log, function(error){
      if(error) throw error;
      console.log('Log File successfully written!');
  });
}



app.get('/scrape', function(req, res){
  var logFile = config.logPath+config.shortName+'.log';
  var url, pageCount, items = [];

  // Read log file and update config.
  // Then call getHTML.
  fs.readFile(logFile, "utf-8", function(error, res){
    if(error) throw error;
    var res = res.split('|');
    config.firstURL = res[0];
    config.tally = parseInt(res[1], 10);
    console.log(config.tally);
    getHTML(config.firstURL);
  });

  function getHTML(url){
    // recursive
    // requests HTML from URL then gets next page and repeats
    if(items.length >= config.pageCount){
      buildRSS(items);
      res.send('Check your console');
    }
    else {
      request(url, function(error, response, html){
        if(error) throw error;
        items.push(scrapePage(html, url));
        url = getNext(html);
        console.log(items.length, url);
        getHTML(url);
      });
    }
  }

});

app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;
