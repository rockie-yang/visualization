"use strict";

// Various accessors that specify the four dimensions of data to visualize.
function x(d) {
    return d.timeNumUser;
}

function y(d) {
    return d.timeAvgSize;
}

function radius(d) {
    return d.timeSumSize;
}

function color(d) {
    return d.functionality;
}

function key(d) {
    return d.functionality;
}

var numUser = [0, 10000];
// numPacket = [0, 2000000],
var avgSize = [0, 1200];
var sumSize = [0, 1000000000];


// Chart dimensions.
var margin = { top: 19.5, right: 19.5, bottom: 19.5, left: 39.5 },
    width = 960 - margin.right,
    height = 500 - margin.top - margin.bottom;

// Various scales. These domains make assumptions of data, naturally.
var xScale = d3.scale.linear().domain(numUser).range([5, width]),
    yScale = d3.scale.linear().domain(avgSize).range([height - 10, 0]),
    radiusScale = d3.scale.sqrt().domain(sumSize).range([2, 40]),
    colorScale = d3.scale.category20();

// The x & y axes.
var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(12, d3.format(",d")),
    yAxis = d3.svg.axis().scale(yScale).orient("left");

// Create the SVG container and set the origin.
var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Add the x-axis.
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

// Add the y-axis.
svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

// Add an x-axis label.
svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height - 6)
    .text("num users used");

// Add a y-axis label.
svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("average package size");

// Add the year label; the value is set on transition.
var label = svg.append("text")
    .attr("class", "year label")
    .attr("text-anchor", "end")
    .attr("y", height - 24)
    .attr("x", width)
    .text(0);

// Load the data.
d3.json("data/mockdpi.json", function(nations) {

    // A bisector since many nation's data is sparsely-defined.
    var bisect = d3.bisector(function(d) {
        return d[0];
    });

    // Add a dot per nation. Initialize the data at 1800, and set the colors.
    // var item = svg.append("g")
    //     .attr("class", "items")
    //     .selectAll(".item")
    //     .data(interpolateData(0))
    //     .enter().append("g").attr("class", "item")
    //     .attr("id", function(d) {
    //       return "item" + d.functionality;
    //     }).sort(order);

    // var dot = item.append("circle")
    //     .attr("class", "dot")
    //     .style("fill", function(d) {
    //         return colorScale(color(d)); })
    //     .call(position);

    // var legend = item.append("text")
    //     .text(function(d){
    //       return d.functionality;
    //     })
    //     .attr("class", "legend")
    //     .style("fill", function(d){
    //       return colorScale(color(d));
    //     })
    //     .call(positionLegend);


    var dot = svg.append("g")
        .attr("class", "dots")
        .selectAll(".dot")
        .data(interpolateData(0))
        .enter().append("circle")
        .attr("class", "dot")
        .style("fill", function(d) {
            return colorScale(color(d));
        })
        .call(position)
        .sort(order);


    // Add a title.
    dot.append("title")
        .text(function(d) {
            return d.functionality;
        });

    // var legend = svg.append("g")
    //     .attr("class", "legend")
    //     .selectAll(".legend")
    //     .data(interpolateData(0))
    // .enter().append("text")
    // .text(function(d){
    //   return d.functionality;
    // })
    // .attr("class", "legend")
    // .style("fill", function(d){
    //   return colorScale(color(d));
    // })
    // .call(positionLegend)
    // .sort(order);

    // Add an overlay for the year label.
    var box = label.node().getBBox();

    var overlay = svg.append("rect")
        .attr("class", "overlay")
        .attr("x", box.x)
        .attr("y", box.y)
        .attr("width", box.width)
        .attr("height", box.height)
        .on("mouseover", enableInteraction);

    // Start a transition that interpolates the data based on year.
    svg.transition()
        .duration(50000)
        .ease("linear")
        .tween("year", tweenYear)
        .each("end", enableInteraction);

    // Positions the dots based on data.
    function position(dot) {
        dot.attr("cx", function(d) {
                return xScale(Math.max(x(d), 0)); })
            .attr("cy", function(d) {
                return yScale(Math.max(y(d), 0)); })
            .attr("r", function(d) {
                return radiusScale(Math.max(radius(d), 0)); });
    }

    // Positions the dots based on data.
    function positionLegend(legend) {
        legend.attr("x", function(d) {
                return xScale(x(d));
            })
            .attr("y", function(d) {
                return yScale(y(d));
            });
    }

    // Defines a sort order so that the smallest dots are drawn on top.
    function order(a, b) {
        return radius(b) - radius(a);
    }

    // After the transition finishes, you can mouseover to change the year.
    function enableInteraction() {
        var yearScale = d3.scale.linear()
            .domain([0, 96])
            .range([box.x + 10, box.x + box.width - 10])
            .clamp(true);

        // Cancel the current transition, if any.
        svg.transition().duration(0);

        overlay
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .on("mousemove", mousemove)
            .on("touchmove", mousemove);

        function mouseover() {
            label.classed("active", true);
        }

        function mouseout() {
            label.classed("active", false);
        }

        function mousemove() {
            displayYear(yearScale.invert(d3.mouse(this)[0]));
        }
    }

    // Tweens the entire chart by first tweening the year, and then the data.
    // For the interpolated data, the dots and label are redrawn.
    function tweenYear() {
        var year = d3.interpolateNumber(0, 96);
        return function(t) { displayYear(year(t)); };
    }

    // Updates the display to show the specified year.
    function displayYear(year) {
        dot.data(interpolateData(year), key).call(position).sort(order);
        var hour = parseInt(parseInt(year) / 4);
        var minute = parseInt(parseInt(year) % 4 * 15);
        var hourStr = hour;
        if (hour < 10) {
            hourStr = "0" + hour;
        }
        var minStr = minute;
        if (minute < 10) {
            minStr = "0" + minute;
        }

        label.text(hourStr + ":" + minStr);
    }

    // Interpolates the dataset for the given (fractional) year.
    function interpolateData(year) {
        return nations.map(function(d) {
            return {
                functionality: d.functionality,
                timeNumUser: interpolateValues(d.timeNumUser, year),
                timeSumSize: interpolateValues(d.timeSumSize, year),
                timeAvgSize: interpolateValues(d.timeAvgSize, year)
            };
        });
    }

    // Finds (and possibly interpolates) the value for the specified year.
    function interpolateValues(values, year) {
        var i = bisect.left(values, year, 0, values.length - 1),
            a = values[i];
        if (i > 0) {
            var b = values[i - 1],
                t = (year - a[0]) / (b[0] - a[0]);
            return a[1] * (1 - t) + b[1] * t;
        }
        try {
            return a[1];
        } catch (err) {
            console.log(i, values, a, year);
            throw new Error("Something went badly wrong!");
        }
    }
});
