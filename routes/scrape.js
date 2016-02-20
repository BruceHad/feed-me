"use strict";

var config = require('../config.js');
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var fs      = require('fs');
var jstoxml = require('jstoxml');
var FTP = require('ftpimp');

var router = express.Router();

function addDays(d, days){
  d.setTime( d.getTime() + days * 86400000 );
  return d;
}

function getNext(html){
  var $ = cheerio.load(html);
  return $('.comic-nav-next').attr('href');
}

function scrapePages(url, pageCount, complete){
  // fill items with results of scrapped pages
  var items = [];
  config.next = url;

  function getHtml(){
    if(items.length >= pageCount){
      var rssJson = buildRss(items);
      createFile(rssJson);
      updateLog(complete);
    }
    else {
      request(config.next, function(err, res, html){
        if(err)
          console.error('Error requesting html: ', error);
        else {
          items.push(scrapePage(html, url));
          config.next = getNext(html);
          getHtml();
        }
      });
    }
  }
  getHtml();
}

function buildRss(items){
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
        type: "application/rss+xml"}
      }]}};
  for (var key in items){
    rss._content.channel.push({item: items[key]});
  }
  return rss;
}

function scrapePage(html, url){
  var epoch = new Date(0); // hack(K6MD doesn't publish actual dates to copy.)
  var $ = cheerio.load(html);
  var item = [
  {title: $('title').text()},
  {link: url},
  {author: $('.post-author').find('a').text()},
  {
    _name: 'enclosure',
    _attrs: {
      url: $('#comic').find('img').attr('src'),
      length: "0",
      type: "image/jpg"}
    },
    {description: $('.post-info').text() + $('.entry').text()},
    {
      _name: 'guid',
      _content: url,
      _attrs: {isPermaLink: false}
    },
    {pubDate: addDays(epoch, config.tally).toUTCString()}
  ];
  config.tally = Number(config.tally) + 1;
  return item;
}

function createFile(rssJson){
  var feedPath = config.outputPath+config.shortName+'.rss';
  var rss = jstoxml.toXML(rssJson, {header: false, indent: '  '});
  fs.writeFile(feedPath, rss, function(error){
      if(error)
        console.error('Error writing RSS file: ', error);
      else
        if(config.ftpFile) ftpFile(feedPath);
    });
}

function updateLog(complete){
  var outputPath = config.outputPath+config.shortName+'.log';
  var log = {
    tally: config.tally,
    nextUrl: config.next
  };
  fs.writeFile(outputPath, JSON.stringify(log), function(error){
    if(error) console.error('Error writing log file: ', error);
    else complete();
  });
}

function ftpFile(feedPath){
  var cfg = config.ftp;
  // console.log(cfg);
  var ftp = FTP.create(cfg, false);
  ftp.connect(function () {
    ftp.put([feedPath, config.ftpPath], function (err, filename) {
      if(err) console.log(err)
      else console.log("FTPed");
    });
  });
}

/* POST scrape page. */
router.post('/', function(req, res, next) {
  // Update config
  config.firstUrl = req.body["start-url"];
  config.pageCount = req.body["page-count"];
  config.tally = req.body["tally"];
  config.ftpFile = (req.body.ftp === "ftp")?true:false;
  var complete = function(){
    res.redirect('/');
  }
  scrapePages(config.firstUrl, config.pageCount, complete);
});

module.exports = router;
