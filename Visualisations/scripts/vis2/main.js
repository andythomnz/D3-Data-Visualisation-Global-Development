let visDiv, svg, svgWidth, svgHeight
let lastEvent;
let tooltip;
var selectedYear = 2009;
var waterData;
var rightCountry;

var historyStack = [];
var redoStack = [];

/********* Country Circle Variables *********/
let nodes;

let allContinents = {
  0: { name: "Africa", visible: true },
  1: { name: "Asia", visible: true },
  2: { name: "Europe", visible: true },
  3: { name: "North America", visible: true },
  4: { name: "Oceania", visible: true },
  5: { name: "South America", visible: true }
};

let circles;                                        // All the circles representing the countries
let simulation;                                     // D3 force simulation
let circleCanvas;                                   // SVG Group object that contains the country circles

const z = d3.scaleOrdinal(d3.schemeCategory10);     // Function to determine colour of circle based on cluster number
let clusters;                                       // Stores the node with the largest radius for every cluster
let maxRadius = 60;

window.addEventListener('load', function () {
  visDiv = document.getElementById("vis");
  svg = d3.select(vis).append("svg");
  svg.attr("id", "worldMap");
  circleCanvas = svg.append("g");
  svgWidth = +svg.attr("width");
  svgHeight = +svg.attr("height");

  initializeSlider();

  // Load data
  var promises = [
    loadWaterData().then((data) => { waterData = data })
  ]

  Promise.all(promises).then(ready);

  function ready() {
    // Setup toolbar buttons
    document.getElementById("download").onclick = downloadVisualisation;
    document.getElementById("undo").onclick = undo;
    document.getElementById("redo").onclick = redo;

    setLeftSidebar();

    redraw();

    // Add event listeners to redraw when appropriate
    window.addEventListener("resize", redraw);                                // On window resize
    document.getElementById("yearSlider").addEventListener("input", redraw)   // On change to year slider
  }

  // Mouse pan and zoom
  svg.call(d3.zoom()
    .extent([[0, 0], [svgWidth, svgHeight]])
    .scaleExtent([1, 8])
    .on("zoom", zoomed)
  ).on("dblclick.zoom", null);

  function zoomed() {
    const transform = d3.event.transform;
    lastEvent = transform + "translate(" + svgWidth / 2 + "," + svgHeight / 2 + ")";
    circleCanvas.attr("transform", lastEvent);
  }
})

/**
 * Uses the parsed waterData to generate nodes in the format
 * expected by the visualisation. Each node represents one
 * country and one circle in the visualisation. Nodes sharing
 * a cluser-index are countries belonging to the same continent.
 * The radius of the node is set to half the data value for the
 * country, so they fit on the screen.
 */
function generateNodes() {
  let visualisationData = waterData[selectedYear];
  let numContinents = 6;                                          // (Our data doesn't consider Antarctica)
  nodes = [];
  clusters = new Array(numContinents);

  let clusterIndexes = {
    "Asia": 0,
    "Europe": 1,
    "Africa": 2,
    "Oceania": 3,
    "North America": 4,
    "South America": 5
  }

  for (const [continentName, countryData] of Object.entries(visualisationData)) {
    let i = clusterIndexes[continentName];
    if (allContinents[i].visible) {
      for (let j = 0; j < Object.keys(countryData).length; j++) { // Iterate over countries in that continent
        const nodePosition = determineCirclePosition(i);
        let node = {
          cluster: i,                                             // Continent
          r: parseFloat(Object.values(countryData)[j]) / 2,       // Add that country's value as node radius
          total: parseFloat(Object.values(countryData)[j]),
          country: Object.keys(countryData)[j],
          continent: continentName,
          x: nodePosition.x,
          y: nodePosition.y,
        };
        nodes.push(node);
        if (!clusters[i] || ((parseFloat(Object.values(countryData)[j]) / 2) > clusters[i].r)) clusters[i] = node;
      }
    }
  }
  return nodes;
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

/**
 * Adds a card with checkbox to the left sidebar for each
 * continent. By default, each continent is preselected.
 * Deselecting a continent removes the data for that
 * continent from the visualisation.
 */
function setLeftSidebar() {
  let continentPanel = document.getElementById("continent-selection-panel");

  // Go through all continents and add a card with a checkbox
  let continentIndexes = {
    0: "Asia",
    1: "Europe",
    2: "Africa",
    3: "Oceania",
    4: "North America",
    5: "South America"
  };

  let cardsHTML = "";
  let cards = {};
  for (let i = 0; i < 6; i++) {
    let checkboxID = continentIndexes[i];
    checkboxID = checkboxID.replace(/\s/g, '');
    checkboxID = checkboxID.toLowerCase();
    let continentName = Object.values(continentIndexes)[i];

    cards[continentName] = `
      <div class="card">
          <div class="card-container">
              <b>${Object.values(continentIndexes)[i]}</b>
              <div class="inline"><input id="checkbox-${checkboxID}" type="checkbox" name="continent${i}" value="${continentName}" onclick="filterChanged(this)"></div>
          </div>
      </div>
      `;
  }

  cardsHTML += cards["Africa"];
  cardsHTML += cards["Asia"];
  cardsHTML += cards["Europe"];
  cardsHTML += cards["North America"];
  cardsHTML += cards["Oceania"];
  cardsHTML += cards["South America"];

  continentPanel.innerHTML = cardsHTML;

  // Initialise all checkboxes to checked state
  document.getElementById("checkbox-africa").checked = true;
  document.getElementById("checkbox-asia").checked = true;
  document.getElementById("checkbox-europe").checked = true;
  document.getElementById("checkbox-northamerica").checked = true;
  document.getElementById("checkbox-oceania").checked = true;
  document.getElementById("checkbox-southamerica").checked = true;
}

/**
 * Called when the user (de-)selects a continent
 * checkbox in the left sidebar. Adjusts the data
 * filter accordingly and redraws the visualisation.
 * @param {*} checkbox  The checbox item which was changed
 */
function filterChanged(checkbox) {
  let isChecked = checkbox.checked;
  let continentNumber = checkbox.attributes.name.nodeValue.slice(-1);
  allContinents[continentNumber].visible = isChecked;
  redraw();
}

function tooltipText(d) {
  const countryName = d.country;
  let povertyPercentageText;// = d.total;

  if (d.total === undefined) {
    povertyPercentageText = "No Data Available </br>For This Year"
  } else {
    povertyPercentageText = `Proportion of Population </br> Without Access to Basic </br> Drinking Services: ${d.total}%`;
  }
  return `<b>${countryName}</b><br/>
    ${povertyPercentageText}`;
}

function downloadVisualisation() {
  if(rightCountry == null) {
    confirm("No Data to Export\nPlease Select Some Data First");
    return;
  }
  if (confirm(`Download ${rightCountry} Data?`)) {
     let csvRows = [
       //header
       ["continent", "country", "value"]
     ]
     for (const [continent, countries] of Object.entries(waterData[selectedYear])) {
       for (const [countryName, countryValue] of Object.entries(countries)) {
           if(filterLessThan === true){
               if(+countryValue < +currentPercent){
                 csvRows.push([continent, countryName, +countryValue]);
               }
           }
           if(filterLessThan === false){
               if(+countryValue > +currentPercent){
                 csvRows.push([continent, countryName, +countryValue]);
               }
           }
       }
   }
   exportToCsv(`${rightCountry}-${selectedYear}-data-export.csv`, csvRows);
  }

 }

 //Used: https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
 function exportToCsv(filename, rows) {
   var processRow = function (row) {
       var finalVal = '';
       for (var j = 0; j < row.length; j++) {
           var innerValue = row[j] === null ? '' : row[j].toString();
           if (row[j] instanceof Date) {
               innerValue = row[j].toLocaleString();
           };
           var result = innerValue.replace(/"/g, '""');
           if (result.search(/("|,|\n)/g) >= 0)
               result = '"' + result + '"';
           if (j > 0)
               finalVal += ',';
           finalVal += result;
       }
       return finalVal + '\n';
   };

   var csvFile = '';
   for (var i = 0; i < rows.length; i++) {
       csvFile += processRow(rows[i]);
   }

   var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
   if (navigator.msSaveBlob) { // IE 10+
       navigator.msSaveBlob(blob, filename);
   } else {
       var link = document.createElement("a");
       if (link.download !== undefined) { // feature detection
           // Browsers that support HTML5 download attribute
           var url = URL.createObjectURL(blob);
           link.setAttribute("href", url);
           link.setAttribute("download", filename);
           link.style.visibility = 'hidden';
           document.body.appendChild(link);
           link.click();
           document.body.removeChild(link);
       }
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
    document.getElementById("right-sidebar-header").innerHTML = "<h3>Select a country</h3>";
    document.getElementById("right-sidebar-body").innerHTML = "";
    rightCountry = null;
  }
  // Do a normal undo to the previous state
  else {
    let state = historyStack[historyStack.length - 1];
    setState(state);
  }
}

function setState(state) {
  filterLessThan = state.filterLessThan;
  setSidebar(state.country);
}

/****************** Force Simulation *********************/

function clustering(alpha) {
  nodes.forEach(function (d) {
    var cluster = clusters[d.cluster];
    if (cluster === d) return;
    var x = d.x - cluster.x,
      y = d.y - cluster.y,
      l = Math.sqrt(x * x + y * y),
      r = d.r + cluster.r;
    if (l !== r) {
      l = (l - r) / l * (alpha * alpha);
      d.x -= x *= l;
      d.y -= y *= l;
      cluster.x += x;
      cluster.y += y;
    }
  });
}

/**
 * One simulation tick
 */
function ticked() {
  circles
    .attr('cx', (d) => d.x)
    .attr('cy', (d) => d.y);
}

function dragStarted(d, i) {
  if (!d3.event.active) simulation.alphaTarget(.03).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragEnded(d) {
  if (!d3.event.active) simulation.alphaTarget(.03);
  d.fx = null;
  d.fy = null;
}


function redraw() {
  // Extract the width and height that was computed by CSS.
  svgWidth = visDiv.clientWidth;
  svgHeight = visDiv.clientHeight;

  // Use the extracted size to set the size of the SVG element.
  svg
    .attr("width", svgWidth)
    .attr("height", svgHeight);


  /******  TOOLTIP  *******/
  tooltip = d3.select("#vis")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  /******  SIDEBARS *******/
  if (rightCountry != null) {
    setSidebar(rightCountry);
  }

  /****** COUNTRY CIRCLES *******/
  circleCanvas.remove();
  circleCanvas = svg.append('g').attr("transform", "translate(" + svgWidth / 2 + "," + svgHeight / 2 + ")");

  generateNodes()

  circles = circleCanvas.datum(nodes)
    .selectAll('.circle')
    .data(d => d)
    .enter().append('circle')
    .attr('fill', (d) => z(d.cluster))
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .attr('class', 'Country')
    .attr('cx', (d) => d.x)
    .attr('cy', (d) => d.y)
    .call(d3.drag() // Call specific function when circle is dragged
      .on("start", function (d, i) { dragStarted(d, i); })
      .on("drag", dragged)
      .on("end", dragEnded))
    .on("mouseover", mouseOver)
    .on("mouseout", mouseLeave)
    .on("click", mouseClick)

  circles.transition()
    .duration(500)
    .delay(function(d, i) { return i * 5; })
    .attrTween("r", function(d) {
      var i = d3.interpolate(0, d.r);
      return function(t) { return d.r = i(t); };
    });

  simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .force("x", d3.forceX().strength(.0005))
    .force("y", d3.forceY().strength(.0005))
    .force("center", d3.forceCenter())
    .force("charge", d3.forceManyBody().strength(0.2)) // Nodes are attracted one each other if value is > 0
    .force("collide", d3.forceCollide().radius(function(d) {
      return d.r
    }).strength(0.2))
    .force("cluster", clustering)

    simulation.nodes(nodes)
    .on("tick", ticked);

    if (lastEvent !== undefined) {
      // circles.attr("transform", lastEvent + "translate(" + svgWidth / 2 + "," + svgHeight / 2 + ")");
      circleCanvas.attr("transform", lastEvent);
    }
}

function mouseOver(d) {
  // Tool tip appears
  tooltip.transition()
    .duration(70)
    .style("opacity", .9);

  // Set the tooltip's text and styling
  tooltip.html(tooltipText(d))
    .style("left", d3.event.pageX + "px")
    .style("top", d3.event.pageY + "px");
}

function mouseLeave(d) {
  tooltip.transition()
    .duration(80)
    .style("opacity", 0);
}

function mouseClick(d) {
  rightCountry = d.country;
  setSidebar(rightCountry);
  historyStack.push({ country: rightCountry, filterLessThan });
  redoStack = [];
}

function determineCirclePosition(clusterNumber) {
  const totalNumClusters = Object.keys(allContinents).length;

  const x = Math.cos(clusterNumber / totalNumClusters * 2 * Math.PI) * 150 - svgWidth / 15 + (Math.random() * 50);
  const y = Math.sin(clusterNumber / totalNumClusters * 2 * Math.PI) * 150 - svgHeight / 15 + (Math.random() * 50)

  return {
    x: x,
    y: y,
  };
}