import * as d3 from "d3";

import "./timeline.less";

export default {
    timeline: function (data, element, tweets, hoverCallBack, overCallBack) {

        console.log(data, element, window);

        var screenW = element.clientWidth-200;
        var screenH = element.clientHeight;

        console.log(screenW,screenH)

        // set the dimensions and margins of the graph
        var margin = {top: 0, right: 0, bottom: 0, left: 0},
            width = screenW - margin.left - margin.right,
            height = screenH - margin.top - margin.bottom;

        // parse the date / time
        var parseTime = d3.timeParse("%d-%b-%y");

        // set the ranges
        var x = d3.scaleTime().range([0, width]);
        var y = d3.scaleLinear().range([height, 0]);

        // define the line
        var valueline = d3.line()
            .x(function(d) { return x(d[0]*1000); })
            .y(function(d) { return y(d[4]); });


        data.sort(function(a, b) {
            return a[0] - b[0];
        });

        tweets.sort(function(a, b) {
            return a.date - b.date;
        });

        var svg = d3.select(element)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // Scale the range of the data
        x.domain(d3.extent(data, function(d) { return d[0]*1000; }));

        var yExtent = d3.extent(data, function(d) { return d[4]; });
        var spacing = (yExtent[1]-yExtent[0])*.2; //add a little space above and below the max and min of the chart
        y.domain([yExtent[0]-spacing,yExtent[1]+spacing]);

        // Add the valueline path.
        var path = svg.append("path")
            .data([data])
            .attr("class", "line")
            .attr("d", valueline);


        var tCountY = d3.scaleLinear().range([0,height/3]);
        var tCountYExtent = d3.extent(tweets, function(d) { return d.count; });
        tCountY.domain([0,tCountYExtent[1]]);

        var tweetLine = svg.append("g")
            .selectAll(".tweets")
            .data(tweets)
            .enter()
            .append("g")
            .attr("class", "tweets")
            .attr("transform", function (d) {
                //   console.log(d)
                var chartEl = getElForDate (d.date);
                return "translate("+x(d.date)+","+ height/2 +")"
            //    return "translate("+x(d.date)+","+ y(chartEl[4]) +")"
            });

        var tweetLineSpacing = 2;
        function neutralTweetOffset(d) {
            return tCountY(d.count-d.pos-d.neg)/2;
        }

        tweetLine
            .append("line")
            .attr("class", "tweet")
            .attr("x1", 0)
            .attr("y1", function (d) {
                return neutralTweetOffset(d)*-1;
            })
            .attr("x2", 0)
            .attr("y2", function (d) {
                return neutralTweetOffset(d);
            })

        tweetLine
            .append("line")
            .attr("class", "tweet positive")
            .attr("x1", 0)
            .attr("y1", function (d) {
                return (neutralTweetOffset(d)*-1)-tweetLineSpacing
            })
            .attr("x2", 0)
            .attr("y2", function (d) {
                return (neutralTweetOffset(d)*-1)-tCountY(d.pos)-tweetLineSpacing
            })


        tweetLine
            .append("line")
            .attr("class", "tweet negative")
            .attr("x1", 0)
            .attr("y1", function (d) {
                return neutralTweetOffset(d)+tweetLineSpacing
            })
            .attr("x2", 0)
            .attr("y2", function (d) {
                return (neutralTweetOffset(d)+tCountY(d.neg))+tweetLineSpacing
            })



        var focus = svg.append("g")
            .attr("class", "focus")
            .attr("r", 4.5)
            .style("display", "none");
/*
        focus.append("rect")
            .attr("class", "hover-select")
            .attr("x", 5)
            .attr("y", -20)
            .attr("width", 90)
            .attr("height", 40);
*/
        focus.append("circle")
            .attr("r", 4.5);



        focus.append("line")
            .attr("class", "target")
            .attr("x1", 0)
            .attr("y1", 6)
            .attr("y2", 10000)
            .attr("x2", 0)

        focus.append("line")
            .attr("class", "target")
            .attr("x1", 0)
            .attr("y1", -6)
            .attr("y2", -10000)
            .attr("x2", 0)


/*
        focus.append("text")
            .attr("class", "current")
            .attr("x", 9)
            .attr("y", 9)
            .attr("dy", ".35em");

        focus.append("text")
            .attr("class", "time")
            .attr("x", 9)
            .attr("y", -9)
            .attr("dy", ".35em");
            */
        /*
         /*
         // Add the X Axis
         svg.append("g")
         .attr("transform", "translate(0," + height + ")")
         .call(d3.axisBottom(x));

         // Add the Y Axis
         svg.append("g")
         .call(d3.axisLeft(y));
         */


        svg.append("rect")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .on("click", function () {
                hoverCallBack(lastMove);
            })
            .on("mouseover", function() { focus.style("display", null); })
            .on("mouseout", function() { focus.style("display", "none"); })
            .on("mousemove", mousemove);


        function getElForDate (x0) {
            var bisectDate = d3.bisector(function(d) { return +d[0]*1000; }).left;

            var i = bisectDate(data, x0, 1),
                d0 = data[i - 1],
                d1 = data[i],
                d = x0 - d0[0] > d1[0] - x0 ? d1 : d0;

            return d;
        }

        function getElForDateTweet (x0) {

            var bisectDate = d3.bisector(function(d) { return +d.date; }).left;

            var i = bisectDate(tweets, x0, 1),
                d0 = tweets[i - 1],
                d1 = tweets[i],
                d;

            if(d0 && d1)
                d = x0 - d0.date > d1.date - x0 ? d1 : d0;

            return d;
        }

        var lastMove;

        function mousemove() {

            var x0 = x.invert(d3.mouse(this)[0]);
            var d = getElForDate (x0);

            lastMove = {
                tick: d,
                tweets: getElForDateTweet(x0)
            };
            /*
             hoverCallBack( {
             tick: d,
             tweets: getElForDateTweet(x0)
             })
             */

            overCallBack({
                tick: d
            })
            focus.attr("transform", "translate(" + x(d[0]*1000) + "," + y(d[4]) + ")");
           /* focus.select(".current").text(d[4]);
            focus.select(".time").text(d3.timeFormat("%b %e %H:%M")(new Date(d[0]*1000)));*/
        }


        return {
            addPoint: function (nPoint) {

                data.push(nPoint);

                console.log(svg.select('.line'))
                x.domain(d3.extent(data, function(d) { return d[0]*1000; }));

                svg.select('path')
                    .data([data])
                    .attr("d", d3.line()
                        .x(function(d) { return x(d[0]*1000); })
                        .y(function(d) { return y(d[4]); })
                    )
                    .attr("transform", null)



                data.shift();
            }

        }
    },

    /*
    drawTimeline: function (data, element, tweets, hoverCallBack) {
        console.log(data, element, window);

        var screenW = element.clientWidth-200;
        var screenH = element.clientHeight;

        console.log(screenW,screenH)

        // set the dimensions and margins of the graph
        var margin = {top: 0, right: 0, bottom: 0, left: 0},
        width = screenW - margin.left - margin.right,
        height = screenH - margin.top - margin.bottom;

        // parse the date / time
        var parseTime = d3.timeParse("%d-%b-%y");

        // set the ranges
        var x = d3.scaleTime().range([0, width]);
        var y = d3.scaleLinear().range([height, 0]);

        // define the line
        var valueline = d3.line()
            .x(function(d) { return x(d[0]*1000); })
            .y(function(d) { return y(d[4]); });


        data.sort(function(a, b) {
            return a[0] - b[0];
        });

        tweets.sort(function(a, b) {
            return a.date - b.date;
        });

        var svg = d3.select(element)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

        // Scale the range of the data
        x.domain(d3.extent(data, function(d) { return d[0]*1000; }));

        var yExtent = d3.extent(data, function(d) { return d[4]; });
        var spacing = (yExtent[1]-yExtent[0])*.2; //add a little space above and below the max and min of the chart
        y.domain([yExtent[0]-spacing,yExtent[1]+spacing]);

        // Add the valueline path.
        svg.append("path")
            .data([data])
            .attr("class", "line")
            .attr("d", valueline);

        var tweetLine = svg.append("g")
            .selectAll(".tweets")
            .data(tweets)
            .enter()
            .append("g")
            .attr("class", "tweets")
            .attr("transform", function (d) {
             //   console.log(d)
                var chartEl = getElForDate (d.date);
                return "translate("+x(d.date)+","+ y(chartEl[4]) +")"
            });

        tweetLine
            .append("line")
            .attr("class", "tweet")
            .attr("x1", 0)
            .attr("y1", function (d) {
                return ((d.neg)/2*-1)*15
            })
            .attr("x2", 0)
            .attr("y2", function (d) {
                return ((d.count)/2)*15
            })

        tweetLine
            .append("line")
            .attr("class", "tweet positive")
            .attr("x1", 0)
            .attr("y1", function (d) {
                return ((d.count)/2*-1)*15-4
            })
            .attr("x2", 0)
            .attr("y2", function (d) {
                return (((d.count)/2*-1)-d.pos)*15-4
            })


        tweetLine
            .append("line")
            .attr("class", "tweet negative")
            .attr("x1", 0)
            .attr("y1", function (d) {
                return ((d.count)/2)*15+4
            })
            .attr("x2", 0)
            .attr("y2", function (d) {
                return ((d.count)/2+d.neg)*15+4
            })



        var focus = svg.append("g")
            .attr("class", "focus")
            .attr("r", 4.5)
            .style("display", "none");

        focus.append("rect")
            .attr("class", "hover-select")
            .attr("x", 5)
            .attr("y", -20)
            .attr("width", 90)
            .attr("height", 40);

        focus.append("circle")
            .attr("r", 4.5);

        focus.append("text")
            .attr("class", "current")
            .attr("x", 9)
            .attr("y", 9)
            .attr("dy", ".35em");

        focus.append("text")
            .attr("class", "time")
            .attr("x", 9)
            .attr("y", -9)
            .attr("dy", ".35em");



        svg.append("rect")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .on("click", function () {
                hoverCallBack(lastMove);
            })
            .on("mouseover", function() { focus.style("display", null); })
            .on("mouseout", function() { focus.style("display", "none"); })
            .on("mousemove", mousemove);


        function getElForDate (x0) {
            var bisectDate = d3.bisector(function(d) { return +d[0]*1000; }).left;

            var i = bisectDate(data, x0, 1),
                d0 = data[i - 1],
                d1 = data[i],
                d = x0 - d0[0] > d1[0] - x0 ? d1 : d0;

            return d;
        }

        function getElForDateTweet (x0) {

            var bisectDate = d3.bisector(function(d) { return +d.date; }).left;

            var i = bisectDate(tweets, x0, 1),
                d0 = tweets[i - 1],
                d1 = tweets[i],
                d;

                if(d0 && d1)
                    d = x0 - d0.date > d1.date - x0 ? d1 : d0;

            return d;
        }

        var lastMove;

        function mousemove() {

            var x0 = x.invert(d3.mouse(this)[0]);
            var d = getElForDate (x0);

            lastMove = {
                tick: d,
                tweets: getElForDateTweet(x0)
            };

            focus.attr("transform", "translate(" + x(d[0]*1000) + "," + y(d[4]) + ")");
            focus.select(".current").text(d[4]);
            focus.select(".time").text(d3.timeFormat("%b %e %H:%M")(new Date(d[0]*1000)));
        }
    }\
*/
};