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

                        var socket = io.connect();
                        socket.on('connect', function(data) {
                            //connected
                        });

                        $scope.sortCoins = function (col) {
                            $scope.sortVal = col == $scope.sortVal ? '-'+col : col;
                        }


                        $scope.config = {
                            exchange : 'gdax',
                            product : 'MCO',
                            accounts : $scope.traders,
                        //    positiveTerms : positiveTerms.join(','),
                        //    negativeTerms : negativeTerms.join(',')
                        }


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

/*
                            for(var x = 0; x < $scope.tweetData.length; x++) {
                                $scope.tweetData[x].positiveTweets = [];
                                $scope.tweetData[x].negativeTweets =  [];
                                $scope.tweetData[x].neutralTweets = [];

                                for(var y = 0; y < $scope.tweetData[x].tweets.length; y++) {

                                    var isPositive;// = doesContainArrayElements($scope.tweetData[x].tweets[y].text, $scope.config.positiveTerms.split(','));
                                    var isNegative;// = doesContainArrayElements($scope.tweetData[x].tweets[y].text, $scope.config.negativeTerms.split(','));

                                    if(isNegative) {
                                        $scope.tweetData[x].negativeTweets.push($scope.tweetData[x].tweets[y])
                                    } else if (isPositive) {
                                        $scope.tweetData[x].positiveTweets.push($scope.tweetData[x].tweets[y])
                                    } else {
                                        $scope.tweetData[x].neutralTweets.push($scope.tweetData[x].tweets[y])
                                    }

                                }

                            }*/
                            
                            console.log('CHART DATA', $scope.chartData, $scope.tweetData)
                            var chart = d3Timeline.timeline($scope.chartData, $element.find('svg')[0], $scope.tweetData,
                                function (hoverEl) {

                                    $scope.current = hoverEl;

                                    console.log('HOVER ',hoverEl)
                                    $http({
                                        method:'GET',
                                        url:'/api/tweets/'+hoverEl.tweets.date+'/'+$scope.config.product
                                    }).then(function (response) {
                                        console.log(response);
                                        $scope.current = response.data;
                                        $scope.setTab('neutral')
                                    })

                                 //   $scope.$apply();
                                }, function (d) {
                                    $scope.config.date = d.tick[0]*1000;
                                    $scope.config.price = d.tick[4];
                                    $scope.$apply();
                                });

/*
                            var lastPoint =$scope.chartData[$scope.chartData.length-1][0];
                            setInterval(function () {
                                lastPoint += 3000;
                                tl.addPoint([
                                    lastPoint,2200,2224.82,2217.02,2203.39+Math.random()*1000,174.31514486999959
                                ])
                            },200)*/
                        }

                        $scope.$watch('[config.product,config.filter, config.accounts]', function () {
                            getData ()
                        })

                        /*

                        socket.emit('subscribe-to-feed', {
                            market: 'gdax',
                            product: $scope.config.product,
                            granularity: 60
                        })

                        var chart;
                        socket.on('feed-update', function(data) {
                            console.log(data);
                            $scope.chartData = data;
                            $scope.tweetData = [];

                            $scope.$apply();

                            if(!chart) {
                                drawChart();
                            } else {
                                
                                chart.addPoint(data[0]);
                            }
                        });
                        */

                        $http({
                            method:'GET',
                            url:'/api/markets/bittrex'
                        }).then(function (response) {

                            for(var x =0; x  < response.data.length; x++) {
                                response.data[x].change = ((response.data[x].Last-response.data[x].PrevDay)/response.data[x].PrevDay*100);
                                response.data[x].coin = response.data[x].MarketName.split('-')[1];
                            }
                            console.log('ADASDASD', response)

                            $scope.markets = response.data;
                        });


                        function getData () {

                            $http({
                                method:'GET',
                                url:'/api/candles/'+$scope.config.product
                            }).then(function (response) {
/*
                                var last = response.data[response.data.length-1];
                                response.data.push([
                                    last[0]+60*60,
                                    last[1],
                                    last[2],
                                    last[3],
                                    last[4],
                                    last[5]
                                ])*/

                                $scope.chartData = response.data;
                                $scope.tweetData = [];

                                console.log('MORE DATA')
                            //    drawChart ();

                                $http({
                                    method:'GET',
                                    url:'/api/tweets/'+$scope.config.product
                                }).then(function (response2) {

                                    console.log('MORE DATA',response2)

                                    $scope.tweetData = response2.data;
                                    drawChart ();

                                }, function (response) {
                                })


                            }, function (response) {
                            })

                        }

                        $scope.changeMarket= function(market){
                            $scope.config.product = market.split('-')[1];
                            $scope.current = null;
                            getData ();
                        }


                        $scope.setTab = function (tab) {
                            $scope.cTab=tab;

                            if(tab == 'positive')
                                $scope.currentTweetList = $scope.current.positive;
                            else if(tab == 'negative')
                                $scope.currentTweetList = $scope.current.negative;
                            else
                                $scope.currentTweetList = $scope.current.neutral;

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