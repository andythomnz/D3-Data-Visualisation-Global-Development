async function loadPovertyData() {
  const employedPovertyData = await d3.csv('https://raw.githubusercontent.com/Chin-Patel/Datasets/master/employed-population-below-poverty.csv');
  const proportionPovertyData = await d3.csv('https://raw.githubusercontent.com/Chin-Patel/Datasets/master/proportion-population-below-poverty.csv');

  let processedData = {};

  employedPovertyData.forEach(function (element, i) {
    let country = element[" GeoAreaName"];
    let year = element[" TimePeriod"];
    if (country == null || year == null) return; //remove the bad data
    //Check if year field exists
    if (processedData[year] == null) {
      processedData[year] = [];
    }
    //Check if country for a specific year exists
    if (processedData[year][country] == null) {
      processedData[year][country] = [];
    }
    //Add the item
    processedData[year][country].push(element);
  });


  proportionPovertyData.forEach(function (element, i) {
    let country = element[" GeoAreaName"];
    let year = element[" TimePeriod"];
    //Check if year field exists
    if (processedData[year] == null) {
      processedData[year] = [];
    }
    //Check if country for a specific year exists
    if (processedData[year][country] == null) {
      processedData[year][country] = [];
    }
    //We only need the total poverty value so create a new attribute that stores it
    processedData[year][country].totalPoverty = element[" Value"];
  });

  return processedData;
}





