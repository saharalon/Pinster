PinsterApp.User = function() {

  var obj = {};

  //------------
  // Events
  //------------

  obj.addEvent = function (location, title, desc, category, img, address, user)
  {
      var EventObject = Parse.Object.extend("Event");
      var eventObject = new EventObject();

      eventObject.save({title:title, description:desc, location:location,
       address:address, category:category, imageURL:"", user:user}, {
        success:function(object) 
        {
         // obj.postOnFacebook(title, desc, user);
          if (img != null)
          {
             var parseFile = new Parse.File(object.id + ".jpg", { base64:img }, "image/jpeg");
            
              parseFile.save().then(function()
              {
                 object.set("imageURL",parseFile.url());
                 object.save();
                 PinsterApp.log("image saved");
                 PinsterApp.onDocumentReady();  // redraw map with new data
              },

              function(error)
              {
                  console.log(error);
                  PinsterApp.log("error saving image");
              });
          }
          else {
            PinsterApp.onDocumentReady(); // redraw map with new data
          }

        },
        error:function(object,error) {
          console.log(error);
          PinsterApp.log("Sorry, I couldn't save it.");
        }
      });
  };

  // function removeEvent() ??

  obj.searchEvents = function (address, radius)
  {
    // Remove previous search area
    if (PinsterApp.fields.searchArea.setMap != undefined)
      PinsterApp.fields.searchArea.setMap(null);

    // Show a circle as the search area
    PinsterApp.fields.searchArea = new google.maps.Circle({
      center:new google.maps.LatLng(address._latitude, address._longitude),
      radius: (radius < 1000) ? radius * 1000 : radius,
      strokeColor:"#0000FF",
      strokeOpacity:0.8,
      strokeWeight:2,
      fillColor:"#0000FF",
      fillOpacity:0.4
    });

    PinsterApp.fields.searchArea.setMap(PinsterApp.fields.mapInstance);

    // Remove circle on mouse click
    google.maps.event.addListener(PinsterApp.fields.searchArea, 'click', function(ev){
      PinsterApp.fields.searchArea.setMap(null);            
    });

    var searchCategory = $("#dropdownMenu1").text();

    var events = Parse.Object.extend("Event");
    //set query for events objectr
    var query = new Parse.Query(events);
    //check the events within the specify point to search from
    query.withinKilometers("location", address, radius);
    // var currentTime = new Date();
    // // Subtract one day from today's time to search
    // // only events that had been updated at the last 24 hours
    // currentTime.setDate(currentTime.getDate() - 1);
    // var time = new Date(currentTime.getTime());
    // query.greaterThanOrEqualTo('updatedAt', time);
    // Limit what could be a lot of points.
    query.limit(10);
    // Final list of objects

    query.find({
        success: function(placesObjects) {

          var image;
          console.log(placesObjects);
          
          $("#eventsResults").html('');
          $(".eventResRow").unbind();

          placesObjects.forEach(function(item){

            image = PinsterApp.CONSTANTS.pinImgs[item.attributes.category];
            if (image == undefined) { image = PinsterApp.CONSTANTS.pinImgs["undefined"]; }

            $("#eventsResults").append("<div class='eventResRow' eventId='" + item.id + "' lat=" + item.attributes.location._latitude + 
              " long=" + item.attributes.location._longitude + "><span><i class='glyphicon glyphicon-chevron-right'></i>" + item.attributes.title + "</span><img class='eventResRowPin' src='img/" + image + "' /></div>");
          });

          if (placesObjects.length != 0) {
            
            $(".eventResRow").click(function() {
              // @idogold : remove blue circle
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
            $("#eventsResults").append("<div class='eventResRow'>" + msg + "...</div>");
          }

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


  obj.userLogin = function(username, password)
  {
    Parse.User.logIn(username, password, {
    
      success: function(user) {
        // Do stuff after successful login.
      },
      error: function(user, error) {
        // The login failed. Check error to see why.
      }
    });
  };

  obj.userLogout = function(currentUser)
  {
    //need to check
    currentUser.logOut();
  };

  obj.postOnFacebook = function(title, desc, user)
  {
    FB.api('/me/feed',

      'post', { message: title, /* More options 
      here at : https://developers.facebook.com/docs/graph-api/reference/v1.0/user/feed */ },


      function (response) {
          if (response && !response.error) {
           console.log("error");
          }

          else 
            console.log(response);
        });
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

      if (!localStorage.pinsterSettings || localStorage.pinsterSettings == 'undefined') {
        localStorage.setItem("pinsterSettings", JSON.stringify({
          language: "עברית",
          address: "",
          category: "All",
          radius: 1000
        }));

        $("#languageDropdownMenu").html('עברית<span class="caret caretRight"></span>');
        $("#settingsModal #address").val("Favorite Address");
        $("#dropdownMenu1").html('All<span class="caret caretRight"></span>');
        $('#radiusSlider').val(1000);
        PinsterApp.sliderOutputUpdate(1000);
      }
      else {
        var tmpObj = JSON.parse(localStorage.getItem("pinsterSettings"));
        PinsterApp.fields.currentLanguage = tmpObj.language;
        that.language = tmpObj.language;
        that.address = tmpObj.address;
        that.category = tmpObj.category;
        that.radius = tmpObj.radius;

        $("#languageDropdownMenu").html(that.language + '<span class="caret caretRight"></span>');
        $("#settingsModal #address").val(that.address);
        $("#dropdownMenu1").html(that.category + '<span class="caret caretRight"></span>');
        $('#radiusSlider').val(that.radius);
        PinsterApp.sliderOutputUpdate(that.radius);
      }
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

      var currentUserId = Parse.User.current().get("userId");

      // Retreive search data from the databas
      var Searches = Parse.Object.extend("SearchData");
      var query = new Parse.Query(Searches);
      query.equalTo("userId", currentUserId);

      query.find({
        success: function(results) {
          // Do something with the results
        },
        error:function(object,error) {
          console.log(error);
          PinsterApp.log("Sorry, I couldn't save it.");
        }
      });

    }

  };

  return obj;

};