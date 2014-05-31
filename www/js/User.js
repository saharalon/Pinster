PinsterApp.User = function() {

  var obj = {};

  //------------
  // Events
  //------------

  obj.addEvent = function (location, title, desc, category, img, address)
  {
      var EventObject = Parse.Object.extend("Event");
      var eventObject = new EventObject();

      eventObject.save({title:title, description:desc, location:location,
       address:address, category:category, imageURL:""}, {
        success:function(object) 
        {
          if (img != null)
          {
             var parseFile = new Parse.File(object.id + ".jpg", { base64:img }, "image/jpeg");
            
              parseFile.save().then(function()
              {
                 object.set("imageURL",parseFile.url());
                 object.save();
                 alert("image saved");
                 PinsterApp.onDocumentReady();  // redraw map with new data
              },

              function(error)
              {
                  console.log(error);
                  alert("error saving image");
              });
          }
          else {
            PinsterApp.onDocumentReady(); // redraw map with new data
          }

        },
        error:function(object,error) {
          console.log(error);
          alert("Sorry, I couldn't save it.");
        }
      });
  };

  // function removeEvent() ??

  obj.searchEvents = function (address, radius)
  {
    var searchCategory = $("#dropdownMenu1").text();

    var events = Parse.Object.extend("Event");
    //set query for events objectr
    var query = new Parse.Query(events);
    //check the events within the specify point to search from
    query.withinKilometers("location", address, radius);
    // Limit what could be a lot of points.
    query.limit(10);
    // Final list of objects
   
    query.find({
        success: function(placesObjects) {

          var image;
          console.log(placesObjects);
          // var resultsStr = "";
          $("#eventsResults").html('');
          $(".eventResRow").unbind();

          placesObjects.forEach(function(item){

            image = PinsterApp.CONSTANTS.pinImgs[item.attributes.category];
            if (image == undefined) { image = PinsterApp.CONSTANTS.pinImgs["undefined"]; }

            $("#eventsResults").append("<div class='eventResRow' eventId=" + item.id + 
              " lat=" + item.attributes.location._latitude + " long=" + item.attributes.location._longitude
                + " >" + item.attributes.title + "<img class='eventResRowPin' src='img/" + image + "' /></div>");
            // resultsStr += item.attributes.title + " | ";
          });

          $(".eventResRow").click(function() {
            var lat = $(this).attr("lat");
            var lon = $(this).attr("long");

            PinsterApp.fields.mapInstance.setCenter(
              new google.maps.LatLng(lat, lon));
            google.maps.event.trigger(PinsterApp.fields.eventsHasMap[$(this).attr("eventId")], 'click');
          });

          $("#eventsResults").show();
          // alert(resultsStr);

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

  obj.isUserLoggedIn = function()
  {
    currentUser = Parse.User.current();

    if (currentUser) {
      console.log("logged in");
    }
    else {
      console.log("not logged in")
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

      if (!localStorage.pinsterSettings || localStorage.pinsterSettings == 'undefined') {
        localStorage.setItem("pinsterSettings", JSON.stringify({
          language: "עברית", 
          address: "",
          category: "",
          radius: 1000
        }));

        $("#languageDropdownMenu").html('עברית<span class="caret caretRight"></span>');
        $("#settingsModal #address").val("Favorite Address");
        $("#dropdownMenu1").html('Favorite Category<span class="caret caretRight"></span>');
        $('#radiusSlider').val(1000);
        PinsterApp.sliderOutputUpdate(1000);
      }
      else {
        var tmpObj = JSON.parse(localStorage.getItem("pinsterSettings"));
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
          alert("Sorry, I couldn't save it.");
        }

      });

    },

    getSearchData : function() {

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
          alert("Sorry, I couldn't save it.");
        }
      });

    }

  };

  return obj;

};