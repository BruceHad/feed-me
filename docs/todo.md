- [x]Check the 'guid'.
- [x]Separate 'config'.
- [x]Read logfile to get next run.
- [x]Error handling in node.
- [x]Add tests.
- [ ]Refactor
- [ ]Update the interface, make it possible to use from the webpage.
    - [ ]Learn a bit of express or use Vue.js
- [ ]Auto FTP to server.
- [ ]Put online so that it can be run from the browser.
- [ ]Cache the scrapped feed (json?)
- [ ]Deliver pages automatically.
- 

Bugs (?):

- [ ] config.tally isn't resetting between refreshes

app/
    output/
    config.js
    feed_scraping.js
        addDays(d,days)
        getNext(html)
        fs.readFile(logFile)
        app.get('/')
        app.get('/scrape')
            getHTML() -> (loop) scrapePage() -> (finished) buildRSS()
                scrapePage(html, url)
                    // scrapes html and builds json 'item'
                buildRSS(items) -> updateLog()
                                -> ftpFile()
                    //creates 'RSS' object
                    // add each scraped 'item' to rss
                    // convert rss to proper rss (using jstoxml) 
                    // writes to file.
                    updateLog()
                    ftpFile(path)
                        // transfers file to server
docs/
test/
