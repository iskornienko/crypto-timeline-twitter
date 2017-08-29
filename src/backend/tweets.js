
var Promise = require('promise');

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://cryptoUser:crypt0c000l@ds159493.mlab.com:59493/crypto_tweets";

module.exports = {
    coinTweetCounts: function (singleMentionsOnly, tweetFilter) {
        var promise = new Promise(function (resolve, reject) {

            MongoClient.connect(url, function (err, db) {

                var config = [];

                if(singleMentionsOnly) {
                    config.push({$match : {$and : [{ 'coins' : {$size: 1} }]} });
                }


                if(tweetFilter && tweetFilter != 'undefined' && tweetFilter != '') {

                    if(config.length !=0) {
                        config[0].$match.$and.push({
                            $text: {
                                $search: tweetFilter,
                                $caseSensitive: false
                            }
                        } );
                    } else {
                        config.push({$match : {$and : [{$text: {
                            $search: tweetFilter,
                            $caseSensitive: false
                        }}]} });

                    }
                }

                config.push({$unwind : "$coins" });
                config.push({$group: {
                    _id : "$coins",
                    "count": { "$sum": 1 },
                    users: { $addToSet: "$userUpper" }
                }})

                db.collection('tweets').aggregate(config).toArray(function(err, results){
                    console.log(err)

                    results.forEach(function (c) {
                        c.users = c.users.length;
                    })
                    resolve(results); // output all records
                    db.close();
                });

            });
        });

        return promise;

    },
    hoursForCoin : function (coin, singleMentionsOnly, tweetFilter) {
        var promise = new Promise(function (resolve, reject) {

            MongoClient.connect(url, function (err, db) {

                var config = [];

                var filter = {
                    $match: {
                        $and:[{"coins": {$in : [coin]}}]
                    }
                };

                if(singleMentionsOnly) {
                    filter.$match.$and.push({'coins' : {$size: 1} });
                }

                if(tweetFilter && tweetFilter != 'undefined' && tweetFilter != '') {
                    filter.$match.$and.push({
                            $text: {
                                $search: tweetFilter,
                                $caseSensitive: false
                            }
                    } );
                }

                config.push(filter)

                config.push({$group: {
                    _id : {
                        year: {$year: "$date"},
                        month: {$month: "$date"},
                        day: {$dayOfMonth: "$date"},
                        hour: {$hour: "$date"},
                    },
                    "sampleDate" : {"$first" : '$date'},
                    "count": { "$sum": 1 },
                    "neg": { "$sum": '$neg' },
                    "pos": { "$sum": '$pos' }
                }})


                db.collection('tweets').aggregate(config)
                    .toArray(function(err, results){
               //     console.log(results)
                    console.log(err)
                    resolve(results); // output all records
                    db.close();
                });

            });
        });

        return promise;
    },
    tweetsForHour: function (time, coin, singleMentionsOnly, tweetFilter) {

        time = Number(time);

        var promise = new Promise(function (resolve, reject) {
            MongoClient.connect(url, function (err, db) {

                var dtS = new Date(time);
                dtS.setHours(dtS.getHours());
                dtS.setMinutes(0);

                var dtE = new Date(time);
                dtE.setHours(dtE.getHours() + 1);
                dtE.setMinutes(0);

                var config = {
                    $and: [
                        {
                            date: {
                                $gte: dtS,
                                $lt: dtE
                            }
                        },
                        {
                            coins: {$in: [coin]}
                        }
                    ]
                };

                if(singleMentionsOnly) {
                    config.$and.push({ 'coins' : {$size: 1} });
                }

                if(tweetFilter && tweetFilter != 'undefined' && tweetFilter != '') {
                    config.$and.push({
                        $text: {
                            $search: tweetFilter,
                            $caseSensitive: false
                        }
                    } );
                }

                db.collection('tweets').find(config)
                    .toArray(function (err, results) {

                    var data = {
                        positive: [],
                        negative: [],
                        neutral: []
                    }

                    results.forEach(function (tweet) {
                        if (tweet.pos != 0) {
                            data.positive.push(tweet.id)
                        }
                        if (tweet.neg != 0) {
                            data.negative.push(tweet.id)

                        }
                        if (tweet.pos == 0 && tweet.neg == 0) {
                            data.neutral.push(tweet.id)
                        }
                    })

                    resolve(data);

                    db.close();
                });

            });
        });

        return promise;
    }
};