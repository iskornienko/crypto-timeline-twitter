# Tweet volume visualizer for cryptocurrency

*Research/prototype code ... pardon the mess.*

### Motivation
There seems to be a correlation between twitter sentiment about a given crypto coin and the price of that coin. Shilling makes the value of this correlation questionable, but I feel it's still worth while to experiment with the data and see what may emerge.

### Current State
Interesting algorithmic trading patterns emerged from this exercise. While looking broadly at all tweets proved useless due to shilling, focusing on specific traders and making instant trades based on positive or negative sentiment does seem promising. More research is necessary.  

![Crypto Timeline Screenshot](https://github.com/iskornienko/crypto-timeline-twitter/blob/master/sample-image.png?raw=true)

### Overview
* Mongo is used for data storage
* Bittrex API is used to retrieve the crypto currency to watch
* Twitter API is used to retrieve tweets 
* Rename credentials.example.js to credentials.js
  * Update credentials.js with your twitter, mongo, and bittrex credentials

### Setup
`npm install`

To run data collector:

`node ./tweet-sync.js`

To run web app:

`npm run dev` & open browser to: http://localhost:3000/
