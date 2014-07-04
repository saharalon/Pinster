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
    
    var searchCategory = PinsterApp.currentSearchCategory;
    // Add category parameter
    if (searchCategory != undefined && searchCategory != "All")
      query.equalTo("category", searchCategory);

    // var currentTime = new Date();
    // // Subtract one day from today's time to search
    // // only events that had been updated at the last 24 hours
    // currentTime.setDate(currentTime.getDate() - 1);
    // var time = new Date(currentTime.getTime());
    // query.greaterThanOrEqualTo('updatedAt', time);

    // Don't load events with status id 99 (deleted)
    query.notEqualTo('statusId', 99);
    // Limit what could be a lot of points.
    query.limit(10);
    // Final list of objects

    query.find({
        success: function(placesObjects) {

          var image, isFirst = "style='margin-top: 40px;'";
          console.log(placesObjects);
          
          $("#eventsResults").html('');
          $(".eventResRow").unbind();

          placesObjects.forEach(function(item, index){

            image = PinsterApp.CONSTANTS.pinImgs[item.attributes.category];
            if (image == undefined) { image = PinsterApp.CONSTANTS.pinImgs["undefined"]; }

            if (index > 0) { isFirst = ""; }

            $("#eventsResults").append("<div class='eventResRow' " + isFirst + " eventId='" + item.id + "' lat=" + item.attributes.location._latitude + 
              " long=" + item.attributes.location._longitude + "><span><i class='glyphicon glyphicon-chevron-right'></i>" + item.attributes.title + "</span><img class='eventResRowPin' src='img/" + image + "' /></div>");
          });

          if (placesObjects.length != 0) {
            
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
            
          }
          else {
            var language = PinsterApp.fields.currentLanguage;
            var msg = (language == "English") ? "No results were found" : "לא נמצאו תוצאות מתאימות";
            $("#eventsResults").html('');
            $("#eventsResults").append("<div class='eventResRow' style='margin-top: 40px;'>" + msg + "...</div>");
          }

          clearInterval(PinsterApp.fields.aniMagnify);
          $("#quickSearchBtn").show();
          $("#eventsResults").show();


          /*if (this.isUserLoggedIn()) {
            searchData.addSearchData(address, searchCategory);
          }*/
        }
      });
  };


  //------------
  // User states
  //------------

  obj.userSignup = function(username, password)
  {
      var user = new Parse.User();
      user.set("username", username);
      user.set("password", password);

      user.signUp(null, {
        success: function(user) {
             obj.addUserToLocalstorage(username, user.id);
        },
        error: function(user, error) {
          // Show the error message somewhere and let the user try again.
          console.log("Error: " + error.code + " " + error.message);

          //if user is already on parse User class, do login action instead
          if(error.code == 202)
          {
            obj.userLogin(username, password);
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
          },
          error: function(user, error) {
            

             if(error.code == 101)
             {
                obj.userSignup(username, password);
             }
          }
        });
  };

  obj.validateUserOnParse = function(username, password)
  {
      var tmpObj = JSON.parse(localStorage.getItem("pinsterUsers"));

      if ((tmpObj.username == "") && (tmpObj.id == ""))
      {
        obj.userSignup(username,password);
      }

      else
      {
        obj.userLogin(username,password);
      }

      return true;

   };


  obj.userLogout = function(currentUser)
  {
    //need to check
    currentUser.logOut();
  };


  obj.getCurrentUser = function()
  {
    return JSON.parse(localStorage.getItem("pinsterUsers"));
  };

  obj.isUserLoggedIn = function()
  {
      var currentUser = Parse.User.current();
     
      if (currentUser != null) 
      {
        console.log(currentUser);
        return true;
      }
       else
      {
         console.log("Not logged");
         return false;
      }
  };

  obj.addUserToLocalstorage = function(username, id)
  {
      var tmpObj = JSON.parse(localStorage.getItem("pinsterUsers"));
      tmpObj.username = username;
      tmpObj.id = id;
      localStorage.setItem("pinsterUsers", JSON.stringify(tmpObj));
  };

  //------------
  // Settings
  //------------

  obj.settings = {

    language: "עברית",
    address: "",
    category: "",
    radius: 1000,

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

    init : function() {

      var that = this;

      if (!localStorage.pinsterSearches || localStorage.pinsterSearches == 'undefined') {
        localStorage.setItem("pinsterSearches", JSON.stringify({
          eventsCategory: [],
          addresses: [],
        }));
      }


      if (!localStorage.pinsterUsers || localStorage.pinsterUsers == 'undefined') {
        localStorage.setItem("pinsterUsers", JSON.stringify({
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
          radius: 1000
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

          var languageImg = "English";
          if (tmpObj.language == "עברית") { languageImg = "Hebrew"; }

          $("#languageDropdownMenu").html(that.language + "<img src='img/" + languageImg + ".png' style='width: 20px; left: 6px; position: absolute; top: 9px;' /><span class='caret caretRight'></span>");
          $("#settingsModal #address").val(that.address);
          $("#dropdownMenu1").html(that.category + '<span class="caret caretRight"></span>');
          $('#radiusSlider').val(that.radius);
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

      if (history == 'undefined')
      {
        console.log("getRecommendedEvent: Stopped - no search history");
        return;
        // @goldido : if there's no history - random some event.
      }

      var params = {};
      params["data"] = JSON.parse(history);

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
            clearInterval(PinsterApp.fields.rotateDice);
            $(".diceIcon").css("transform", "rotate(0deg)");
            PinsterApp.fields.user.searchData.getSmartRandomEvent();
            return;
          }

          var selectedEvent = JSON.parse(results);
          var location = selectedEvent.location;
          var eventId = selectedEvent.objectId;

          var address = new google.maps.LatLng(location.latitude, location.longitude);

          clearInterval(PinsterApp.fields.rotateDice);
          $(".diceIcon").css("transform", "rotate(0deg)");

          // Focus on the selected event
          PinsterApp.fields.mapInstance.setCenter(address);
          
          // Animate the selected event marker
          PinsterApp.fields.markers.forEach(function(marker, index) {

            if (marker.id == eventId)
            {
              if (marker.getAnimation() != null) {
                marker.setAnimation(null);
              } else {
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function() {
                  marker.setAnimation(null);
                  google.maps.event.trigger(PinsterApp.fields.eventsHashMap[eventId], 'click');
                }, 3000);
              }
            }
          });
        },

        error: function(error) {
          clearInterval(PinsterApp.fields.rotateDice);
          $(".diceIcon").css("transform", "rotate(0deg)");
          console.log(error);
        }
      });

    }

  // End of SearchData
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