PinsterApp.User = function() {

  var obj = {};

  //------------
  // Events
  //------------

  obj.addEvent = function (location, title, desc, category, img, address, username)
  {
      var EventObject = Parse.Object.extend("Event");
      var eventObject = new EventObject();

      eventObject.save({title:title, description:desc, location:location, address:address,
        category:category, imageURL:"", username:username, likes:0, deleteReqs:0, statusId:0}, {

        success:function(object)
        {
         // obj.postOnFacebook(title, desc, user);
          var language = PinsterApp.fields.currentLanguage;

          if (img != null)
          {
             var parseFile = new Parse.File(object.id + ".jpg", { base64:img }, "image/jpeg");
              
              parseFile.save().then(function()
              {
                 object.set("imageFile",parseFile);
                 object.save();
                 PinsterApp.closeReportModal();
                 PinsterApp.log(PinsterApp.fields.utils.getText("report_success", language));
                 PinsterApp.onDocumentReady();  // redraw map with new data
              },

              function(error)
              {
                  PinsterApp.closeReportModal();
                  PinsterApp.log(PinsterApp.fields.utils.getText("img_save_problem", language));
              });
          }
          else {
            PinsterApp.closeReportModal();
            PinsterApp.log(PinsterApp.fields.utils.getText("report_success", language));
            PinsterApp.onDocumentReady(); // redraw map with new data
          }

        },
        error:function(object,error) {
          PinsterApp.log(PinsterApp.fields.utils.getText("report_problem", PinsterApp.fields.currentLanguage));
        }
      });
  };

  // function removeEvent() ??

  obj.searchEvents = function (address, radius)
  {
    var results = [];
    // Remove previous search area
    PinsterApp.removeSearchArea();
    // Show a circle as the search area
    PinsterApp.showSearchArea(address, radius);
    // Remove circle on mouse click
    google.maps.event.addListener(PinsterApp.fields.searchArea, 'click', function(ev){
      PinsterApp.fields.searchArea.setMap(null);
    });

    var events = Parse.Object.extend("Event");
    //set query for events objectr
    var query = new Parse.Query(events);

    //check the events within the specify point to search from
    if (address != "")
      query.withinKilometers("location", address, radius);
    
    var searchCategory = PinsterApp.fields.currentSearchCategory;
    // Add category parameter
    if (searchCategory != undefined && searchCategory != "All")
      query.equalTo("category", searchCategory);

    // Don't load events with status id 99 (deleted)
    query.notEqualTo('statusId', 99);
    // Limit what could be a lot of points.
    // query.limit(100);
    // Final list of objects

    query.find({
      success: function(placesObjects) 
      {
        if (placesObjects.length > 0)
          obj.showSearchResults(placesObjects, false);
        else
          obj.showNoResults();

        clearInterval(PinsterApp.fields.aniMagnify);
        $("#quickSearchBtn").show();
        $("#eventsResults").show();
      },
      error: function(error)
      {
        console.log("SearchEvents: Failed to retreive events");
      }
    });
  };

  obj.searchLocalEvents = function(key)
  {
    if (key != "") {
      var results = [];
      PinsterApp.fields.markers.forEach(function(marker, index) {
        // Event title or description contains the keyword 
        if (marker.title.indexOf(key) > -1 || 
            marker.description.indexOf(key) > -1)
        {
          results.push(marker);
        }
      });

      if (results.length > 0) {
        obj.showSearchResults(results, true);
      }
      else {
        obj.showNoResults();
      }
    }
    else {
      obj.showNoResults();
    }

    clearInterval(PinsterApp.fields.aniMagnify);
    $("#quickSearchBtn").show();
    $("#eventsResults").show();

  }

  obj.showSearchResults = function(placesObjects, isLocalSearch)
  {
    var image, isFirst = "style='margin-top: 40px;'";
    console.log(placesObjects);
    
    $("#eventsResults").html('');
    $(".eventResRow").unbind();

    placesObjects.forEach(function(item, index){

      var eventId = item.id;
      var eventTitle = (isLocalSearch) ? item.title : item.attributes.title;
      var eventsCategory = (isLocalSearch) ? item.category : item.attributes.category;
      var eventLongitude = (isLocalSearch) ? item.position.B : item.attributes.location._longitude;
      var eventLatitude = (isLocalSearch) ? item.position.k : item.attributes.location._latitude;


      image = PinsterApp.CONSTANTS.pinImgs[eventsCategory];
      if (image == undefined) { image = PinsterApp.CONSTANTS.pinImgs["undefined"]; }

      if (index > 0) { isFirst = ""; }

      $("#eventsResults").append("<div class='eventResRow' " + isFirst + " eventId='" + eventId + "' lat=" + eventLatitude + 
        " long=" + eventLongitude + "><span><i class='glyphicon glyphicon-chevron-right'></i>" + eventTitle + "</span><img class='eventResRowPin' src='img/" + image + "' /></div>");
    });

    $(".eventResRow").click(function() {
      PinsterApp.removeSearchArea();
      PinsterApp.fields.currentWindow = "main";
      google.maps.event.trigger(PinsterApp.fields.eventsHashMap[$(this).attr("eventId")], 'click');
    });

    $(".eventResRowPin").click(function(e) {

      e.preventDefault();
      e.stopPropagation();

      var lat = $(this).parent().attr("lat");
      var lon = $(this).parent().attr("long");

      $("#eventsResults").hide();

      PinsterApp.fields.mapInstance.setCenter(new google.maps.LatLng(lat, lon));
      PinsterApp.fields.mapInstance.setZoom(18);
    });
      
  };

  obj.showNoResults = function()
  {
    var language = PinsterApp.fields.currentLanguage;
    var msg = PinsterApp.fields.utils.getText("no_results", language);
    $("#eventsResults").html('');
    $("#eventsResults").append("<div class='eventResRow' style='margin-top: 40px;'>" + msg + "...</div>");
  }

  //------------
  // User states
  //------------

  obj.userSignup = function(username, password)
  {
      var user = new Parse.User();
      user.set("username", username);
      user.set("password", password);

      user.signUp(null, {
        success: function(user)
        {
             obj.addUserToLocalstorage(username, user.id);
             PinsterApp.log("You are signed up (!)");
             $("#reportModal").modal();
        },
        error: function(user, error)
        {
          console.log("Error: " + error.code + " " + error.message);
          
          if(error.code == 202)
          {
            //scenario of returning user, with same username
            //do a login and check for password correctness...
            //if password does not match throw 101 code, (see at userLogin function)
            obj.userLogin(username, password);
          }

          else
          {
            PinsterApp.log("Something went wrong, try again");
          }
          
        }
      });
  };

  obj.userLogin = function(username, password)
  {
         Parse.User.logIn(username, password, {
        
          success: function(user)
          {
              console.log(user);
              obj.addUserToLocalstorage(username, user.id);
              $("#reportModal").modal();
          },
          error: function(user, error) {
             
             console.log("Error: " + error.code + " " + error.message);

             if(error.code == 101)
             {
                 PinsterApp.log("Your password was incorrect, please try again");
             }
          }
        });
  };

  obj.validateUserOnParse = function(username, password)
  {
      var tmpObj = obj.getPinsterUser();

      if ((tmpObj.username == "") && (tmpObj.id == ""))
      {
         obj.userSignup(username,password);
      }

      else
      {
         obj.userLogin(username,password);
      }

   };

  obj.getPinsterUser = function()
  {
    return JSON.parse(localStorage.getItem("pinsterUser"));
  };

  obj.addUserToLocalstorage = function(username, id)
  {
      PinsterApp.fields.isUserLoggedIn = true;
      var tmpObj = obj.getPinsterUser();
      tmpObj.username = username;
      tmpObj.id = id;
      localStorage.setItem("pinsterUser", JSON.stringify(tmpObj));
  };

  obj.checkUserOnStartup = function()
  {
    var tmpObj = obj.getPinsterUser();

      if (tmpObj != undefined)
      {
        if(tmpObj.username !="" && tmpObj.id != "")
        {
            var query = new Parse.Query(Parse.User);
            query.equalTo('objectId', tmpObj.id);
            query.find({
              success: function(user)
              {
                  PinsterApp.fields.isUserLoggedIn = true;
                  console.log(tmpObj.username + " is logged");
              },

              error : function(error)
              {
                console.log(error);
              }
            });        
        }
   }
 };
  //------------
  // Settings
  //------------

  obj.settings = {

    language: "עברית",
    address: "",
    category: "",
    radius: 1000,
    keyWords: "",

    setLanguage : function (language) {
      this.language = language;
      localStorage.setItem("pinsterSettings", JSON.stringify(this));
    },

    setAddress : function (address) {
      this.address = address;
      localStorage.setItem("pinsterSettings", JSON.stringify(this));
    },

    setCategory : function (category) {
      this.category = category;
      localStorage.setItem("pinsterSettings", JSON.stringify(this));
    },

    setRadius : function (radius) {
      this.radius = radius;
      localStorage.setItem("pinsterSettings", JSON.stringify(this));
    },

    setKeyWords : function (keyWords) {
      this.keyWords = keyWords;
      localStorage.setItem("pinsterSettings", JSON.stringify(this));
    },

    init : function() {

      var that = this;

      if (!localStorage.pinsterSearches || localStorage.pinsterSearches == 'undefined') {
        localStorage.setItem("pinsterSearches", JSON.stringify({
          eventsCategory: [],
          addresses: [],
        }));
      }


      if (!localStorage.pinsterUser || localStorage.pinsterUser == 'undefined') {
        localStorage.setItem("pinsterUser", JSON.stringify({
          username: "",
          id: "",
        }));
      }

      if (!localStorage.pinsterSettings || localStorage.pinsterSettings == 'undefined')
       {
        localStorage.setItem("pinsterSettings", JSON.stringify({
          language: "עברית",
          address: "",
          category: "All",
          radius: 1000,
          keyWords: ""
        }));
          
        $("#languageDropdownMenu").html('עברית<img src="img/Hebrew.png" style="width: 20px;" /><span class="caret caretRight"></span>');
        $("#settingsModal #address").val("Favorite Address");
        $("#dropdownMenu1").html('All<span class="caret caretRight"></span>');
        $('#radiusSlider').val(1000);
        PinsterApp.sliderOutputUpdate(1000);
      }


      // else 
      // {
      //   var tmpObj = JSON.parse(localStorage.getItem("pinsterSettings"));
      //   PinsterApp.fields.currentLanguage = tmpObj.language;
      //   that.language = tmpObj.language;
      //   that.address = tmpObj.address;
      //   that.category = tmpObj.category;
      //   that.radius = tmpObj.radius;

      //   var languageImg = "English";
      //   if (tmpObj.language == "עברית") { languageImg = "Hebrew"; }

      //   $("#languageDropdownMenu").html(that.language + "<img src='img/" + languageImg + ".png' style='width: 20px; left: 6px; position: absolute; top: 9px;' /><span class='caret caretRight'></span>");
      //   $("#settingsModal #address").val(that.address);
      //   $("#dropdownMenu1").html(that.category + '<span class="caret caretRight"></span>');
      //   $('#radiusSlider').val(that.radius);
      //   PinsterApp.sliderOutputUpdate(that.radius);
      //   that.setSettingsDefaults();
      
     
      else
      {
        try {
          var tmpObj = JSON.parse(localStorage.getItem("pinsterSettings"));
          PinsterApp.fields.currentLanguage = tmpObj.language;
          that.language = tmpObj.language;
          that.address = tmpObj.address;
          that.category = tmpObj.category;
          that.radius = tmpObj.radius;
          that.keyWords = tmpObj.keyWords

          var languageImg = "English";
          if (tmpObj.language == "עברית") { languageImg = "Hebrew"; }

          $("#languageDropdownMenu").html(that.language + "<img src='img/" + languageImg + ".png' style='width: 20px; left: 6px; position: absolute; top: 9px;' /><span class='caret caretRight'></span>");
          $("#settingsModal #address").val(that.address);
          $("#dropdownMenu1").html(that.category + '<span class="caret caretRight"></span>');
          $('#radiusSlider').val(that.radius);
          $('#keyWords').val(that.keyWords);
          PinsterApp.sliderOutputUpdate(that.radius);
        }
        catch (err) {
          that.setSettingsDefaults();
        }
      }
    },

    setSettingsDefaults : function()
    {
      localStorage.setItem("pinsterSettings", JSON.stringify({
        language: "עברית",
        address: "",
        category: "All",
        radius: 1000
      }));

      $("#languageDropdownMenu").html('עברית<img src="img/Hebrew.png" style="width: 20px;" /><span class="caret caretRight"></span>');
      $("#settingsModal #address").val("Favorite Address");
      $("#dropdownMenu1").html('All<span class="caret caretRight"></span>');
      $('#radiusSlider').val(1000);
      PinsterApp.sliderOutputUpdate(1000);
    }

  };

  //-------------
  // Search Data
  //-------------

  obj.searchData = {

    addSearchData : function(location, category) {

      var currentUserId = Parse.User.current().get("userId");
      
      var SearchDataObject = Parse.Object.extend("SearchData");
      var searchDataObject = new SearchDataObject();

      searchDataObject.save({userId:currentUserId, location:location, category:category}, {
        
        success:function(object) {
          console.log("Search data saved");
        },
        error:function(object,error) {
          console.log(error);
          PinsterApp.log("Sorry, I couldn't save it.");
        }

      });

    },

    getSmartRandomEvent : function() {

      var history = localStorage.getItem("pinsterSearches");

      if (history == 'undefined' || 
          PinsterApp.fields.randomEventCounter > PinsterApp.CONSTANTS.MAX_RANDOM_EVENTS)
      {
        console.log("getRecommendedEvent: No search history or exceeded max random tries");
        obj.getRandomEvent();
        return;
      }

      var params = {};
      params["data"] = JSON.parse(history);

      PinsterApp.fields.isFetchingRandomEvent = true;

      var deg = 0;
      PinsterApp.fields.rotateDice = setInterval(function() {
        deg += 10;
        $(".diceIcon").css("transform", "rotate(" + (deg) + "deg)");
      }, 50);

      // Call cloud function
      Parse.Cloud.run('getRecommendedEvent', params, {

        success: function(results) {

          if (results == undefined)
          {
            console.log("getRecommendedEvent: returned undefined result");
            PinsterApp.fields.isFetchingRandomEvent = false;
            clearInterval(PinsterApp.fields.rotateDice);
            $(".diceIcon").css("transform", "rotate(0deg)");
            PinsterApp.fields.user.searchData.getSmartRandomEvent();
            return;
          }

          obj.showEvent(JSON.parse(results).objectId);
        },

        error: function(error) {
          PinsterApp.fields.isFetchingRandomEvent = false;
          clearInterval(PinsterApp.fields.rotateDice);
          $(".diceIcon").css("transform", "rotate(0deg)");
          console.log(error);
          PinsterApp.fields.user.searchData.getSmartRandomEvent();
        }
      });

    }

  // End of SearchData
  };

  obj.getRandomEvent = function() {

    PinsterApp.fields.randomEventCounter--;
    var randomNum = Math.floor((Math.random() * PinsterApp.fields.markers.length - 1) + 0);
    obj.showEvent(PinsterApp.fields.markers[randomNum].id);

  };

  obj.showEvent = function(eventId) {

    PinsterApp.fields.isFetchingRandomEvent = false;
    clearInterval(PinsterApp.fields.rotateDice);
    $(".diceIcon").css("transform", "rotate(0deg)");
    
    // Animate the selected event marker
    PinsterApp.fields.markers.forEach(function(marker, index) {

      if (marker.id == eventId)
      {
        // Focus on the selected event
        PinsterApp.fields.mapInstance.setCenter(marker.position);

        if (marker.getAnimation() != null) {
          marker.setAnimation(null);
        } else {
          marker.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(function() {
            marker.setAnimation(null);
            google.maps.event.trigger(PinsterApp.fields.eventsHashMap[eventId], 'click');
          }, 2000);
        }
      }
    });

  };

  obj.animateZoomIn = function(currentZoom)
  {
    PinsterApp.fields.mapInstance.setZoom(currentZoom);

    if (currentZoom < 18)
    {
        setTimeout(function() {
            obj.animateZoomIn(currentZoom + 2);
        }, 400);
    }
  };

  return obj;

};