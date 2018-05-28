
var Twitter = require('twitter');
var fs = require("fs");

var Promise = require('promise');


var credentials = require('../../credentials.js');

var client = new Twitter(credentials.twitter);


var MongoClient = require('mongodb').MongoClient;
var url = credentials.mongo;

var bittrex = require('./bittrex-feed.js');


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
        " low ",
        " low.",
        "down",
        "resistance"];

/*
MongoClient.connect(url, function (err, db) {


    var today = new Date();
    today.setDate(3);
    today.setHours(1);

    console.log(today)


    db.collection('tweets').find({$and: [{date : {$lt: today}}]}).toArray(function (err,array) {    //{coins: {$in: ['MCO']}}
        console.log(err)
        console.log(array.length)
    })





    //   db.collection('tweets').deleteMany({$and: [{coins: {$in: ['MCO']}},{date : {$lt: today}}]});
});
*/

/*
var fs = require('fs');

fs.readFile('exports/mco_export.txt', 'utf8', function(err, data) {
    if (err) throw err;
    console.log('OK');
  //  console.log(JSON.parse(data))

    var tweets = JSON.parse(data);

    bittrex.allBTCMarketCoins().then(function (allCoins) {

        tweets.map(function (tweet) {
            return enrichTweet(allCoins,tweet)
        })

    //    console.log(tweets);
        MongoClient.connect(url, function (err, db) {
            db.collection('tweets').find({coins: {$in: ['MCO']}}).toArray(function (err,array) {
                array = array.map(function (a) {
                    return a.id;
                })
                console.log(array);

                var uniqueTweets = []
                tweets.forEach(function (tweet) {
                    if(array.indexOf(tweet.id) == -1) {
                     //   console.log(tweet);
                        uniqueTweets.push(tweet)
                    }
                })

                db.collection('tweets').insertMany(uniqueTweets,
                    function (err, res) {
                        if (err) {
                            console.log(err)
                            throw err;
                        }
                        console.log('DONE')

                        db.close();
                        //       console.log("Number of records inserted: " + res.insertedCount);
                        //  db.close();
                    });

            })

        });



    });
});
*/
/*
function tweetTransform(twit) {
    return {
        id: twit.id_str,
        //    numId: twit.id,
        //    user: twit.user.screen_name,
        //    userStrId: twit.user.id_str,
        userUpper: twit.user.screen_name.toUpperCase(),
        date: (new Date (twit.created_at)).getTime(),
        //    retweets: twit.retweet_count,
        //    favorites: twit.favorite_count,
        text: twit.text.replace(/(?:\r\n|\r|\n)/g, ' ')
    };
}

function enrichTweet(allCoins,tweet) {

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
            tweet.pos=1;
        }
    })

    negativeTerms.forEach(function (term) {
        if(tweet.text.toUpperCase().indexOf(term.toUpperCase()) != -1) {
            tweet.neg=1;
        }
    })

   // delete tweet.text;
    //      delete tweet.userUpper;

    tweet.date = new Date(tweet.date);

    return tweet;
}
*/

var timeSets = [
 
    {
        name: 'fiveMin',
        calc: function (time) {
            return (time - time%(5*1000*60));
        },
        cData: []
    },
    {
        name: 'thirtyMin',
        calc: function (time) {
            return (time - time%(30*1000*60));
        },
        cData: []
    },
    {
        name: 'hour',
        calc: function (time) {
            return (time - time%(60*1000*60));
        },
        cData: []
    },
    {
        name: 'day',
        calc: function (time) {
            return (Math.floor(time/1000/60/60/24))*1000*60*60*24;
        },
        cData: []
    }
];



function initiateStreamCollection(allCoins, errorCallback) {

    var stream = client.stream('statuses/filter', {track: '$' + allCoins.join(',$')});
    stream.on('data', function (event) {

        var tweet = event;//tweetTransform(event); //enrichTweet(allCoins, tweetTransform(event));

        var textCoins = [];
        for (var x = 0; x < allCoins.length; x++) {
            var myRe = new RegExp('\\b' + allCoins[x] + '\\b', 'i');
            var reEx = myRe.exec(tweet.text.toUpperCase());

            if (reEx != null)
                textCoins = textCoins.concat(reEx);
        }


        var tweet = {
            time: tweet.timestamp_ms,
            text: tweet.text,
            coin: textCoins,
            retweets: tweet.retweeted_status != null,
            responses: tweet.in_reply_to_status_id != null,
            quotes: tweet.quoted_status != null,
            userId: tweet.user.id_str,
            uniqueUserFollowers: Number(tweet.user.followers_count),
            uniqueUserFriends: Number(tweet.user.friends_count),
            uniqueUserFavorites: Number(tweet.user.favourites_count),
            uniqueUserStatuses: Number(tweet.user.statuses_count),
        };


        if (tweet.coin.length == 1) {
            //only record when 1 coin is mentioned

            for (var x = 0; x < timeSets.length; x++) {

                var timeSet = timeSets[x];

                var timeStamp = timeSet.calc(tweet.time);

                var key = timeStamp + '-' + tweet.coin[0];

                if (timeSets[x].cData[key] != undefined) {

                    timeSet.cData[key].tweets += 1;
                    timeSet.cData[key].retweets += tweet.retweets ? 1 : 0;
                    timeSet.cData[key].responses += tweet.responses ? 1 : 0;
                    timeSet.cData[key].quotes += tweet.quotes ? 1 : 0;

                    if (timeSet.cData[key].userList.indexOf(tweet.userId) == -1) {
                        timeSet.cData[key].userList.push(tweet.userId);

                        timeSet.cData[key].uniqueUsers += 1;
                        timeSet.cData[key].uniqueUserFollowers += tweet.uniqueUserFollowers;
                        timeSet.cData[key].uniqueUserFriends += tweet.uniqueUserFriends;
                        timeSet.cData[key].uniqueUserFavorites += tweet.uniqueUserFavorites;
                        timeSet.cData[key].uniqueUserStatuses += tweet.uniqueUserStatuses;
                    }

                } else {
                    timeSet.cData[key] = {
                        time: timeStamp,
                        coin: tweet.coin[0],
                        tweets: 1,
                        retweets: tweet.retweets ? 1 : 0,
                        responses: tweet.responses ? 1 : 0,
                        quotes: tweet.quotes ? 1 : 0,
                        userList: [tweet.userId],
                        uniqueUsers: 1,
                        uniqueUserFollowers: tweet.uniqueUserFollowers,
                        uniqueUserFriends: tweet.uniqueUserFriends,
                        uniqueUserFavorites: tweet.uniqueUserFavorites,
                        uniqueUserStatuses: tweet.uniqueUserStatuses
                    };


                    //   console.log('-'+timeSet.name,timeSet.cData);
                    var strList = '';

                    for (var item in timeSet.cData) {
                        var itemTime = item.split('-')[0];


                        if (timeStamp != itemTime) {

                            delete timeSet.cData[item].userList;

                            var strData = '';
                            for (var field in timeSet.cData[item]) {
                                if (strData != '') strData += ',';
                                strData += timeSet.cData[item][field];
                            }

                            strList += '\n';
                            strList += strData;

                            delete timeSet.cData[item];
                        }

                    }
                    console.log(strList)
                    fs.appendFile("data/" + timeSet.name + ".txt", strList);

                }

            }

        }


    });
    stream.on('error', function (error) {
        stream.destroy();
        errorCallback(error);
    });

}

const MAX_RETRY = 1000;
var currentRetry = 1;

function initiateStreamCollectionWithRetry(allCoins) {

    initiateStreamCollection(allCoins, function (error) {
        console.log(error)
        console.log(new Date(), 'Retrying ('+currentRetry+') after Error in 10s')
        if(currentRetry < MAX_RETRY)
            setTimeout(function () {
                currentRetry++;
                initiateStreamCollectionWithRetry(allCoins);
            },10000);
        else
            console.log('MAX_RETRY reached')
    })
}

module.exports = {
    startCollection : function (tickFunction, errorFunction) {


        bittrex.allBTCMarketCoins().then(function (allCoins) {

            console.log('start collection for: ', allCoins)

            initiateStreamCollectionWithRetry(allCoins);

        });


    }
};
