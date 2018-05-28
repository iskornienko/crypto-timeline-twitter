

var credentials = require('../../credentials.js');

var Promise = require('promise');

var bittrex = require('node.bittrex.api');
bittrex.options(credentials.bittrex);


var lastMarketDataDate;
var lastMarketData;

module.exports = {
    allBTCMarkets: function () {
        console.log('LAST');
        var promise = new Promise(function (resolve, reject) {

            console.log('LAST', (new Date()).getTime());


       /*     if(lastMarketDataDate && ((new Date()).getTime() - lastMarketDataDate.getTime() < 1000*30)) {


                console.log('LAST', (new Date()).getTime(), lastMarketDataDate.getTime(), (new Date()).getTime() - lastMarketDataDate.getTime());

                resolve(allBTCMarkets);
            } else { */
                bittrex.getmarketsummaries( function( data, err ) {

                    var allBTCMarkets = [];

                    data.result.forEach(function (cur) {
                        if(cur.MarketName.indexOf('BTC') == 0) {
                            //this is a bitcoin market

                            allBTCMarkets.push(cur);
                        }
                    })

              //      lastMarketDataDate = new Date();
                //    lastMarketData = allBTCMarkets;

                    resolve(allBTCMarkets);

                })

      //      }

        })

        return promise;
    },
    allBTCMarketCoins: function () {
        var promise = new Promise(function (resolve, reject) {

            bittrex.getmarketsummaries( function( data, err ) {

                var allBTCMarkets = [];

                data.result.forEach(function (cur) {
                    if(cur.MarketName.indexOf('BTC') == 0) {
                        //this is a bitcoin market

                        allBTCMarkets.push(cur.MarketName.split('-')[1]);
                    }
                })

                resolve(allBTCMarkets);

            })
        })

        return promise;
    },
    getCandles: function (product) {

        var promise = new Promise(function (resolve, reject) {


            bittrex.getcandles({
                marketName: product,
                tickInterval: 'thirtyMin'
            }, function( data, err ) {

                var data = data.result.map(function (tick) {
                    return [(new Date(tick.T)).getTime()/1000, tick.L, tick.H, tick.O, tick.C, tick.V];
                })

                var hours  = 24*2*5;
            //  console.log(data);

                resolve(data.slice(data.length-hours, data.length));
            });

        });


        return promise;
    }
};