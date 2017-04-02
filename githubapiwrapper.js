"use strict";

let Github = require('github');


function Session(apiKey) {
    //Create new instance of Github
    let github = new Github();
    
    //Authenticate the github instance. Need to wrap in Promise
    github.authenticate({
        type:"token",
        token: apiKey
    });
    
    
    function dataScrubber(data) {
        let scrubbedData = data.map(function (element) {
            let scrub = {};
            scrub.sha = element.sha;
            scrub.url = element.url;
            scrub.author = element.author;
            scrub.commitMessage = element.commit.message;
            return scrub;           
        });
        return scrubbedData;
    }
    
    
    let session = {};
    
    //Make property for commitsData
    //Get rid of this line session.commitsData = '';
    
    
    //Needs to be moved to the githubwrapper.js module
    session.getCommits = function(commitsConfig) {
        return new Promise(function (resolve, reject) {
            let pro = github.repos.getCommits(commitsConfig);
            pro.then(function onFulfilled(data) {
                console.log("Fulfilled Called!");
                let scrubbedData = dataScrubber(data.data);
                //console.log(scrubbedData);
                resolve(scrubbedData);
            //this.commitsData = scrubbedData;
            
            //console.log(data);
            }, function onRejected(err) {
                reject(err);
            })
            .catch(function onError(err) {
                console.log("Something really bad happened.");
                console.log(err);
                //console.log(err);
            }); 
        });
    };
    return session;
}


module.exports = Session;