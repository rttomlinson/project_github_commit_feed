"use strict";

const fs = require('fs');
const path = require('path');
const url = require('url');

//Get instance of githubapiwrapper
const GITHUB_API_KEY = require('./config').GITHUB_API_KEY;
let github = require('./githubapiwrapper')(GITHUB_API_KEY);

let app = function () {
    //App instance current commitData
    let _appCommitData = '';
    //Object that will hold functions used by the application
    let api = requestHandler;
    //Allows app to set commitData
    api.setCommitData = function setCommitData(commitData) {
        _appCommitData = commitData;
    };
    
    
    let routes = {};
    
    routes.get = {};
    /*
    {
        'pattern1' { callback: callback,
            params: params
            }
        'pattern2', callback
    }
    */
    routes.post = {};
    
    api.get = function get(path, callback) { //maybe we should save the matched regex somewhere?
        //Pass path and callback to routes property
        // path = /:foo
        // regex(path)
        // req.url = /egle
        //if the path matches a regex expression, we save that regex express.
        // when the server receives a request we check the url against the regex to find a match
        //
        //var path = '/path/:to/something/:else';
    
        var array = [];
        var paramsArray = [];
        var segments = path.split('/');
        console.log("segments is ", segments);
        segments.forEach((segment) => {
          if (segment[0] === ':') {
            array.push('([^\\/]+)');
            paramsArray.push(segment.slice(1));
          } else {
            array.push(segment);
          }
        });
        
        var pattern = array.join('\\/');
        //=> /path/([^\\/]+)/something/([^\\/]+)
        console.log("value of the pattern added to routes", pattern);
        
        
        
        routes.get[pattern] = {};
        routes.get[pattern].callback = callback;
        routes.get[pattern].params = paramsArray;
    }
    
    api.post = function post(path, callback) { //maybe we should save the matched regex somewhere?
        //Pass path and callback to routes property
        // path = /:foo
        // regex(path)
        // req.url = /egle
        //if the path matches a regex expression, we save that regex express.
        // when the server receives a request we check the url against the regex to find a match
        //
        //var path = '/path/:to/something/:else';
    
        let pathPattern = pathSegmenter(path);
        
        let pattern = pathPattern.pathPattern;
        let paramsArray = pathPattern.paramsArray;
        //=> /path/([^\\/]+)/something/([^\\/]+)
        routes.post[pattern] = {};
        routes.post[pattern].callback = callback;
        routes.post[pattern].params = paramsArray;
    };
    
    //The app request handler
    function requestHandler(req, res) {
        //Need to be able to configure the path from the app.js file
        let path = './public/index.html';
        let encoding = 'utf8';
        let method = req.method.toLowerCase();

        //This function allows a error first callback to call resolve/reject of a promise
        function promiseWrap(resolve, reject) {
            return function errorFirstConverter(err, data) {
                if (err){
                    reject(err);
                }
                resolve(data);
            };
        }
        //console.log('req.url:', req.url);
        //Check url path
        if (method == 'post'){
                      //parse the url for the query params
            //parse for the path until the question mark

            let paths = Object.keys(routes.post);
            let found = false;
            let pathsLength = paths.length;
            let index = 0;
            let p = new Promise(function (resolve, reject) {

                while(!found && index < pathsLength) {
                    let regex = new RegExp(paths[index], 'gi');
                    let match = regex.exec(req.url);
                    req.body = {};
                    if (match) { //Add all route params to the req.params object
                        found = true;
                        resolve(index);
                    } else {
                        index++;
                    }
                }
                if (!found) { //No matches, endpoint not found
                    reject(404);
                }
            });
            p.then(function onFulfilled(data) {
                    routes.post[paths[data]].callback(req, res); 
                }, function onReject(err) {
                    res.statusCode = err;
                    res.end("Not found");
            })
            .catch(function errors(err) {
                    console.log(err); //Should just throw the error
            });
        }

        //Parse the query string of the submitted form
        //console.log(req.url);
        let queryParams = url.parse(req.url, true).query;
        //console.log(queryParams);

        //Configuration object for the getCommits function
        let { user, repo } = queryParams;
        if( user && repo ){
          let commitsConfig = {
              'owner': user,
              'repo': repo
          };
            //Now send request to Github API using the getCommits function
            //Should also be wrapped in promise
            github.getCommits(commitsConfig)
            .then(function onFulfilled(data) {
              //console.log('cleaned up data', data);
              //Write to commits.json file
              //Path to commits.json file
              // NOTE: The APPEND functionality is pending - currently overwriting each time we request
              let pathToCommits = './data/commits.json';
              let p = new Promise(function (resolve, reject) {
                  let cb = promiseWrap(resolve, reject);
                  fs.writeFile(pathToCommits, JSON.stringify(data, null, 2), cb);
              });
              p.then(function onFulfilled() {
                  console.log("Data appended successfully to commits.json");
              }, function onRejection(err) {
                  console.error('An error occured:', err);
              })
              .catch(function onError(err){
                  console.error("Error occurred while writing to commits.json", err);
              });
            
            
            });
        }
        // else{
        // }
        //console.log(user, repo);

        //Read index.html file of public directory
        let p = new Promise(function (resolve, reject) {
            let cb = promiseWrap(resolve, reject);
            fs.readFile(path, {"encoding": encoding}, cb);
        });
        p.then(function onFulfilled(data) {
            //Replace placeholder with the commitData returned from the server
            data = data.replace(/{{ commitFeed }}/, _appCommitData);

            res.end(data);
        })
        .catch(function onError(err) {
            res.end(err);
        });
    }
    return api;

};



module.exports = app;





function pathSegmenter(path) {
    let array = [];
    let paramsArray = [];
    let segments = path.split('/');
    segments.forEach((segment) => {
      if (segment[0] === ':') {
        array.push('([^\\/]+)');
        paramsArray.push(segment.slice(1));
      } else {
        array.push(segment);
      }
    });
    
    return { 'pathPattern': array.join('/'), 'params': paramsArray };
}
