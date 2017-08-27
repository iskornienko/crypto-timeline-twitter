
var sendRequest = require('request');
var Promise = require('promise');


const Gdax = require('gdax');
const publicClient = new Gdax.PublicClient();

function getGDAXData(product, startDate, endDate, granularity) {


    var promise = new Promise(function (resolve, reject) {


        var url = 'https://api.gdax.com/products/'+product+'/candles?start='+startDate.toISOString()+'&end='+endDate.toISOString()+'&granularity='+granularity;

        console.log('CALLING', url);

        sendRequest({
            url: url,
            qs : {
            //    start: dS,
            //    end: dE,
            //    granularity: granularity
            },
            headers: {
                'User-Agent': 'request',
                'Cache-Control': 'no-cache'
            }
        }, function (error, requestResponse, body) {

            if (!error && requestResponse.statusCode == 200) {

           //     console.log(body)

                resolve(JSON.parse(body));
            } else {
                console.log('ERROR',body);
            }
        });
    });

    return promise;
}


module.exports = {
    feed : function () {

        var connections = [];
        setInterval(function () {
            connections.forEach(connection => {

                var date = new Date();

                if(connection.lastTick+connection.granularity+60
                    < date.getTime()/1000 && !connection.processing) {

                    connection.processing = true;

                    var startDate = new Date();
                    var endDate = new Date();
                    endDate.setSeconds(endDate.getSeconds()-10);
                    startDate.setSeconds(startDate.getSeconds()-connection.granularity*3);

                    console.log(connection.product, startDate, endDate, connection.granularity);
                    getGDAXData(connection.product, startDate, endDate, connection.granularity).then((function (data) {

                        data.sort(function (a,b) {
                            return a[0]- b[0];
                        });

                        var newTicks = [];
                        data.forEach(tick => {
                            if(tick[0] > connection.lastTick) {
                                newTicks.push(tick);
                                connection.lastTick = tick[0];
                            }
                        });

                        connection.newDataCallBack(newTicks)

                        connection.processing = false;

                    }).bind({connection:connection}))

                }

                
            });
        },1000)

        return {
            subscribe: function (id, market, product, granularity, newDataCallBack) {

                var startDate = new Date();
                var endDate = new Date();
                endDate.setSeconds(endDate.getSeconds()-10);
                startDate.setSeconds(startDate.getSeconds()-granularity*300);

                getGDAXData(product, startDate, endDate, granularity).then(function (data) {

                    data.sort(function (a,b) {
                        return a[0]- b[0];
                    })

                    newDataCallBack(data);

                    connections.push({
                        id:id,
                        market:market,
                        product:product,
                        granularity:granularity,
                        newDataCallBack:newDataCallBack,
                        lastTick: data[data.length-1][0]
                    })

                })



            },
            unsubscribe: function (id) {
                for(var x = 0; x < connections.length; x++) {
                    if(connections[x].id == id) {
                        connections.splice(x,1);
                        break;
                    }
                }
            }
        }
    }
}
