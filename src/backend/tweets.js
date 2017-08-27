
var Promise = require('promise');

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://cryptoUser:crypt0c000l@ds159493.mlab.com:59493/crypto_tweets";

module.exports = {
    coinTweetCounts: function () {
        var promise = new Promise(function (resolve, reject) {

            MongoClient.connect(url, function (err, db) {

                db.collection('tweets').aggregate([
                    {$unwind : "$coins" },
                    {$group: {
                        _id : "$coins",
                        "count": { "$sum": 1 },
                        users: { $addToSet: "$userUpper" }
                    }}]
                ).toArray(function(err, results){

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
    hoursForCoin : function (coin) {
        var promise = new Promise(function (resolve, reject) {

            MongoClient.connect(url, function (err, db) {

                db.collection('tweets').aggregate([
                    {$match: {"coins": {$in : [coin]}}},
                    {$group: {
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
                    }}]
                ).toArray(function(err, results){
                    console.log(results)
                    console.log(err)
                    resolve(results); // output all records
                    db.close();
                });

            });
        });

        return promise;
    },
    tweetsForHour: function (time, coin) {

        time = Number(time);

        var promise = new Promise(function (resolve, reject) {
            MongoClient.connect(url, function (err, db) {

                var dtS = new Date(time);
                dtS.setHours(dtS.getHours());
                dtS.setMinutes(0);

                var dtE = new Date(time);
                dtE.setHours(dtE.getHours() + 1);
                dtE.setMinutes(0);

                db.collection('tweets').find(
                    {
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
                    }
                ).toArray(function (err, results) {

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