var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
chai.use(chaiHttp);

// var assert = require('assert');
// var feed = require('../app/feed_scraping.js');

describe('Scrape', function() {
  this.timeout(15000);
  it('Return front page', function(done){
      chai.request("https://feed-me-brucehad.c9users.io:8080")
        .get('/')
        .end(function(err, res){
            console.log(err);
            res.should.have.status(200);
            done();
        });
  });
  it('Generate feed file and log', function(done){
     chai.request("https://feed-me-brucehad.c9users.io:8080")
        .get('/scrape')
        .end(function(err, res){
            res.should.have.status(200);
            done();
        })
  });
});
