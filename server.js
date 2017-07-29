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