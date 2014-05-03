var PinsterApp = {

    fields : {

      markers : [],
      user : {},
      map : {},
      geocoder : {},
      directionsDisplay: {},
      destination: {},
      infowindow : {},

    },

    CONSTANTS : {

      METERS : 1000,
      CLIENT_ID_foursquare : "XWLOQFQSYT5KYGPKYHJS4GGMAAZI51IPQ2WSIRUAA5PTSPFB",
      CLIENT_SECRET_foursquare : "HXRLKL1U422VH5JZGLMN2UHHZIRDWH44P0CMDXN2OQK0FK1Z",
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

    calcRoute : function() {

      //var start = document.getElementById('start').value;
      //var end = document.getElementById('end').value;
      infowindow.close();

      var start = "יבנה, ישראל";
      this.writeAddressName(destination);
      var end = destination;

      var request = {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING
      };
      var directionsService = new google.maps.DirectionsService();
      directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          directionsDisplay.setDirections(response);
        }
      });

    },

    writeAddressName : function(latLng) {
      var geocoder = new google.maps.Geocoder();
      geocoder.geocode({
        "location": latLng
      },
      function(results, status) {
        if (status == google.maps.GeocoderStatus.OK)
        {
          destination = results[0].formatted_address;
        }
        return null;
      });
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
                  isClicked: false,
                });

                PinsterApp.fields.markers.push(marker);

                google.maps.event.addListener(marker, 'mouseover', (function(marker, index) {
                return function() {
                  // Don't show hover popup when it is 
                  // already open from clicking the marker
                  if (!infowindow.isOpen)
                  {
                    infowindow.setContent('<div style="text-align: center; font-size:14px;"><center><b>' +
                      results[index]._serverData.title + '</b></center></div>');

                    infowindow.isOpen = true;
                    infowindow.open(map, marker);
                  }
                };
              })(marker, index));

              google.maps.event.addListener(marker, 'mouseout', (function(marker, index) {
                return function() {
                  // Don't close the popup on hover out
                  // if the marker was mouse clicked
                  if (marker.isClicked)
                    marker.isClicked = false;
                  else
                  {
                    infowindow.close();
                    infowindow.isOpen = false;
                  }
                  
                  $("#searchBar").show();
                };
              })(marker, index));

              google.maps.event.addListener(marker, 'click', (function(marker, index) {
                return function() {
                  // TODO: Show event information (Foursquare)
                  marker.isClicked = true;

                  // Get event location as our destination
                  destination = new google.maps.LatLng(results[index]._serverData.location.latitude, 
                    results[index]._serverData.location.longitude);

                  infowindow.setContent("<html><head> <meta charset='utf-8'/></head><body>" +
                  "<div id='parent' style='float: left; clear: none;'>" +
                  "<div style='float: left; text-align: center; font-size:14px; border:2px solid; width:300px; height:400px;'>" +
                  "<div style='border:2px solid; height:85px;'><center><b><h4>" + 
                  results[index]._serverData.title + "</h4></b></center></div>" +
                  "<div style='border:2px solid;'><center><img width='293' height='180' src='img/yakar.jpg'/></center>" +
                  "</div><div style='border:2px solid; height:127px;'><center><h5>"
                  + results[index]._serverData.description + "</h5></center></div></div>" +
                  "<div style='float: left; text-align: center; font-size:14px; border:2px solid; width:300px; height:400px;'>" +
                  "<center><h4><b><u>FOURSQUARE</u></b></h4></center><button onclick='PinsterApp.calcRoute();'>Take me there</button></div></div></body></html>");

                  $("#searchBar").hide();
                  infowindow.isOpen = true;
                  infowindow.open(map, marker);
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

        directionsDisplay = new google.maps.DirectionsRenderer();
        infowindow = new google.maps.InfoWindow();
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
    

    utilities : {

        jsonAJAXCall : function(URL)
        {
            var response = "";
              
               $.ajax({
                      url: URL,
                      type: "GET",
                      dataType: "json",
                      async:false,

                      //success of fetching json
                      success: function (json) 
                      {
                          response = json;
                      },
                      
                      //failure of fetching json
                      error: function () 
                      {
                          console.log("error: Foursquare API")
                      }

                  });

             return response;
        }

    },

    foursquare : {
      
        getFourSquareNearPlaces : function(lat, lng)
        {
            var json = PinsterApp.utilities.jsonAJAXCall('https://api.foursquare.com/v2/venues/search?ll=' + lat + ',' + lng +'&intent=browse&radius=20&limit=5&client_id=' + PinsterApp.CONSTANTS.CLIENT_ID_foursquare + '&client_secret=' + PinsterApp.CONSTANTS.CLIENT_SECRET_foursquare + '&v=2');
            console.log(json);
        },


        getFourSquarePlacePhotos : function(venueID)
        {
           var json = PinsterApp.utilities.jsonAJAXCall('https://api.foursquare.com/v2/venues/' + venueID + '/photos?&limit=5&client_id=' + PinsterApp.CONSTANTS.CLIENT_ID_foursquare + '&client_secret=' + PinsterApp.CONSTANTS.CLIENT_SECRET_foursquare + '&v=2');
           console.log(json);
        }

    },
};
