
var fs = require("fs");

//host web server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var port = 3000;

//call other web endpoints
var sendRequest = require('request');

//keep client and server in sync
var io = require('socket.io')(server);

var gdaxFeed = require('./src/backend/gdax-feed.js').feed();

//for hosting content without webpack
app.use(express.static('dist'));

//Example: Allow cross origin connections
app.options("*",function(req,res,next){
    res.header("Access-Control-Allow-Origin", req.get("Origin")||"*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.status(200).end();
});

var bittrex = require('./src/backend/bittrex-feed')
var tweets = require('./src/backend/tweets')


app.get('/api/candles/:product', (request, response) => {
    bittrex.getCandles(request.params.product).then(function (data) {
        response.send(data);
    })
});



app.get('/api/markets/:market', (request, response) => {

    bittrex.allBTCMarkets().then(function (data) {
        tweets.coinTweetCounts().then(function (tweetCounts) {
            for(var x = 0 ; x < data.length; x++) {
                data[x].tweets = 0;
                data[x].users = 0;
                for(var y = 0; y < tweetCounts.length; y++) {

                    if(data[x].MarketName.replace('BTC-','') == tweetCounts[y]._id) {
                        data[x].tweets = tweetCounts[y].count;
                        data[x].users = tweetCounts[y].users;
                        break;
                    }
                }
            }
            response.send(data);
        })
    })
});

app.get('/api/tweets/:coin', (request, response) => {


    tweets.hoursForCoin(request.params.coin).then(function (data) {

        response.send(data.map(function (tick) {

            var date = new Date(tick.sampleDate);
        //    date.setFullYear(tick._id.year);
        //    date.setMonth(tick._id.month-1);
       //     date.setDate(tick._id.day);
        //    date.setHours(tick._id.hour-5);
            date.setMinutes(0);
            date.setSeconds(0);
            date.setMilliseconds(0);

            tick.date = date.getTime();

            return tick;
        }));

    })



});
app.get('/api/tweets/:hour/:coin', (request, response) => {

    console.log(request.params)

    tweets.tweetsForHour(request.params.hour, request.params.coin).then(
        function (data) {
            response.send(data);
        }
    )



});


/*
app.get('/api/tweets', (request, response) => {
    fs = require('fs')
    fs.readFile('data/tweets3.txt', 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }

        var filter = request.param('filter').split(',');
        var accounts = request.param('accounts').split(',');

        var data = JSON.parse(data);

        var subset = data;//data.slice(0,200);

        var grouped = [];
        subset.forEach(function (a) {

            var match = false;
            for(var x =0; x < filter.length; x++) {
                if(a.text.indexOf(filter[x]) != -1 && accounts.indexOf(a.user) != -1)
                    match = true;
            }

            if(!match)
                return;


            var dt = new Date(a.date);
            var key = dt.getFullYear()+'-'+dt.getMonth()+'-'+dt.getDate()+'-'+dt.getHours();

            if(!grouped[key]) {

                var date = new Date();
                date.setFullYear(dt.getFullYear());
                date.setMonth(dt.getMonth());
                date.setDate(dt.getDate());
                date.setHours(dt.getHours());
                date.setMinutes(0);
                date.setSeconds(0);
                date.setMilliseconds(0);

                grouped[key] = {
                    date: date.getTime(),
                    tweets: []
                }
            }
            grouped[key].tweets.push(a);

        });

        var gResult = [];
        for(var group in grouped) {
            gResult.push(grouped[group])
        }

        response.send(gResult);

    });
});



*/






app.get('/api/sample-get', (request, response) => {

    //Example: Setting response headers
    response.header('Content-Type', 'application/json');
    response.header('Access-Control-Allow-Credentials', true);

    sendRequest({
        url: 'https://api.ipify.org?format=json',
        headers: {

            //Example: Setting request headers
            //'User-Agent': 'request',
            //'Authorization' : 'Basic ' + new Buffer(BPM_USER + ':' + BPM_PASS).toString('base64')
        }
    }, function (error, requestResponse, body) {
        if (!error && requestResponse.statusCode == 200) {

            response.send(body);
        }
    })
});

//track all the connected clients
var allClients = [];
var currentSyncFieldValue;

io.on('connection', function(socket) {
    allClients.push(socket);

    //if value is set, send to client
    if(currentSyncFieldValue!= null)
        socket.emit('get-field-update',currentSyncFieldValue);

    //listen for changes from client
    socket.on('push-field-update', function (data) {
        currentSyncFieldValue = data;

        allClients.forEach(function (destinationSocket) {
            //updates all other clients with the new value
            if(socket != destinationSocket) {
                destinationSocket.emit('get-field-update',currentSyncFieldValue);
            }
        })
    })


    socket.on('subscribe-to-feed', function (data) {
        var sample = {
            market : '',
            product : '',
            granularity : '',
        }

        gdaxFeed.subscribe('123','gdax','BTC-USD',60, newData => {
            socket.emit('feed-update',newData);
        })
    })


    socket.on('disconnect', function() {
        var i = allClients.indexOf(socket);
        allClients.splice(i, 1);
        gdaxFeed.unsubscribe('123');
    });
});

server.listen(port);