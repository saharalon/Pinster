PinsterApp.Utils = function() {

  var obj = {};

  //------------
  // Events
  //------------

  obj.initCategories = function(callback)
  {
    // Retreive events from the databas
    var Category = Parse.Object.extend("Category");
    var query = new Parse.Query(Category);

    query.find({
      
      success: function(results) {

        results.forEach(function(item, index) {

          var category = item._serverData.category;
          var imagePath = item._serverData.imagePath;

          if (category != "undefined")
            PinsterApp.CONSTANTS.categories.push(category);

          PinsterApp.CONSTANTS.pinImgs[category] = imagePath;

        });

        callback();

      },
      error: function(object, error) {
        // The object was not retrieved successfully.
        // error is a Parse.Error with an error code and description.
        PinsterApp.log("Failed to retreive categories from the database");

        callback();
      }

    });

  };

  obj.setAppLanguage = function (language)
  {
  	$("#quickSearch").attr("placeholder", obj.getText("quickSearch", language));
  	$("#takeMeThereBtn").text(obj.getText("takeMeThereBtn", language));
  	$("#hyperlapseBtn").text(obj.getText("hyperlapseBtn", language));
  	  
  	// Login
  	$("#loginHeadline").text(obj.getText("loginHeadline", language));
  	$("#pinUsername").attr("placeholder", obj.getText("pinUsername", language));
  	$("#pinPassword").attr("placeholder", obj.getText("pinPassword", language));
  	$("#loginBtnModal").text(obj.getText("loginBtnModal", language));

  	// Settings
  	$("#settingsHedline").text(obj.getText("settingsHedline", language));

  	if ($("#languageDropdownMenu").attr("placeholder") == undefined)
  		$("#languageDropdownMenu").attr("placeholder", obj.getText("languageDropdownMenu", language));

  	if ($("#address").attr("placeholder") == undefined)
  		$("#address").attr("placeholder", obj.getText("address", language));
  	  
  	$("#settingsSaveBtn").text(obj.getText("settingsSaveBtn", language));

  	// Report
  	$("#reportHeadline").text(obj.getText("reportHeadline", language));
  	$("#addressDiv").text(obj.getText("addressDiv", language));
  	$("#dropdownMenu2").text(obj.getText("dropdownMenu2", language));
  	$("#eventTitle").attr("placeholder", obj.getText("eventTitle", language));
  	$("#eventDescription").attr("placeholder", obj.getText("eventDescription", language));
  	$("#reportBtnModal").text(obj.getText("reportBtnModal", language));

    $("#searchTipText").text(obj.getText("searchTipText", language));

  	// Trigger the slider text change
  	PinsterApp.sliderOutputUpdate($("#radiusSlider").val());
  };

  obj.getText = function (name, language)
  {
  	switch (name)
  	{
  		case "quickSearch":
  			return (language == "English") ? "Enter an address..." : "...הקלד כתובת לחיפוש";
      case "searchTipText":
        return (language == "English") ? "And / or filter by category" : "ו / או סנן ע״פ קטגוריה";
  		case "takeMeThereBtn":
  			return (language == "English") ? "Take me there" : "קח אותי לשם";
  		case "hyperlapseBtn":
  			return (language == "English") ? "Simulate" : "סימולציה";
  		case "loginHeadline": 
  			return (language == "English") ? "Login" : "התחבר";
  		case "pinUsername":
  			return (language == "English") ? "Username" : "שם משתמש";
  		case "pinPassword":
  			return (language == "English") ? "Password" : "סיסמה";
  		case "loginBtnModal":
  			return (language == "English") ? "Login" : "התחבר";
  		case "settingsHedline":
  			return (language == "English") ? "Settings" : "הגדרות";
  		case "languageDropdownMenu":
  			return (language == "English") ? "Select Language" : "בחר שפה";
  		case "address":
  			return (language == "English") ? "Favourite Address" : "כתובת מועדפת";
  		case "settingsSaveBtn":
  			return (language == "English") ? "Save" : "שמור";
  		case "reportHeadline":
  			return (language == "English") ? "Report an event" : "דווח אירוע";
  		case "addressDiv":
  			return (language == "English") ? "Address:" : ":דווח";
  		case "dropdownMenu2":
  			return (language == "English") ? "Please select a category" : "אנא בחר קטגוריה";
  		case "eventTitle":
  			return (language == "English") ? "Event title" : "כותרת האירוע";
  		case "eventDescription":
  			return (language == "English") ? "Event description" : "תיאור האירוע";
  		case "reportBtnModal":
  			return (language == "English") ? "Report" : "דווח";
  		case "fsq-content-search":
  			return (language == "English") ? "Searching for comments..." : "מחפש תגובות...";
  		case "fsq-content-not-found":
  			return (language == "English") ? "No comments in this area" : "לא נמצאו תגובות לאיזור זה";
  		case "no_results":
  			return (language == "English") ? "No results were found" : "לא נמצאו תוצאות מתאימות";
  		case "radius":
  			return (language == "English") ? "Radius is: " : "רדיוס: ";
  		case "meters":
  			return (language == "English") ? " Meters" : " מטרים";
  		case "kilometers":
  			return (language == "English") ? " Kilometers" : " קילומטרים";

  		default:
  			return ""; 
  	}
  };  

  return obj;

};