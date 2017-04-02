"use strict";


let http = require('http');
const path = require("path");

//Make app instance
let app = require('./expressish')();




app.get('/', function(req, res) {
    res.end("Root directory called");
});


app.post('/github/webhooks', function(req, res) {
    var _headers = {
                "Content-Type": "text/html",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE"
                };
    res.writeHead(200, _headers);
    //res.end("Hello webhooks")
    console.log("Hello webhooks");

    // Initialize a string to concat
    // the data
    var body = '';

    // Every time a data event is fired
    // we concat the next chunk of data
    // to the string
    req.on('data', (data) => {
      body += data;
    });

    // When the end event is fired
    // we know we have all the data
    // and can send back a response
    req.on('end', () => {
      console.log(body);
      res.end(body);
    });
});





//Set port
let port = process.env.PORT || 3000;


//Create new server
let server = http.createServer(app);


//Start listening on server
server.listen(port);


