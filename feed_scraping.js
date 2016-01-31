"use strict";

var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var fs      = require('fs');
var jstoxml = require('jstoxml');
var app = express();

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
    {guid: url}
  ];
  return item;
}

app.get('/scrape', function(req, res){
  var url = 'http://killsixbilliondemons.com/comic/kill-six-billion-demons-chapter-1/'; // first
  request(url, function(error, response, html){
    if(!error){
      var items = []
      items.push(scrapePage(html, url));
      // console.log(items);
      var rss = {
        _name: "rss",
        _attrs: {version: "2.0"},
        _content: {
          channel:{
            title: " Feed Me - Kill Six Billion Demons",
            link: "http://killsixbilliondemons.com/",
            description: "This is a webcomic! It’s graphic novel style, meaning it’s meant to be read in large chunks, but you can subject yourself to the agony of reading it a couple pages a week!",
            language: "en-us",
            item: items
          }
        }
      };
      // Now format and save the data.
      fs.writeFile(
        './json_output/output.rss',
        jstoxml.toXML(rss, {header: false, indent: '  '}),
        function(err){
          console.log(err);
          console.log('File successfully written!');
        });
      // Send message to browser??

      res.send('Check your console');

    }
  });
});

app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;

