/*
Flow:
    1. Get the max id from mongo ... new tweets need to be pulled in from here
    2. Pull in new tweets in bulk (catching up)
    3. Establish a feed to twitter and get all new tweets
 */

var Twitter = require('twitter');

var fs = require('fs');

var sendRequest = require('request');

var Promise = require('promise');

var credentials = require('./credentials.js');

var client = new Twitter(credentials.twitter);


var MongoClient = require('mongodb').MongoClient;
//var url = "mongodb://127.0.0.1:27017/crypto-twitter";
var url = credentials.mongo;

function getUserTweetsForAccountHelper(userName, currentData, max_id, endingMax, globalMax, callback) {

    console.log(userName, max_id, endingMax);

    var params = {
        screen_name: userName ,
        count:200
    };

    if(max_id)
        params.max_id = max_id;

    if(endingMax)
        params.since_id = endingMax;

    client.get('statuses/user_timeline', params, function(error, tweets, response) {
        if (!error) {

            var x = 0;
            var lastTwitId;
            var twit;

            for(; x < tweets.length; x++) {
                twit = tweets[x];

                if(twit.id == max_id || twit.id == endingMax)
                    continue;

                currentData.push(twit);
                lastTwitId = twit.id;
                globalMax = globalMax > lastTwitId ? globalMax : lastTwitId;
            }

            if(tweets.length > 1 && lastTwitId != undefined)
                getUserTweetsForAccountHelper(userName, currentData,lastTwitId,endingMax,globalMax, callback);
            else {
                callback(currentData, globalMax);
            }

        } else {
            console.log('ERROR - partial data retrieved - ',error);
            callback(currentData, globalMax);
        }
    });
}


function getUserTweetsForAccount(account, currentResult, endingMax, globalMax) {
    var promise = new Promise(function (resolve, reject) {

        getUserTweetsForAccountHelper(account, currentResult, null,endingMax, globalMax,
            (result, newMaxId) => {
            resolve([result, newMaxId])
        })

    });
    return promise;
}


function getUserTweets (accounts, maxId) {
    var cPromise;

    //chain the promises to get the tweets for each person in sequence
    accounts.forEach(account => {
        if(cPromise) {
            cPromise = cPromise.then(((result) => {
                return getUserTweetsForAccount(account.account, result[0], account.maxId, result[1]);
            }).bind({account:account}))
        } else {
            cPromise = getUserTweetsForAccount(account.account, [], account.maxId, maxId);
        }
    })

    return cPromise;
}


var accounts = [
    "CryptoKirby",
    "cryptousemaki",
    "cryptotatlises",
    "WolfOfPoloniex",
    "CryptoYoda1338",
    "ZeusZissou",
    "uscinvestment",
    "Vickicryptobot",
    "CryptoMast3R",
    "CryptoEye111",
    "TXWestCapital",
    "Crypto_Fugger",
    "Crypto_Analyst",
    "CryptoIndexes",
    "CryptoHustle",
    "FatihSK87",
    "bitcoin_dad",
    "needacoin",
    "anambroid",
    "NicTrades",
    "pterion2910",
    "ThisIsNuse"];



function insertTweets(tweets) {
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        db.collection('tweets').insertMany(tweets,
        function (err, res) {
            if (err) throw err;
            console.log("Number of records inserted: " + res.insertedCount);
            db.close();
        })
    });
}

function getDistinctUserIDs() {

    var promise = new Promise(function (resolve, reject) {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            db.collection('tweets').distinct(
                'userStrId',
                function (err, res) {

                    resolve(res);

                    db.close();
                })
        });
    });

    return promise;

}

/*
getDistinctUserIDs().then(userIdsToWatch => {
    userIdsToWatch.push(1417015712);

    var stream = client.stream('statuses/filter', { follow: userIdsToWatch.join(',')});
    stream.on('data', function(event) {

        insertTweets([tweetTransform(event)]);
    });
    stream.on('error', function(error) {
        console.log(error);
    });
});*/


function getMaxTweetIdsForAccounts() {
    var promise = new Promise(function (resolve, reject) {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            db.collection('tweets').aggregate(
                {$group:{_id:{user:"$userUpper"}, maxId:{$max:"$numId"}, userId:{$max:"$userStrId"}}},
                function (err, res) {
                    var accountMaxMap = [];

                    res.forEach(account => {
                        if(account._id.user) {
                            accountMaxMap[account._id.user] = account.maxId;
                            accountMaxMap[account._id.user] = account.maxId;
                        }
                    })

                    resolve(accountMaxMap);

                    db.close();
                })
        });
    });

    return promise;
}

function tweetTransform(twit) {
    return {
        id: twit.id_str,
    //    numId: twit.id,
    //    user: twit.user.screen_name,
    //    userStrId: twit.user.id_str,
        userUpper: twit.user.screen_name.toUpperCase(),
        date: new Date (twit.created_at),
    //    retweets: twit.retweet_count,
    //    favorites: twit.favorite_count,
        text: twit.text.replace(/(?:\r\n|\r|\n)/g, ' ')
    };
}


/*
getMaxTweetIdsForAccounts().then(accountMaxIDs => {
    var accountsToWatch = [];

    accounts.forEach(account => {
        accountsToWatch.push({
            account: account,
            maxId: accountMaxIDs[account.toUpperCase()]
        })
    });

    console.log(accountsToWatch);

    return getUserTweets(accountsToWatch);
}).then((result) => {

    var tweets = result[0].map(tweetTransform);

    var lastTweetIt = result[1];

    if(tweets.length > 0)
        insertTweets(tweets);

    console.log(tweets.length);
    console.log('ALL DONE');
    console.log(lastTweetIt);
});
*/

var positiveTerms =
    ["bull",
        "positive",
        "bottom",
        "buy",
        "breakout",
        "good",
        "catalyst",
        "high",
        "uptrend",
        "like",
        "support",
        "moon"];

var negativeTerms =
    ["bear",
        "correction",
        "inverted",
        "negative",
        "sell",
        "pullback",
        "bad",
        "volatile",
        "low",
        "down",
        "resistance"];


var bittrex = require('./src/backend/bittrex-feed');

/*
MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    db.collection('tweets').insertMany(tweets,
        function (err, res) {
            if (err) throw err;
            console.log("Number of records inserted: " + res.insertedCount);
            db.close();
        })
});*/


bittrex.allBTCMarketCoins().then(function (allCoins) {

    MongoClient.connect(url, function (err, db) {

        var stream = client.stream('statuses/filter', { track: '$'+allCoins.join(',$')});
        stream.on('data', function(event) {

            var tweet = tweetTransform(event);
            tweet.coins = [];
            tweet.pos = 0;
            tweet.neg = 0;

            allCoins.forEach(function (coin) {
                if(tweet.text.toUpperCase().indexOf('$'+coin) != -1) {
                    tweet.coins.push(coin)
                }
            })

            positiveTerms.forEach(function (term) {
                if(tweet.text.toUpperCase().indexOf(term.toUpperCase()) != -1) {
                    tweet.pos++;
                }
            })

            negativeTerms.forEach(function (term) {
                if(tweet.text.toUpperCase().indexOf(term.toUpperCase()) != -1) {
                    tweet.neg++;
                }
            })

            delete tweet.text;
            delete tweet.userUpper;

            db.collection('tweets').insertMany([tweet],
                function (err, res) {
                    if (err) throw err;
                    console.log("Number of records inserted: " + res.insertedCount);
                  //  db.close();
                });


            console.log(tweet)
        });
        stream.on('error', function(error) {
            console.log(error);
        });
    });
});




var allTweets = [];

function getSearchTweets(max_id_str) {
    console.log(max_id_str)
    client.get('search/tweets', {q: '$MCO', result_type: 'recent', count: '300', max_id: max_id_str}, function(error, tweets, response) {
        var dt;

        var readyTweets = tweets.statuses.map(function (tweet) {
            var tweet = tweetTransform(tweet);

            dt = new Date(tweet.date);
          //  console.log(dt)

            return tweet
        });

        allTweets = allTweets.concat(readyTweets)

        console.log(dt)
        if(dt && dt.getDate() > 22) {
            setTimeout(function () {
                getSearchTweets(tweets.search_metadata.next_results.split('&')[0].split('=')[1])
            }, 500)
            console.log(tweets.search_metadata);
        } else {
            fs.writeFile('data/mco_export.txt', JSON.stringify(allTweets), function (err) {
                if (err) return console.log(err);
                console.log('Hello World > helloworld.txt');
            });
        }
        console.log(error)


    });
}




//getSearchTweets()