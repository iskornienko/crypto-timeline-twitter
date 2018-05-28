
var twitter = require('./src/backend/twitter');


var lastUpdate;
var hadError = false;

twitter.startCollection(function (count, lastTweet) {
    console.log(count, lastTweet);
    lastUpdate = {count: count, lastTweet: lastTweet};
    allClients.forEach(function (destinationSocket) {

        destinationSocket.emit('twitter-update',lastUpdate);
    })
}, function () {
    hadError = true;

    allClients.forEach(function (destinationSocket) {

        destinationSocket.emit('twitter-error',{});
    })
});
