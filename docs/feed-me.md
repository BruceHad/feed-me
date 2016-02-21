# Feed Me

January 2016

_(Learning Project)_

Scraping a website and building an RSS feed from the results.

## Learn Node & Scraping

Never used Node before so here I'll be learning the basics of Node and the Express framework, and using it to scrape the web.

* https://scotch.io/tutorials/scraping-the-web-with-node-js
* http://code.tutsplus.com/tutorials/screen-scraping-with-nodejs--net-25560
* https://blog.hartleybrody.com/web-scraping/

Required Tools:

* NodeJS
* nodemon
* [ExpressJS](http://expressjs.com/) (framework)
* [Request](https://github.com/mikeal/request) (http requests)
* [Cheerio](https://github.com/MatthewMueller/cheerio) (dom traversing like JQuery)
* fs (File System)

### Setup & Installation

_nodedemon_ is like live reloading, but for Node. This saves having to Ctrl-C...node every time you make a change. nodemon should be installed globally. If not, install it.

  npm install nodemon -g

And from here on use _nodemon_ in place of the _node_ command. e.g.

  nodemon server.js

Set up a NodeJS project and include dependencies. e.g:

package.json:
  {
    "name"         : "node-web-scrape",
    "version"      : "0.0.1",
    "description"  : "Scrape le web.",
    "main"         : "server.js",
    "author"       : "Scotch",
    "dependencies" : {
      "express"    : "latest",
      "request"    : "latest",
      "cheerio"    : "latest",
    }
  }

  > npm install // installs dependencies locally.

### The Scrapper App

What we want to do:

1. Launch web server.
2. Visit a URL on our server that activates the web scraper.
3. Makes request to website.
4. Captures HTML.
5. Traverses the DOM and extracts information.
6. Convert the extracted info to JSON.
7. Write JSON to file.

_ExpressJS_ is apparently a 'minimalist'web framework for Node.js. Once installed, it needs to be included in your script.

  var express = require('express');
  var app = express();

Then you need to set up _routing_, defining the response to a client request to an endpoint.

  app.method(Path, Handler);

Method - http methods such as GET or POST
Path - path of request (endpoint?)
Handler - callback function that is carried out.

  app.get('/', function(req, res[, next]){
    // do something
  });

The do something will generally use the response object (res), which has a number of methods available. e.g. res.download(), res.end() or res.json().

_Request_ is "designed to be the simplest way possible to make http calls".

    var request = require('request');
    request('http://www.google.com', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(body) // Show the HTML for the Google homepage.
      }
    });

_Cheerio_ is an implementation of 'core' JQuery, designed for the server, so makes it easier to traverse the dom, looking for data we want to scrape.

And finally _fs_ is the file i/o part of Node. We'll be using it to write files on the server.

    fs.writeFile(file, data[, options], callback)

* file String | Integer filename or file descriptor
* data String | Buffer
* options Object | String0
    - encoding String | Null default = 'utf8'
    - mode Number default = 0o666
    - flag String default = 'w'
* callback Function

### Basic Example of Scrapping

Here is a rough & basic example of scrapping, using the IMDB database.

hello_scrapping.js:

    var express = require('express');
    var fs = require('fs');
    var request = require('request');
    var cheerio = require('cheerio');
    var app = express();

    app.get('/scrape', function(req, res){

      // First request url then use the cheerio library on HTML

      //In this example, IMDB is scraped. To get the title, the //<h1 class="header"> seems a good bet to hook the title and //year, and  .star-box-giga-start gets us the rating.

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
        // Now format and save the data.
        fs.writeFile('output.json', JSON.stringify(json, null, 4), function(err){
            console.log('File successfully written!');
        });
        // Send message to browser??
        res.send('Check your console');
      });
    });

Then start up the node server.

    node hello_scraping.js
or
    nodemon hello_scraping.js

Navigate to 

> http://localhost:8081/scrape

### Converting JS Object to XML

I need to build an RSS feed, which is XML based. jstoxml helps here.

https://github.com/davidcalhoun/jstoxml

Install:

  npm install jstoxml

Usage:

  jstoxml.toXML({
    a: '1',
    foo: '',
    b: '2'
  }); // Output: <a>1</a><foo></foo><b>2</b>

## The Feed Me App

Using express-generator to bootstrap the app.

    npm install express-generator -g // install globally
    express feed-me
    cd feed-me
    npm install // installs all basic dependencies
    DEBUG=feed-me: * npm start // starts application

Then I installed all the other dependencies I'm using for the scraper which updated the package.json file. I also amended the "start" command to use nodemon instead of node.

    "scripts": {
        "start": "nodemon ./bin/www"
      }


### FTP

https://www.npmjs.com/package/ftpimp

    npm install ftpimp --save

Then:

    cfg = {
    host: 'ftp.host',
    pass: 'ftp.pass',
    port: 21,
    user: 'ftp.user',
    debug: false};

    var FTP = require('ftpimp');
    var ftp = FTP.create(cfg, false);
    ftp.connect(function () {
        ftp.put([feedPath, config.ftpPath], function (err, filename) {
          if(err) console.log(err)
          else console.log("FTPed");
        });
    });

### App Structure

The web app is browser based. The root "/" page contains a form that allows me to select some basic options for the scraping. Submitting the form calls the "/scrape" code, which:

1. Repeat:
    1. Downloads the HTML for the current page.
    2. Scrapes the necessary data from the page.
    3. Find the 'next' page.
2. Builds JSON object containing the data need to build an RSS feed.
3. Converts JSON to RSS and exports to file.
4. Updates log.
5. (Optional) FTP file to server.

The scrape page redirects back to the root page on completion.

### Scraping Pages

For a basic RSS feed, we need the following elements for the channel. This information is stored in a JS object, then converted to XML (RSS) before being written to file.

A rough outline of rssJson:
  channel version = "2.0"
      title: "Title"
      link: "http://example.com/"
      description: "Description"
      item:[ // array of items scraped from HTML
        {
          title: $('title').text().
          link: url
          description: $(.post-info)
          author: $('.post-author').find('a').text(),
          enclosure: [
            $('#comic').find('img').attr('src'), 
            length, 
            type],
          guid: url,
          pubDate: today.toUTCString()},
        {...etc...}],
      pubDate: today.toUTCString(),
      lastBuildDate: today.toUTCString() //var today = new Date();

### Testing

(Needs more work)

http://thenodeway.io/posts/testing-essentials/
http://mherman.org/blog/2015/09/10/testing-node-js-with-mocha-and-chai/
http://mochajs.org/
https://nodejs.org/api/assert.html
http://sinonjs.org/


'You write tests to inspire confidence that everything is working as expected.' Test clarity should be valued above all else. 
Node values smaller, single purpose tools. So testing uses a collection of smaller tools:

* A testing framework (Mocha, Vows, Intern)
* An assertion library (Chai, Assert)
* Stubs (Sinon)
* Module control (Mockery, Rewire)

Mocha a widely used test framework for node. It follows a setup/teardown pattern.

    describe('yourModuleName', function() {
      before(function(){
        // The before() callback gets run before all tests in the suite. Do one-time setup here.
      });
      beforeEach(function(){
        // The beforeEach() callback gets run before each test in the suite.
      });
      it('does x when y', function(){
        // Now... Test!
      });
      after(function() {
        // after() is run after all your tests have completed. Do teardown here.
      });
    });

Assert type statements make it easier to write tests. The assertion library can help with that.

    assert(object.isValid, 
      'tests that this property is true, and throws an error if /
      it is false');

There are loads of assertion libraries, but node comes with it's own assertion suite.

For more complicated tests, you have to simulate specific conditions. For this you might need to build stubs. Sinon can be used for this.

    var callback = sinon.stub();
    callback.withArgs(42).returns(1);
    callback.withArgs(1).throws("TypeError");
    
    callback();   // No return value, no exception
    callback(42); // Returns 1
    callback(1);  // Throws TypeError

Sinon has tools for create fake timers and 'argument matchers'. Should also look at 'Spies' and 'Mocks' for setting up environments and watching what goes on.

  npm install mocha chai --save-dev

