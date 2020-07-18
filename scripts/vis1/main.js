let visDiv, svg, svgWidth, svgHeight, width, height;
let lastEvent;
let tooltip;
var selectedYear = 2009;
var povertyData;
var sidebarInitialColour;
var selectedSidebar = 0; // 0 is neither, 1 = left, 2 = right
var leftCountry, leftSidebar;
var rightCountry, rightSidebar;

var historyStack = [];
var redoStack = [];

window.addEventListener('load', function () {
  visDiv = document.getElementById("vis");
  svg = d3.select(vis).append("svg");
  svg.attr("id", "worldMap");
  let g = svg.append("g");
  svgWidth = +svg.attr("width");
  svgHeight = +svg.attr("height");

  initializeSlider();
  initializeSidebars();

  // Load data
  var promises = [
    d3.json("https://raw.githubusercontent.com/dtyoung/albums/master/countries_topo.json"),
    loadPovertyData().then((data) => { povertyData = data })
  ]

  Promise.all(promises).then(ready);

  function ready([topo]) {
    // Setup toolbar buttons
    document.getElementById("download").onclick = downloadVisualisation;
    document.getElementById("undo").onclick = undo;
    document.getElementById("redo").onclick = redo;

    d3.schemeRdYlGn[9].reverse()
    function redraw() {
      // Extract the width and height that was computed by CSS.
      svgWidth = visDiv.clientWidth;
      svgHeight = visDiv.clientHeight;

      // Use the extracted size to set the size of the SVG element.
      svg
        .attr("width", svgWidth)
        .attr("height", svgHeight);

      // Map and projection
      var projection = d3.geoMercator()
        .scale(getMapScale(visDiv.clientWidth, visDiv.clientHeight))
        .center([0, 0])
        .translate([visDiv.clientWidth / 2, (visDiv.clientHeight / 2) + 40]);

      // Data and color scale
      var colorScale = d3.scaleThreshold()
        .domain([0, 0.5, 1, 2, 4, 8, 16, 32, 64])
        .range(d3.schemeRdYlGn[9]);

      g.remove();
      g = svg.append("g")

      // Draw the map
      g.selectAll("path")
        .data(topo.features)
        .enter()
        .append("path")
        // Draw each country
        .attr("d", d3.geoPath()
          .projection(projection)
        )

        // Set the color of each country
        .attr("fill", function (d) {
          countryName = d.properties.name
          mappedCountryName = countryMapper[countryName]
          countryData = povertyData[selectedYear][mappedCountryName]

          if (countryData) {
            if (countryData[1]) {
              d.total = countryData[1][" Value"]
              return colorScale(d.total);
            }
            else {
              d.total = countryData['totalPoverty']
              return colorScale(d.total);
            }
          }
          d.total = undefined;
          return '#A9A9A9';
        })
        .style("stroke", "transparent")
        .attr("class", function (d) { return "Country" })
        .style("opacity", .8)
        .on("mouseover", mouseOver)
        .on("mouseout", mouseLeave)
        .on("click", mouseClick)

      if (lastEvent !== undefined) {
        g.attr("transform", lastEvent);
      }

      /******  TOOLTIP  *******/
      tooltip = d3.select("#vis")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

      /******  SIDEBARS *******/
      if (leftCountry != null) {
        setSidebar("left", leftCountry);
      }
      if (rightCountry != null) {
        setSidebar("right", rightCountry);
      }
    }

    redraw();

    // Redraw based on the new size whenever the browser window is resized
    window.addEventListener("resize", redraw);
    document.getElementById("yearSlider").addEventListener("input", redraw)

  }

  // Mouse pan and zoom
  svg.call(d3.zoom()
    .extent([[0, 0], [svgWidth, svgHeight]])
    .scaleExtent([1, 40])
    .on("zoom", zoomed)
  ).on("dblclick.zoom", null);

  function mouseOver(d) {
    // Tool tip appears
    tooltip.transition()
      .duration(70)
      .style("opacity", .9);

    // Set the tooltip's text and styling
    tooltip.html(tooltipText(d))
      .style("left", d3.event.pageX + "px")
      .style("top", d3.event.pageY + "px");

    // Greys out all other countries
    d3.selectAll(".Country")
      .transition()
      .duration(1000)
      .style("opacity", .5)

    d3.select(this)
      .transition()
      .duration(0)
      .style("opacity", 1)
      .style("stroke", "black")
  }

  function mouseLeave(d) {
    tooltip.transition()
      .duration(80)
      .style("opacity", 0);

    d3.selectAll(".Country")
      .transition()
      .duration(1000)
      .style("opacity", 1)
    d3.select(this)
      .transition()
      .duration(0)
      .style("stroke", "transparent")
  }

  function mouseClick(d) {
    if (selectedSidebar == 0) return;

    document.getElementById("left-sidebar").style.backgroundColor = sidebarInitialColour;
    document.getElementById("right-sidebar").style.backgroundColor = sidebarInitialColour;

    if (selectedSidebar === 1) {
      leftCountry = d.properties.name;
      setSidebar("left", leftCountry);
    }
    if (selectedSidebar === 2) {
      rightCountry = d.properties.name;
      setSidebar("right", rightCountry);
    }
    historyStack.push({ leftCountry, rightCountry });
    redoStack = [];
    selectedSidebar = 0;
  }

  function zoomed() {
    const transform = d3.event.transform;
    lastEvent = transform;
    g.attr("transform", transform);
  }
})

function getMapScale(width, height) {
  const baseScale = 70;
  const baseWidth = 453;
  const baseHeight = 379;

  const scale1 = baseScale * width / baseWidth;
  const scale2 = baseScale * height / baseHeight;
  return d3.min([scale1, scale2]);
}

function initializeSlider() {
  var slider = document.getElementById("yearSlider");
  var display = document.getElementById("yearDisplay");
  display.innerHTML = selectedYear;

  // Update the current slider value (each time you drag the slider handle)
  slider.oninput = function () {
    selectedYear = this.value;
    display.innerHTML = this.value;
  }
}

function initializeSidebars() {
  leftSidebar = document.getElementById("left-sidebar");
  rightSidebar = document.getElementById("right-sidebar");
  let left = leftSidebar;
  let right = rightSidebar;

  left.style.cursor = "pointer";
  sidebarInitialColour = left.style.backgroundColor;
  left.addEventListener("click", () => {
    selectedSidebar = 1;
    left.style.backgroundColor = "LightYellow";
    right.style.backgroundColor = sidebarInitialColour;
  });

  right.style.cursor = "pointer";
  right.addEventListener("click", () => {
    selectedSidebar = 2;
    right.style.backgroundColor = "LightYellow";
    left.style.backgroundColor = sidebarInitialColour;
  })
}

function tooltipText(d) {
  const countryName = d.properties.name;
  let povertyPercentageText;

  if (d.total === undefined) {
    povertyPercentageText = "No Data Available </br>For This Year"
  } else {
    povertyPercentageText = `Percentage of Population </br> Below Poverty Line: ${d.total}%`;
  }
  return `<b>${countryName}</b><br/>
    ${povertyPercentageText}`;
}

function downloadVisualisation() {
  if (confirm("Download PNG file?")) {
    saveSvgAsPng(document.getElementById("worldMap"), "world_poverty_map_in_" + selectedYear + ".png");
  }
}

function redo() {
  if (redoStack.length <= 0) return;
  let state = redoStack.pop();
  setState(state);
  historyStack.push(state);
}

function undo() {
  // Pop the most recent item because that's our current state and we don't need that
  if (historyStack.length > 0) redoStack.push(historyStack.pop());

  // Deal with the case where the stack has been emptied
  if (historyStack.length == 0) {
    leftSidebar.innerHTML = "<h3>Click here, then select a country</h3>";
    rightSidebar.innerHTML = "<h3>Click here, then select a country</h3>";
    leftCountry = null;
    rightCountry = null;
  }
  // Do a normal undo to the previous state
  else {
    let state = historyStack[historyStack.length - 1];
    setState(state);
  }
}

function setState(state){
  if (state.leftCountry) {
    setSidebar("left", state.leftCountry);
    leftCountry = state.leftCountry;
  }
  else leftSidebar.innerHTML = "<h3>Click here, then select a country</h3>";

  if (state.rightCountry) {
    setSidebar("right", state.rightCountry);
    rightCountry = state.country
  }
  else rightSidebar.innerHTML = "<h3>Click here, then select a country</h3>";
}