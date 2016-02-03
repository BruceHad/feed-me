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

// function formatDate(d){
//   var y = ''+ d.getFullYear();
//   var m = d.getMonth() > 9 ? d.getMonth() : '0' + d.getMonth() ;
//   var d = d.getDate() > 9 ? d.getDate() : '0' + d.getDate();
//   var dateString = y+m+d;
//   return dateString;
// }

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
  fs.writeFile(path, log, function(err){
      if(err) console.log(err);
      else console.log('Log File successfully written!');
  });
}



app.get('/scrape', function(req, res){
  var url = config.firstURL;
  var pageCount = config.pageCount;
  var items = [];
  function getHTML(url){
    // recursive
    // requests HTML from URL then gets next page and repeats
    if(items.length >= pageCount){
      buildRSS(items);
      res.send('Check your console');
    }
    else {
      request(url, function(error, response, html){
        if(!error){
          items.push(scrapePage(html, url));
          url = getNext(html);
          console.log(url);
          getHTML(url);
        }
        else console.log("Error getting url:", url);
      });
    }
  }
  getHTML(url);
});

app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;
