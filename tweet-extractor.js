var csv = require("fast-csv");
var fs = require("fs");

var Twitter = require('twitter');

var sendRequest = require('request');

var Promise = require('promise');

var client = new Twitter({
    consumer_key: 'lX037W1t236Ds3dOnEQ2xqgZu',
    consumer_secret: 'DNyhobKXlfgXdN55YnXrymwkJf1fiwG5c6gakES2BbeuzScZcN',
    access_token_key: '1417015712-24OCSJkV3wqo3gsBIWmT8YR0rGoJ2A45osCrU2e',
    access_token_secret: 'ghob0vrcCKkA3iPs4Sw6n8NmV0Y6eZk5UY0FcuNizOjoJ'
});


var lastMaxId=0;

function getUserTweets(userName, max_id, currentData, arrayItem, callback) {

    var params = {
        screen_name: Array.isArray(userName) ? userName[arrayItem] : userName  ,
        count:200
    };

    console.log('GET',params.screen_name, max_id)

    if(max_id)
        params.max_id = max_id;
    lastMaxId = max_id;

    client.get('statuses/user_timeline', params, function(error, tweets, response) {
        if (!error) {

            var x = 0;
            var lastTwitId;
            var twit;

            console.log(tweets.length)

            for(; x < tweets.length; x++) {
                twit = tweets[x];

                currentData.push({
                    id: twit.id_str,
                    numId: twit.id,
                    user: twit.user.screen_name,
                    date: (new Date (twit.created_at)).getTime(),
                    retweets: twit.retweet_count,
                    favorites: twit.favorite_count,
                    text: twit.text.replace(/(?:\r\n|\r|\n)/g, ' ')});
                lastTwitId = twit.id;
            }

            if(tweets.length > 1 && lastTwitId != undefined)
                getUserTweets(userName, lastTwitId, currentData,arrayItem, callback);
            else if (Array.isArray(userName) && userName.length > arrayItem) {
                getUserTweets(userName, null, currentData, arrayItem+1, callback)
            }
            else {
                callback(currentData);
            }

        }
        console.log(error);
    });
}

function getGDAXData(product ,months, granularity) {


    var end = (new Date()).toISOString();

    var url = 'https://api.gdax.com/products/'+product+'/candles?start='+months+'&end='+end+'&granularity='+granularity;

    console.log(url)

    var promise = new Promise(function (resolve, reject) {

        sendRequest({
            url: url,
            headers: {
                'User-Agent': 'request'
            }
        }, function (error, requestResponse, body) {
            if (!error && requestResponse.statusCode == 200) {

                resolve(body);
            } else {
                reject();
            }
        })

    });

    return promise;
}



var traders = [
    "cryptousemaki",
    "cryptotatlises",
    "WolfOfPoloniex",
    "CryptoYoda1338",
    "ZeusZissou",
    "CryptoMast3R",
    "CryptoEye111",
    "TXWestCapital",
    "Fatih87SK",
    "vincentbriatore",
    "NicTrades",
    "pterion2910"];

//exportUserTweetsToCSV(["NicTrades"]);


getUserTweets(traders, null, [], 0, function (data) {
    fs.writeFile("data/tweets3.txt", JSON.stringify(data), function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
});


/*
getGDAXData('BTC-USD' ,'2017-07-15', (60*50)).then(function (result) {
    fs.writeFile("data/BTC-USD.txt", result, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
});

    */