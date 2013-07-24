#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var util = require('util');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var buildfn = function(url, checksfile) {
    var handleResponse = function(result, response) {
        if (!result){
            console.log("No response from %s. Exiting.", url);
        } else {
            var msg = '(none)';
            if(response) {
              msg = util.format(response.message);
            }

            if (result instanceof Error) {
              console.error('Error: ' + msg);
              console.log("Error retreiving %s. Exiting.", url);
            } else {
              console.log('received non-error response from %s', url);
              //console.log(result);
              var $htmlFile = cheerio.load(result);
              doChecks($htmlFile, checksfile);
	    }
       }
    };
    return handleResponse;
};

var doChecks = function(cheeriohtmlfile, checksfile) {
      var checkJson = checkHtmlFile(cheeriohtmlfile, checksfile);
      var outJson = JSON.stringify(checkJson, null, 4);
      console.log(outJson);
}

var checkHtmlFile = function(cheeriohtmlfile, checksfile) {
//    $ = cheerioHtmlFile(htmlfile);
    $ = cheeriohtmlfile;
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-u, --url  <html_url>', 'URL to index.html')
        .option('-f, --file <html_file>', 'Path to index.html', HTMLFILE_DEFAULT)
        .parse(process.argv);

    if(program.url)
    {
      console.log('url = %s', program.url);
      var checkHTMLFromURL = buildfn(program.url, program.checks) 
      rest.get(program.url).on('complete', checkHTMLFromURL);
    } else {
      console.log('no url provided, using file %s ', program.file);
      var htmlFile = clone(assertFileExists)(program.file);
      var $htmlFile = cheerioHtmlFile(htmlFile);
      doChecks($htmlFile, program.checks);
    }

} else {
    exports.checkHtmlFile = checkHtmlFile;
}
