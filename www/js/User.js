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
          if(img != null)
          {
             var parseFile = new Parse.File(object.id + ".jpg", { base64:img }, "image/jpeg");
            
              parseFile.save().then(function()
              {
                 object.set("imageURL",parseFile.url());
                 object.save();
                 alert("image saved");
              },

              function(error)
              {
                  console.log(error);
                  alert("error saving image");
              });
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
          console.log(placesObjects);
          // var resultsStr = "";
          $("#eventsResults").html('');
          $(".eventResRow").unbind();
          placesObjects.forEach(function(item){
            $("#eventsResults").append("<div class='eventResRow' eventId=" + item.id + ">" + item.attributes.title + "</div>");
            // resultsStr += item.attributes.title + " | ";
          });
          $(".eventResRow").click(function() {
            google.maps.event.trigger(PinsterApp.fields.eventsHasMap[$(this).attr("eventId")], 'click');
          });
          $("#eventsResults").show();
          // alert(resultsStr);
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


  //------------
  // Settings
  //------------

  obj.settings = {

    address: "",
    category: "",
    radius: 1000,

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
          address: "",
          category: "",
          radius: 1000
        }));

        $("#settingsModal #address").val("Favorite Address");
        $("#dropdownMenu1").html('Favorite Category<span class="caret caretRight"></span>');
        $('#radiusSlider').val(1000);
        PinsterApp.sliderOutputUpdate(1000);
      }
      else {
        var tmpObj = JSON.parse(localStorage.getItem("pinsterSettings"));
        that.address = tmpObj.address;
        that.category = tmpObj.category;
        that.radius = tmpObj.radius;
        $("#settingsModal #address").val(that.address);
        $("#dropdownMenu1").html(that.category + '<span class="caret caretRight"></span>');
        $('#radiusSlider').val(that.radius);
        PinsterApp.sliderOutputUpdate(that.radius);
      }
    }

  };

  return obj;

};