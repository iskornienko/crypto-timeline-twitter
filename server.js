
var fs = require("fs");

//host web server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var port = 3001;

//call other web endpoints
var sendRequest = require('request');

//keep client and server in sync
var io = require('socket.io')(server);

//for hosting content without webpack
app.use(express.static('dist'));

//Example: Allow cross origin connections
app.options("*",function(req,res,next){
    res.header("Access-Control-Allow-Origin", req.get("Origin")||"*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.status(200).end();
});



app.get('/api/candles/:product', (request, response) => {


    var url = 'https://api.gdax.com/products/'+request.params.product+'/candles?start=2017-07-15&end=2017-07-30&granularity=3000';


    sendRequest({
        url: url,
        headers: {
            'User-Agent': 'request'
        }
    }, function (error, requestResponse, body) {
        if (!error && requestResponse.statusCode == 200) {

         //   resolve(body);
            response.send(body);
        } else {
        //    reject();
        }
    })







    /*

    fs = require('fs')
    fs.readFile('data/BTC-USD.txt', 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        response.send(data);
    });
    */
});



app.get('/api/products/:market', (request, response) => {

    sendRequest({
        url: 'https://api.gdax.com/products',
        headers: {

            //Example: Setting request headers
            'User-Agent': 'request',
            //'Authorization' : 'Basic ' + new Buffer(BPM_USER + ':' + BPM_PASS).toString('base64')
        }
    }, function (error, requestResponse, body) {
        if (!error && requestResponse.statusCode == 200) {

            response.send(body);
        } else {
            console.log(body);
        }
    })

    console.log(request.params.market);
});



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

/*
            if(Math.random() < 0.333) {
                grouped[key].positiveTweets.push(a);
            } else if(Math.random() < 0.666) {
                grouped[key].negativeTweets.push(a);
            } else {
                grouped[key].neutralTweets.push(a);
            }*/


        });

        var gResult = [];
        for(var group in grouped) {
            gResult.push(grouped[group])
        }

        response.send(gResult);

    });
});










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

    socket.on('disconnect', function() {
        var i = allClients.indexOf(socket);
        allClients.splice(i, 1);
    });
});

server.listen(port);