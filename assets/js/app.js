// Define measurements
var svgWidth = 1000;
var svgHeight = 550;

var margin = {
    top: 20,
    right: 40,
    bottom: 80,
    left: 100
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart, and create responsive viewBox.
var svg = d3.select("#scatter")
    .append("svg")
    .attr("viewBox", "5 0 1000 550")
    .attr("preserveAspectRatio", "xMinYMin");

// Append an SVG group
var chartGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params
// Data columns: id,state,abbr,poverty,povertyMoe,age,ageMoe,
    // income,incomeMoe,healthcare,healthcareLow,healthcareHigh,
    // obesity,obesityLow,obesityHigh,smokes,smokesLow,smokesHigh
var chosenXAxis = "poverty";
var chosenYAxis = "healthcare";

// Function used for updating x-scale var upon click on axis label
function xScale(censusData, chosenXAxis) {
    // Create scales
    var xLinearScale = d3.scaleLinear()
        .domain([d3.min(censusData, d => d[chosenXAxis]) * 0.9,
            d3.max(censusData, d => d[chosenXAxis]) * 1.05
        ])
        .range([0, width]);

    return xLinearScale;
}

// Create y-scale function
function yScale(censusData, chosenYAxis) {
    var yLinearScale = d3.scaleLinear()
        .domain([d3.min(censusData, d => d[chosenYAxis]) * 0.75,
        d3.max(censusData, d => d[chosenYAxis])])
        .range([height, 0]);
    
    return yLinearScale;
}

// Function used for updating xAxis var upon click on axis label
function renderXAxes(newXScale, xAxis) {
    var bottomAxis = d3.axisBottom(newXScale);

    xAxis.transition()
        .duration(1000)
        .call(bottomAxis);

    return xAxis;
}

// Function used for updating yAxis var upon click on axis label
function renderYAxes(newYScale, yAxis) {
    var leftAxis = d3.axisLeft(newYScale);

    yAxis.transition()
        .duration(1000)
        .call(leftAxis);

    return yAxis;
}

// Function used for updating circles group with a transition to new circles
function renderCircles(circlesGroup, circlesAbbrev, circlesHidden, newXScale, chosenXAxis, newYScale, chosenYAxis) {

    circlesAbbrev.transition()
        .duration(1000)
        .attr("x", d => newXScale(d[chosenXAxis]))
        .attr("y", d => newYScale(d[chosenYAxis])+5.5);

    circlesGroup.transition()
        .duration(1000)
        .attr("cx", d => newXScale(d[chosenXAxis]))
        .attr("cy", d => newYScale(d[chosenYAxis]));
    // Make transition 1ms to prevent interruption mid-transition due to mousehover
    circlesHidden.transition()
        .duration(1)
        .attr("cx", d => newXScale(d[chosenXAxis]))
        .attr("cy", d => newYScale(d[chosenYAxis]));
    
    return circlesHidden;
}

// Function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, chosenYAxis, circlesHidden) {
    var xLabel;

    if (chosenXAxis === "poverty") {
        xLabel = "Poverty:";
    }
    else if (chosenXAxis === "age") {
        xLabel = "Age:"
    }
    else {
        xLabel = "Household Income:";
    }

    var yLabel;
    
    if (chosenYAxis === "healthcare") {
        yLabel = "Lacks Healthcare:";
    }
    else if (chosenYAxis === "smokes") {
        yLabel = "Smokers:"
    }
    else {
        yLabel = "Obesity:";
    }

    var toolTip = d3.tip()
        .attr("class", "d3-tip")
        // Conditionals based on chosen x-/y-axis variables
        .offset(function() {
            if (chosenXAxis === "income") {
                return [45, -100]
            }
            else if (chosenYAxis === "healthcare") {
                return [45, -90]
            }
            return [45, -70]
        })
        // Different text for tooltip based on variables
        .html(function(d) {
            if (chosenXAxis === "age") {
                return (`${d.state}<br>${xLabel} ${d[chosenXAxis]}<br>${yLabel} ${d[chosenYAxis]}%`);
            }
            else if (chosenXAxis === "income") {
                return (`${d.state}<br>${xLabel} $${d[chosenXAxis]}<br>${yLabel} ${d[chosenYAxis]}%`);
            }
            else {
                return (`${d.state}<br>${xLabel} ${d[chosenXAxis]}%<br>${yLabel} ${d[chosenYAxis]}%`);
            }
    });

    circlesHidden.call(toolTip);
    // On mouseover event
    circlesHidden.on("mouseover", function(data) {
        toolTip.show(data, this)
        d3.select(this)
            .transition()
            .duration(200)
            .attr("stroke", "black"); 
    })
    // On mouseout event
        .on("mouseout", function(data, index) {
            toolTip.hide(data, this)
            d3.select(this)
                .transition()
                .duration(150)
                .attr("stroke", "rgba(252,252,252,0)");
        });

    return circlesHidden;
}

// Retrieve data from the CSV file and execute everything below
d3.csv("assets/data/data.csv").then(function(censusData, error) {
    if (error) throw error;

    // Parse data
    censusData.forEach(function(data) {
        data.poverty = +data.poverty;
        data.age = +data.age;
        data.income = +data.income;
        data.healthcare = +data.healthcare;
        data.obesity = +data.obesity;
        data.smokes = +data.smokes;
    });

    // xLinearScale function above csv import
    var xLinearScale = xScale(censusData, chosenXAxis);

    // yLinearScale function above csv import
    var yLinearScale = yScale(censusData, chosenYAxis);

    // Create initial axis functions
    var bottomAxis = d3.axisBottom(xLinearScale);
    var leftAxis = d3.axisLeft(yLinearScale);

    // Append x-axis
    var xAxis = chartGroup.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(bottomAxis);

    // Append y-axis
    var yAxis = chartGroup.append("g")
        .call(leftAxis);

    // Append initial circles
    var circlesGroup = chartGroup.selectAll("circle")
        .data(censusData)
        .enter()
        .append("circle")
        .attr("cx", d => xLinearScale(d[chosenXAxis]))
        .attr("cy", d => yLinearScale(d[chosenYAxis]))
        .attr("r", 14)
        .classed("stateCircle", true);

    // Show state abbreviation in circle
    var circlesAbbrev = chartGroup.selectAll()
        .data(censusData)
        .enter()
        .append("text")
        .text(d => d.abbr)
        .attr("x", d => xLinearScale(d[chosenXAxis]))
        .attr("y", d => yLinearScale(d[chosenYAxis])+5.5)
        .classed("stateText", true);

    // Append transparent circle over both initial circles and state abbreviations
    var circlesHidden = chartGroup.selectAll("circle.hidden")
        .data(censusData)
        .enter()
        .append("circle")
        .attr("cx", d => xLinearScale(d[chosenXAxis]))
        .attr("cy", d => yLinearScale(d[chosenYAxis]))
        .attr("r", 14)
        .attr("stroke", "rgba(252,252,252,0)")
        .classed("hidden", true);

    // Create group for x-axis labels
    var xLabelsGroup = chartGroup.append("g")
        .attr("transform", `translate(${width / 2}, ${height + 20})`);

    var povertyLabel = xLabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 20)
        .attr("value", "poverty") // value to grab for event listener
        .classed("active", true)
        .text("In Poverty (%)");

    var ageLabel = xLabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 40)
        .attr("value", "age") // value to grab for event listener
        .classed("inactive", true)
        .text("Age (Median)");

    var householdIncomeLabel = xLabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 60)
        .attr("value", "income") // value to grab for event listener
        .classed("inactive", true)
        .text("Household Income (Median)");

    // Create group for y-axis labels
    var yLabelsGroup = chartGroup.append("g")
        .attr("transform", "rotate(-90)");

    var healthcareLabel = yLabelsGroup.append("text")
        .attr("y", 0 - margin.left + 75)
        .attr("x", 0 - (height / 2))
        .attr("value", "healthcare") // value to grab for event listener
        .classed("active", true)
        .text("Lacks Healthcare (%)");

    var smokeLabel = yLabelsGroup.append("text")
        .attr("y", 0 - margin.left + 55)
        .attr("x", 0 - (height / 2))
        .attr("value", "smokes") // value to grab for event listener
        .classed("inactive", true)
        .text("Smokes (%)");

    var obeseLabel = yLabelsGroup.append("text")
        .attr("y", 0 - margin.left + 35)
        .attr("x", 0 - (height / 2))
        .attr("value", "obesity") // value to grab for event listener
        .classed("inactive", true)
        .text("Obese (%)");

  // updateToolTip function above csv import
    circlesHidden = updateToolTip(chosenXAxis, chosenYAxis, circlesHidden);

  // x-axis labels event listener
    xLabelsGroup.selectAll("text")
        .on("click", function() {
        // Get value of selection
            var value = d3.select(this).attr("value");
            if (value !== chosenXAxis) {

                // Replace chosenXAxis with value
                chosenXAxis = value;

                // Functions here found above csv import
                // Updates x-scale for new data
                xLinearScale = xScale(censusData, chosenXAxis);

                // Update x-axis with transition
                xAxis = renderXAxes(xLinearScale, xAxis);

                // Update circles with new x values
                circlesHidden = renderCircles(circlesGroup, circlesAbbrev, circlesHidden, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis);

                // Update tooltips with new info
                circlesHidden = updateToolTip(chosenXAxis, chosenYAxis, circlesHidden);

                // Change classes to bold text and vice versa
                if (chosenXAxis === "poverty") {
                povertyLabel
                    .classed("active", true)
                    .classed("inactive", false);
                ageLabel
                    .classed("active", false)
                    .classed("inactive", true);
                householdIncomeLabel
                    .classed("active", false)
                    .classed("inactive", true);
                }
                else if (chosenXAxis === "age") {
                ageLabel
                    .classed("active", true)
                    .classed("inactive", false);
                povertyLabel
                    .classed("active", false)
                    .classed("inactive", true);
                householdIncomeLabel
                    .classed("active", false)
                    .classed("inactive", true);
                }
                else {
                householdIncomeLabel
                    .classed("active", true)
                    .classed("inactive", false);
                ageLabel
                    .classed("active", false)
                    .classed("inactive", true);
                povertyLabel
                    .classed("active", false)
                    .classed("inactive", true);
                }
            }
        });    
    yLabelsGroup.selectAll("text")
        .on("click", function() {
            var value = d3.select(this).attr("value");

            if (value !== chosenYAxis) {
            
                // Replace chosenYAxis with value
                chosenYAxis = value;

                // Functions here found above csv import
                // Update y-scale for new data
                yLinearScale = yScale(censusData, chosenYAxis);

                // Update y-axis with transition
                yAxis = renderYAxes(yLinearScale, yAxis);

                // Update circles with new y values
                circlesHidden = renderCircles(circlesGroup, circlesAbbrev, circlesHidden, xLinearScale, chosenXAxis, yLinearScale, chosenYAxis);

                // Update tooltips with new info
                circlesHidden = updateToolTip(chosenXAxis, chosenYAxis, circlesHidden);

                // Change classes to change bold text
                if (chosenYAxis === "healthcare") {
                    healthcareLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    smokeLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    obeseLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    }
                else if (chosenYAxis === "smokes") {
                    smokeLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    healthcareLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    obeseLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    }
                else {
                    obeseLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    healthcareLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    smokeLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    }
            }
        });
}).catch(function(error) {
    console.log(error);
});
