var countryName;
var currentPercent;
var sidebarBody;
var filterLessThan = false;
var toggle;

/*
  Fill the right sidebar with information about the country with name "cName"
*/
function setSidebar(cName) {
  countryName = cName;
  sidebarBody = document.getElementById("right-sidebar-body");

  // Find the proportion for the provided country - this is what we will compare the other countries against
  currentPercent = waterData[selectedYear]
  [continentMapper[countryName]]
  [countryName];

  // HTML for the text at the top of the sidebar before the cards begin
  let sidebarHeading = `
    <center><h1>${countryName}</h1></center>
    <center><h3>${currentPercent}% of population does not have access to clean drinking water</h3></center>`
    + appendToggle(countryName)
    + "<br>";

  document.getElementById("right-sidebar-header").innerHTML = sidebarHeading;

  // This has to happen here because the toggle doesnt exist before now
  toggle = document.getElementById("toggle");

  addCards();
}

/*
  Populate the sidebard with a list of cards based on the value of "filterLessThan"
  Show cards with a value less than currentPercent if filterLessThan is true
  Otherwise show cards with a value greater than currentPercent
*/
function addCards() {
  let cardHTML = "";
  for (const [continent, countries] of Object.entries(waterData[selectedYear])) {
    let headerMade = false;
    for (const [countryName, countryValue] of Object.entries(countries)) {
      if (filterLessThan === true) {
        if (+countryValue < +currentPercent) {
          if (!headerMade) {
            cardHTML += makeHeadingCard(continent)
            headerMade = true;
          }
          cardHTML += makeCard(countryName, countryValue);
        }
      }
      if (filterLessThan === false) {
        if (+countryValue > +currentPercent) {
          if (!headerMade) {
            cardHTML += makeHeadingCard(continent)
            headerMade = true;
          }
          cardHTML += makeCard(countryName, countryValue);
        }
      }
    }
    // After going through every country for a continent, set headerMade to false to create new continent header
    headerMade = false;
  }
  sidebarBody.innerHTML = cardHTML;
}

function toggleToggle() {
  // True = "<" than current country
  // False = ">" than current country
  filterLessThan = toggle.checked;
  historyStack.push({ country: rightCountry, filterLessThan });
  addCards();
}

function appendToggle(name) {
  let checkedOrNot = filterLessThan ? "checked" : "";
  return `
    <br>
    <div class="rightBarInstructions">
    <div>Show me other countries with</div>

    <div class="toggleParent">
        <div class="inlineBlock"><b>Worse</b></div>
        <div class="switchHolder">
            <label class="switch">
                <input type="checkbox" id="toggle" onclick="toggleToggle()" ${checkedOrNot}>
                <span class="toggler round"></span>
            </label>
        </div>
        <div class="inlineBlock"><b>Better</b></div>
    </div>

    <div>access to clean drinking water compared to ${name}:</div>
    </div>
    `;
}

function makeCard(country, value) {
  return `
    <div class="card">
        <div class="card-container">
            <div class="cardTitle">
                <b>${country}</b>
            </div>
            <div class="cardValue">
                <span>${value} %</span>
            </div>
        </div>
    </div>
    `;
}

function makeHeadingCard(name) {
  return `
    <div class="headingCard">
        <div class="headingContainer">
            <h2>${name}</h2>
        </div>
    </div>
    `;
}