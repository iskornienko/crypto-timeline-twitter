
var Promise = require('promise');

var bittrex = require('node.bittrex.api');
bittrex.options({
    'apikey' : 'b855cb15e7f44fe0a579f85ddb5367e5',
    'apisecret' : 'd07800fe63e14e84990c3ceedc4c097d',
});


module.exports = {
    allBTCMarkets: function () {
        var promise = new Promise(function (resolve, reject) {

            bittrex.getmarketsummaries( function( data, err ) {

                var allBTCMarkets = [];

                data.result.forEach(function (cur) {
                    if(cur.MarketName.indexOf('BTC') == 0) {
                        //this is a bitcoin market

                        allBTCMarkets.push(cur);
                    }
                })

                resolve(allBTCMarkets);

            })
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
                console.log(data);

                resolve(data.slice(data.length-hours, data.length));
            });

        });


        return promise;
    }
};