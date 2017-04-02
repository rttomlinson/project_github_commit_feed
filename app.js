"use strict";


let http = require('http');
const path = require("path");

//Make app instance
let app = require('./expressish')();
//Load commits.json data
let commits = require('./data/commits.json');
//Turn commits JSON to string and make it pretty
let prettyCommits = JSON.stringify(commits, null, 2);
app.setCommitData(prettyCommits);



app.get('/', function(req, res) {
    res.end("Root directory called");
});




//Set port
let port = process.env.PORT || 3000;


//Create new server
let server = http.createServer(app);


//Start listening on server
server.listen(port);


