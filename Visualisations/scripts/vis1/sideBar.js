function setSidebar(side, countryName) {
  let id = side.toLowerCase() == "left" ? "left-sidebar" : "right-sidebar";
  var sidebar = document.getElementById(id);

  // Find the data coresponding to that country name for the current year
  var country = povertyData[selectedYear][countryMapper[countryName]];

  // If there is no data for the country, tell the user that, and ignore the rest of this method
  if (country == null) {
    sidebar.innerHTML = `<h3>No Data Available for ${countryName} in ${selectedYear}</h3>`;
    return;
  }

  var maleData = [];
  var femaleData = [];
  // Store poverty value for each gender where each array index store different age range
  country.forEach((e) => {
    if (e["[Sex]"].toLowerCase() == "male") {
      switch (e["[Age]"].toLowerCase()) {
        case "15+":
          maleData[0] = e[" Value"];
          break;
        case "15-24":
          maleData[1] = e[" Value"];
          break;
        case "25+":
          maleData[2] = e[" Value"];
          break;

        default:
          break;
      }
    }
    if (e["[Sex]"].toLowerCase() == "female") {
      switch (e["[Age]"].toLowerCase()) {
        case "15+":
          femaleData[0] = e[" Value"];
          break;
        case "15-24":
          femaleData[1] = e[" Value"];
          break;
        case "25+":
          femaleData[2] = e[" Value"];
          break;

        default:
          break;
      }
    }
  });
  sidebar.innerHTML = prettyPrintData(countryName, maleData, femaleData, country.totalPoverty);
}

function prettyPrintData(countryName, maleData, femaleData, totalPoverty) {
  let output = "";
  output += formatTotalPoverty(countryName, totalPoverty);
  output += formatEmployedPovery(maleData, femaleData);
  return output;
}

function formatTotalPoverty(countryName, totalPoverty) {
  let output = `
        <div class="sidebarContainer">
        <center><h1>${countryName}</h1></center>
        Proportion of population below the international poverty line:
    `;
  if (totalPoverty == null) return output += '<b>unavailable</b>';
  return output += `<b>${totalPoverty}%</b>`;
}

function formatEmployedPovery(maleData, femaleData) {
  if (maleData.length === 0 || femaleData.length === 0) return "";
  return `
        <br>
        <br>
        Employed population below the international poverty line by sex and age:
        <br>
        <br>
        <table class="tg">
        <tr>
        <th class="td-center"><b>Age</b></th>
        <th class="td-center"><b>Male</b></th>
        <th class="td-center"><b>Female</b></th>
        </tr>
        <tr>
        <td class="td-center">15+</td>
        <td class="td-center">${maleData[0]}%</td>
        <td class="td-center">${femaleData[0]}%</td>
        </tr>
        <tr>
        <td class="td-center">15-24</td>
        <td class="td-center">${maleData[1]}%</td>
        <td class="td-center">${femaleData[1]}%</td>
        </tr>
        <tr>
        <td class="td-center">25+</td>
        <td class="td-center">${maleData[2]}%</td>
        <td class="td-center">${femaleData[2]}%</td>
        </tr>
        </table>
    </div>
  `;
}