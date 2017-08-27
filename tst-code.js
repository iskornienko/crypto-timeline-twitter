
var gdaxFeed = require('./src/backend/gdax-feed.js').feed();


gdaxFeed.subscribe('123','gdax','BTC-USD',60, newData => {
    console.log('tick for ',new Date(newData[newData.length-1][0]*1000));
})