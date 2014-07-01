Parse.Cloud.define("getRecommendedEvent", function(request, response) {

	var categories = new Array();
	var addresses = new Array();

	var data = request.params.data;

	// Number each category and the times it has been searched
	data.eventsCategory.forEach(function(item, index) {
	if (!categories.hasOwnProperty(item))
	{
	  categories.push({key: item});
	  categories[item] = 0;
	}
	categories[item]++;
	});

	// Sort from most searched category to least
	categories.sort(function(a, b) {
	  a = categories[a.key];
	  b = categories[b.key];

	  return a > b ? -1 : (a < b ? 1 : 0);
	});

	// Number each address and the times it has been searched
	data.addresses.forEach(function(item, index) {
	if (!addresses.hasOwnProperty(item))
	{
	  addresses.push({key: item});
	  addresses[item] = 0;
	}
	addresses[item]++;
	});

	// Sort from most searched addresses to least
	addresses.sort(function(a, b) {
	  a = addresses[a.key];
	  b = addresses[b.key];

	  return a > b ? -1 : (a < b ? 1 : 0);
	});

	// Get one of the top 3 searched categories
	var randomNum = Math.floor((Math.random() * 3) + 1);
	var searchCategory = categories[randomNum - 1].key;

	// Get one of the top 3 searched addresses
	randomNum = Math.floor((Math.random() * 3) + 1);
	var searchAddress = addresses[randomNum - 1].key;


	var events = Parse.Object.extend("Event");
	//set query for events objectr
	var query = new Parse.Query(events);

	//check the events within the specify point to search from
	if (searchAddress != "")
	query.withinKilometers("location", searchAddress, 10000);

	// Add category parameter
	if (searchCategory != undefined && searchCategory != "All")
	query.equalTo("category", searchCategory);

	query.find
	({
		success: function(results)
		{
			if (results.length > 0) 
            {
            	// Sort events to get the event 
            	// with the highest number of likes 
			  	results.sort(function(a, b) {
            		return (b._serverData.likes - a._serverData.likes);
          		});

				// Return the event object       
                response.success(JSON.stringify(results[0]));
            }
		}
	});

});
