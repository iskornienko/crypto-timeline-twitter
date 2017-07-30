import "./style.less";

import d3Timeline from '../../d3-views/timeline.js';

let directive = angular.module('twitter-timeline',[])
    .directive('twitterTimeline',[
        function () {
            return {
                restrict:"AEC",
                replace:true,
                scope:{
                    
                },
                template:require('./template.html'),
                controller: [
                    '$scope', '$http', '$element',
                    function ($scope, $http, $element) {

                        $scope.traders = ["cryptousemaki",
                            "cryptotatlises",
                            "WolfOfPoloniex",
                            "CryptoYoda1338",
                            "ZeusZissou",
                            "CryptoMast3R",
                            "CryptoEye111",
                            "TXWestCapital",
                            "Fatih87SK",
                            "vincentbriatore",
                            "NicTrades",
                            "pterion2910"];

                        var positiveTerms =
                            ["bull",
                                "positive",
                                "bottom",
                                "buy",
                                "breakout",
                                "good",
                                "high",
                                "uptrend",
                                "like",
                                "support"];

                        var negativeTerms =
                            ["bear",
                                "correction",
                                "inverted",
                                "negative",
                                "sell",
                                "pullback",
                                "bad",
                                "volatile",
                                "low",
                                "down",
                                "resistance"];

                        $scope.config = {
                            exchange : 'gdax',
                            product : 'BTC-USD',
                            accounts : $scope.traders,
                            positiveTerms : positiveTerms.join(','),
                            negativeTerms : negativeTerms.join(',')
                        }

                        $scope.$watch('config.product', function () {
                            var mapCurrency = [
                                {value: 'BTC',      map: 'BTC'},
                                {value: 'Bitcoin',  map: 'BTC'},
                                {value: 'LTC',      map: 'LTC'},
                                {value: 'Litecoin', map: 'LTC'},
                                {value: 'ETH',      map: 'ETH'},
                                {value: 'Ethereum', map: 'ETH'},
                                {value: 'XRP',      map: 'XRP'},
                                {value: 'Ripple',   map: 'XRP'},
                                {value: 'SC',       map: 'SC'},
                                {value: 'Siacoin',  map: 'SC'},
                                {value: 'Stratis',  map: 'STRAT'},
                                {value: 'STRAT',    map: 'STRAT'},
                                {value: 'ARDR',     map: 'ARDR'},
                                {value: 'Ardor',    map: 'ARDR'},
                                {value: 'NXT',      map: 'NXT'},
                                {value: 'ARDR',      map: 'ARDR'},
                                {value: 'OMNI',      map: 'OMNI'},
                                {value: 'BELA',      map: 'BELA'},
                                {value: 'STEEM',      map: 'STEEM'},
                                {value: 'VTC',      map: 'VTC'},
                                {value: 'VIA',      map: 'VIA'}
                            ];

                            if($scope.config.product == 'BTC-USD') {
                                $scope.config.filter =  'BTC,Bitcoin'

                            } else if($scope.config.product == 'ETH-USD') {
                                $scope.config.filter =  'ETH,Ethereum'
                            } else if($scope.config.product == 'LTC-USD') {
                                $scope.config.filter =  'LTC,Litecoin'

                            }

                                })


                        $scope.$watch('config.exchange', function () {
                            $http({
                                method:'GET',
                                url:'/api/products/'+$scope.config.exchange
                            }).then(function (response) {
                                console.log(response)

                                $scope.productOptions = response.data;
                            })
                        })

                        function doesContainArrayElements(text, array) {
                            var contains = false;

                            for(var x = 0; x < array.length; x++) {
                                if(text.indexOf(array[x]) != -1)
                                    contains = true;
                            }

                            return contains;
                        }


                        function drawChart () {

                            $element.find('svg').text('');


                            for(var x = 0; x < $scope.tweetData.length; x++) {
                                $scope.tweetData[x].positiveTweets = [];
                                $scope.tweetData[x].negativeTweets =  [];
                                $scope.tweetData[x].neutralTweets = [];

                                for(var y = 0; y < $scope.tweetData[x].tweets.length; y++) {

                                    var isPositive = doesContainArrayElements($scope.tweetData[x].tweets[y].text, $scope.config.positiveTerms.split(','));
                                    var isNegative = doesContainArrayElements($scope.tweetData[x].tweets[y].text, $scope.config.negativeTerms.split(','));

                                    if(isNegative) {
                                        $scope.tweetData[x].negativeTweets.push($scope.tweetData[x].tweets[y])
                                    } else if (isPositive) {
                                        $scope.tweetData[x].positiveTweets.push($scope.tweetData[x].tweets[y])
                                    } else {
                                        $scope.tweetData[x].neutralTweets.push($scope.tweetData[x].tweets[y])
                                    }

                                }

                            }
                            
                            
                            d3Timeline.drawTimeline($scope.chartData, $element.find('svg')[0], $scope.tweetData,
                                function (hoverEl) {

                                    $scope.current = hoverEl;
                                    $scope.setTab('neutral')

                               //     console.log('HOVER ',hoverEl)

                                    $scope.$apply();
                                });
                        }

                        $scope.$watch('[config.product,config.filter, config.accounts]', function () {
                            getData ()
                        })

                        function getData () {

                            $http({
                                method:'GET',
                                url:'/api/candles/'+$scope.config.product
                            }).then(function (response) {

                                $scope.chartData = response.data;

                                $http({
                                    method:'GET',
                                    url:'/api/tweets?filter='+$scope.config.filter+'&accounts='+$scope.config.accounts.join(',')
                                }).then(function (response2) {

                                    $scope.tweetData = response2.data;
                                    drawChart ();

                                }, function (response) {
                                })

                            }, function (response) {
                            })

                        }


                        $scope.setTab = function (tab) {
                            $scope.cTab=tab;

                            if(tab == 'positive')
                                $scope.currentTweetList = $scope.current.tweets.positiveTweets;
                            else if(tab == 'negative')
                                $scope.currentTweetList = $scope.current.tweets.negativeTweets;
                            else
                                $scope.currentTweetList = $scope.current.tweets.neutralTweets;

                            $scope.pullTweets();
                        }

                        $scope.pullTweets = function() {

                            setTimeout(
                                function () {

                                    console.log();

                                    var displayedTweets = document.querySelectorAll('.displayed-tweets');

                                    for(var x =0; x < displayedTweets.length; x++) {
                                        twttr.widgets.createTweet(
                                            displayedTweets[x].id.split('-')[2],
                                            document.getElementById(displayedTweets[x].id),
                                            {
                                                //   theme: 'dark'
                                            }
                                        );

                                    }

                                },100
                            )
                        }


                    }
                ]
            }}
    ])


export default directive.name;