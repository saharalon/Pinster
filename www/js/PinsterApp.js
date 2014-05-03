var PinsterApp = {

    fields : {

      markers : [],
      user : {},
      map : {},
      geocoder : {},

    },

    CONSTANTS : {

      METERS : 1000,

    },

    initialize : function () {

      var that = this;
      if (isPhone) { document.addEventListener('deviceready', that.onDeviceReady, false); }

    },

    // deviceready Event Handler

    onDeviceReady : function() {

      this.receivedEvent('deviceready');
      
      //Android search key (magnifying glass) - search events
      document.addEventListener("searchbutton", that.searchEvents, false);

    },

    onDocumentReady: function() {

      var that = this;

      Parse.initialize("4ChsdpMV3dxl3PNBzWTi3wHX5dfpt9Ddnm1t31Db",
        "HksWttYlv8V6K07OsrV3aeQMED3XOCTmO2iYvKqn");

      that.fields.map = new that.GoogleMap();
      that.fields.geocoder = new google.maps.Geocoder();
      that.fields.map.initialize();

      that.registerEvents();


      that.fields.user = new that.User();
      that.fields.user.settings.init();

    },  // END of onDeviceReady()

    // Update DOM on a Received Event
    receivedEvent : function (id) {
      var parentElement = document.getElementById(id);
      var listeningElement = parentElement.querySelector('.listening');
      var receivedElement = parentElement.querySelector('.received');

      listeningElement.setAttribute('style', 'display:none;');
      receivedElement.setAttribute('style', 'display:block;');

      console.log('Received Event: ' + id);
    },

    registerEvents : function() {

      var that = this;

      FastClick.attach(document.body);

      $(".fancyBtn").on("touchstart", function(){
        $(this).addClass('fancyBtnDown');
      });
        
      $(".settingsBtn").on("touchend", function(){
        $(".fancyBtn").removeClass('fancyBtnDown');
        $("#settingsModal").modal();
      });

      $(".reportBtn").on("touchend", function(){
        $(".fancyBtn").removeClass('fancyBtnDown');
        $("#reportModal").modal();
      });

      $(".settingsBtn").click(function(){
        $("#settingsModal").modal();
      });

      $(".reportBtn").click(function(){
        $("#reportModal").modal();
      });

      $("#settingsModal .dropdown-menu li a").click(function(){
        $("#dropdownMenu1").html($(this).text() + '<span class="caret caretRight"></span>');
      });

      $("#reportModal .dropdown-menu li a").click(function(){
        $("#dropdownMenu2").html($(this).text() + '<span class="caret caretRight"></span>');
      });

      $("#settingsSaveBtn").click(function() {

        var user = that.fields.user;

        user.settings.setAddress($("#settingsModal #address").val());
        user.settings.setCategory($("#dropdownMenu1").text());
        user.settings.setRadius($('#radiusSlider').val());

      });

      //click -publish events - TODO: create the UI element
      $('#reportBtnModal').click(function()
      {
          //get current location of the device
          //TODO: get the precise location of the device, NOT raw location
         navigator.geolocation.getCurrentPosition(that.onCurrentLocationSuccess, that.onCurrentLocationError,  {enableAccuracy: true});

      });

      //Enter key - search events
      $('#quickSearch').keypress(function( event ) {
        
        if ( event.which == 13 ) {
          event.preventDefault();
          that.searchEvents();
        }
      });

      //search button (magnifying glass) - search events
      $("#quickSearchBtn").click(function(event) {
          event.preventDefault();
          that.searchEvents();
      });


    },  // END of registerEvents()

    // Success Geolocation
    onCurrentLocationSuccess : function (position) {

      console.log(position.coords.latitude);
      console.log(position.coords.heading);
      console.log(position.coords.longitude);

      var currentLocation = convertToGeoPointObject(position.coords.latitude,position.coords.longitude);

      var title = $('#eventTitle').val();
      var description = $('#eventDescription').val();
      var category = $("#dropdownMenu2").text();

      user.addEvent(currentLocation,title,description,category,null);

    },

    // Error Callback receives a PositionError object
    onCurrentLocationError : function(error) {
      alert('code: '    + error.code    + '\n' +
            'message: ' + error.message + '\n');
    },

    searchEvents : function() {

      var that = this;

      //get address from address element
      var address = $('#quickSearch').val();
      //get radius from radius ele, divide with 1000, to get KM
      var radius = $('#radiusSlider').val() / that.CONSTANTS.METERS;

      that.fields.geocoder.geocode( { 'address': address }, function(results, status)
      {
        //address is OK
        if (status == google.maps.GeocoderStatus.OK)
        {
            //get lat/lng from location 
            var soughtAddressLatitude = results[0].geometry.location.lat();
            var soughtAddressLongitude = results[0].geometry.location.lng();
            var geoPoint = that.convertToGeoPointObject(soughtAddressLatitude, soughtAddressLongitude);
            //get events object from parse
            that.fields.user.searchEvents(geoPoint,radius);
        }

        //address is not valid - TODO visualize an alert to user
        else
        {
          alert("Geocode was not successful for the following reason: " + status);
        }
      });

    },

    convertToGeoPointObject : function(latitude, longitude) {
      //get geopoint from lat/lng
      return new Parse.GeoPoint({latitude: latitude, longitude: longitude});
    },

    sliderOutputUpdate : function(val) {

      var that = this;
      
      if (val < that.CONSTANTS.METERS)
      {
        document.querySelector('#output').value = "Radius is: " + val + " Meters";
      }
      else
      {
        document.querySelector('#output').value = "Radius is: " + val / that.CONSTANTS.METERS + " Kilometers";
      }

    },

    getImageByCategory : function(category) {
      
      var path = 'img/';

      switch (category.toLowerCase())
      {
        case 'shopping':
          return path + 'pin1.png';
        case 'sport':
          return path + 'pin2.png';
        case 'parties':
          return path + 'pin3.png';
        case 'other':
          return path + 'pin4.png';
        default:
          return path + 'pin5.png';
      }

    },

    GoogleMap : function() {

      var that = this;
        
      this.initialize = function(){
          var map = showMap();
          loadMarkers(map);
      };
      
      var loadMarkers = function(map)
      {
        // Shapes define the clickable region of the icon.
        // The type defines an HTML &lt;area&gt; element 'poly' which
        // traces out a polygon as a series of X,Y points. The final
        // coordinate closes the poly by connecting to the first
        // coordinate.
        var shape = {
          coord: [1, 1, 1, 20, 18, 20, 18 , 1],
          type: 'poly'
        };

        var infowindow = new google.maps.InfoWindow();
        var marker;

        // Retreive events from the databas
        var Event = Parse.Object.extend("Event");
        var query = new Parse.Query(Event);
        
        query.find({
            success: function(results) {
              results.forEach(function(item, index) {
                var title = item._serverData.title;
                var latitude = item._serverData.location._latitude;
                var longitude = item._serverData.location._longitude;
                // TODO: load from database
                var eventImage = "img/yakar.jpg";

                // Image for the marker
                var markerImage = {
                    url: PinsterApp.getImageByCategory(item._serverData.category)
                };

                marker = new google.maps.Marker({
                  position: new google.maps.LatLng(latitude, longitude),
                  map: map,
                  icon: markerImage,
                  //shape: shape,
                  title: title,
                  //zIndex: events[i][3]
                });

                PinsterApp.fields.markers.push(marker);

                google.maps.event.addListener(marker, 'mouseover', (function(marker, index) {
                  return function() {
                    infowindow.setContent('<div style="text-align: center; font-size:14px;"><center><b>' + results[index]._serverData.title +
                      '</b></center><img width="240" height="180" src="' + eventImage + '"/></div>');

                    infowindow.open(map, marker);
                  };
                })(marker, index));

                google.maps.event.addListener(marker, 'mouseout', (function(marker, index) {
                  return function() {
                    infowindow.close();
                  };
                })(marker, index));

                google.maps.event.addListener(marker, 'click', (function(marker, index) {
                  return function() {
                    // TODO: Show event information (Foursquare)
                  };
                })(marker, index));
              });

            },
            error: function(object, error) {
              // The object was not retrieved successfully.
              // error is a Parse.Error with an error code and description.
              alert("Failed to retreive events from the database");
            }
        });
      };
      
      var showMap = function() {

        var initialLocation = new google.maps.LatLng(31.8759, 34.734948);

        var mapOptions = {
          zoom: 12,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControl: false,
          panControl: false,
          zoomControl: false
        };

        var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
          google.maps.event.addListenerOnce(map, 'idle', function(){
                //loaded fully
                console.log("Map loaded...");
                // navigator.splashscreen.hide();
          });

        map.setCenter(initialLocation);
          
        return map;
      };

    },  // END of GoogleMap()
        
};
