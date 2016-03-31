

// Various accessors that specify the four dimensions of data to visualize.
function x(d) { return d.timeNumUser; }
function y(d) { return d.timeAvgSize; }
function z(d) {return d.functionality;}
function radius(d) { return d.timeSumSize; }
function color(d) { return d.functionality; }
function key(d) { return d.functionality; }

var numUser=[0, 10000],
numPacket=[0,2000000],
avgSize=[0,1200],
sumSize=[0,1000000000];

var zDomain = ["00:00", "23:45"];

// Chart dimensions.
var margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 39.5},
    width = 960 - margin.right,
    height = 500 - margin.top - margin.bottom;

// Various scales. These domains make assumptions of data, naturally.
var xScale = d3.scale.linear().domain(numUser).range([0, width]),
    yScale = d3.scale.linear().domain(avgSize).range([height, 0]),
    radiusScale = d3.scale.sqrt().domain(sumSize).range([0, 40]),
    colorScale = d3.scale.category10();

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
    .text("income per capita, inflation-adjusted (dollars)");

// Add a y-axis label.
svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("life expectancy (years)");

// Add the year label; the value is set on transition.
var label = svg.append("text")
    .attr("class", "year label")
    .attr("text-anchor", "end")
    .attr("y", height - 24)
    .attr("x", width)
    .text(1800);

// Load the data.
d3.json("data/dpi.json", function(data) {

  // A bisector since many nation's data is sparsely-defined.
  var bisect = d3.bisector(function(d) { return d[0]; });

  // Add a dot per nation. Initialize the data at 1800, and set the colors.
  var dot = svg.append("g")
      .attr("class", "dots")
    .selectAll(".dot")
      .data(interpolateData(zDomain[0]))
    .enter().append("circle")
      .attr("class", "dot")
      .style("fill", function(d) { return colorScale(color(d)); })
      .call(position)
      .sort(order);

  // Add a title.
  dot.append("title")
      .text(function(d) { return d.name; });

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
      .duration(30000)
      .ease("linear")
      .tween("z", tweenZ)
      .each("end", enableInteraction);

  // Positions the dots based on data.
  function position(dot) {
    dot
      .attr("cx", function(d) { 
        var xVal = xScale(d.x); 
        if (xVal == NaN) {
          console.log("xScale error on " + d);
        }
        
      })
      .attr("cy", function(d) { 
        return yScale(d.y); 
      })
      .attr("r", function(d) { 
        return radiusScale(d.radius); 
      });
  }

  // Defines a sort order so that the smallest dots are drawn on top.
  function order(a, b) {
    return radius(b) - radius(a);
  }

  // After the transition finishes, you can mouseover to change the year.
  function enableInteraction() {
    var zScale = d3.scale.linear()
        .domain(zDomain)
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
      displayZ(zScale.invert(d3.mouse(this)[0]));
    }
  }

  // Tweens the entire chart by first tweening the year, and then the data.
  // For the interpolated data, the dots and label are redrawn.
  function tweenZ() {
    var zVal = d3.interpolate("00:00", "23:45");
    return function(t) { displayZ(zVal(t)); };
  }

  // Updates the display to show the specified year.
  function displayZ(zVal) {
    dot.data(interpolateData(zVal), key).call(position).sort(order);
    label.text(Math.round(zVal));
  }

  // Interpolates the dataset for the given (fractional) year.
  function interpolateData(zVal) {
    return data.map(function(d) {
      return {
        name: key(d),
        region: key(d),
        x: x(d),
        radius: radius(d),
        y: y(d)
      };
    });
  }

  // Finds (and possibly interpolates) the value for the specified year.
  function interpolateValues(values, zVal) {
    var i = bisect.left(values, zVal, 0, values.length - 1),
        a = values[i];
    if (i > 0) {
      var b = values[i - 1],
          t = (zVal - a[0]) / (b[0] - a[0]);
      return a[1] * (1 - t) + b[1] * t;
    }
    return a[1];
  }
});

