async function loadWaterData() {
  const waterData = await d3.csv('https://raw.githubusercontent.com/Chin-Patel/Datasets/master/Water_data.csv');
  let years = [];
  let processedData = {};
  //populate the data structure with predefined years
  for (let i = 2000; i < 2018; i++) {
    years.push(i);
    processedData[i] = [];
  }

  waterData.forEach(function (element, i) {
    let country = element["GeoAreaName"].replace(/"/g, "");
    let continent = continentMapper[country];

    //Get rid of undefined continenets
    if (continent == null) return;

    //We only want "AllAREA"
    if (element["[Location]"] !== '"ALLAREA"') return;

    //Check if continent exists (if not then make it exist)
    years.forEach(function (year, index) {
      if (processedData[year][continent] == null) {
        processedData[year][continent] = [];
      }
    });

    //Add the country to the continent
    years.forEach(function (year, index) {
      let accessToWater = element[year];
      // Remove any countries that dont have any data
      if (isEmpty(accessToWater)) return;
      // Change the clean water percentage to store the percentage that DONT have clean water
      const max = parseFloat(100);
      let inverse = (max - parseFloat(accessToWater));
      processedData[year][continent][country] = inverse.toFixed(2);
    });
  });
  return processedData;
}

//For checking if a string is empty, null or undefined
function isEmpty(str) {
  return (!str || 0 === str.length);
}



