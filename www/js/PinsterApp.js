var PinsterApp = {

    fields : {

      markers : [],
      eventsHasMap : {},
      user : {},
      map : {},
      geocoder : {},
      directionsDisplay: {},
      directionsService: {},
      destination: {},
      infowindow : {},
      watchID: null,
      currentPosition: {},
      dataImage: null
    },

    CONSTANTS : {

      METERS : 1000,
      CLIENT_ID_foursquare : "XWLOQFQSYT5KYGPKYHJS4GGMAAZI51IPQ2WSIRUAA5PTSPFB",
      CLIENT_SECRET_foursquare : "HXRLKL1U422VH5JZGLMN2UHHZIRDWH44P0CMDXN2OQK0FK1Z",
      GPS_SETTINGS :  {enableHighAccuracy: true, maximumAge:3000, timeout: 8000},
    },

    initialize : function () {

      var that = this;
      if (isPhone) { document.addEventListener('deviceready', that.onDeviceReady, false); }

    },

    // deviceready Event Handler

    onDeviceReady : function() {

      var that = this;
      that.receivedEvent('deviceready');

      //Android search key (magnifying glass) - search events
      document.addEventListener("searchbutton", that.searchEvents, false);
      document.addEventListener("backbutton", that.hideEventModal, false);

      var options = { frequency: 3000 };
      watchID = navigator.geolocation.watchPosition(onPositionSuccess, onPositionError, options);

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

    },  // END of onDocumentReady()

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

      // When clicking outside the events search results -> hide it
      $("body").click(function(e){
        if (e.target.id != "quickSearch" && e.target.className != "eventResRow" && e.target.id != "eventModalClose") {
          $("#eventsResults").hide();
        }
      });

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
        var map = that.fields.map;

        var category = $("#dropdownMenu1").text();

        user.settings.setAddress($("#settingsModal #address").val());
        user.settings.setCategory(category);
        user.settings.setRadius($('#radiusSlider').val());

        map.filterMarkers(category.toLowerCase());

      });

      $('#reportBtnModal').click(function() {

        if (PinsterApp.fields.user.isUserLoggedIn())
        {
          //TODO: get the precise location of the device, NOT raw location
          navigator.geolocation.getCurrentPosition(
            that.onCurrentLocationSuccess, that.onCurrentLocationError,
              PinsterApp.CONSTANTS.GPS_SETTINGS);
        }
        else 
        {
          if (isPhone)
            window.plugins.toast.show("You need to be logged in order to report an event");
          else
            alert("You need to be logged in order to report an event");
        }

      });

      $('#takeMeThereBtn').click(function() {

        if (isPhone) { 
          calcRoute(PinsterApp.currentPosition);
        }
        else {
          navigator.geolocation.getCurrentPosition(
            that.onCurrentLocationForRouteSuccess, that.onCurrentLocationError, PinsterApp.CONSTANTS.GPS_SETTINGS);
        }
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

      $("#captureImage .glyphicon").on("touchstart", function(){
        $(this).addClass("captureImgDown");
      });

      $("#captureImage .glyphicon").on("touchend", function(){
        $(this).removeClass("captureImgDown");

        that.camera.capturePhoto();
      });

      $("#eventModalClose").click(function(){
        $("#eventModal").hide();
        $("#eventImg").attr("src","img/no-image.png");
      });

      // $(".eventResRow").click(function() {
      //   google.maps.event.trigger(PinsterApp.fields.eventsHasMap[$(this).attr("eventId")], 'click');
      // });

    },  // END of registerEvents()

    // Success Geolocation
    onCurrentLocationSuccess : function (position) {

      console.log(position.coords.latitude);
      console.log(position.coords.heading);
      console.log(position.coords.longitude);

      var currentLocation = 
        PinsterApp.convertToGeoPointObject(position.coords.latitude,position.coords.longitude);

      var title = $('#eventTitle').val();
      var description = $('#eventDescription').val();
      var category = $("#dropdownMenu2").text();

      var geocoder = new google.maps.Geocoder();
      // Convert the event position to actual address
      geocoder.geocode({ "location": PinsterApp.destination }, function(results, status) {     
        var eventAddress = "";

        if (status == google.maps.GeocoderStatus.OK) {
          eventAddress = results[0].formatted_address;
        }

        PinsterApp.fields.user.addEvent(
            currentLocation, title, description, category,
              PinsterApp.fields.dataImage, eventAddress);
      });
    },

    onCurrentLocationForRouteSuccess : function(position) {

      var currentLocation = 
        new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        
      PinsterApp.calcRoute(currentLocation);

    },

    // Error Callback receives a PositionError object
    onCurrentLocationError : function(error) {

      alert('code: '    + error.code    + '\n' +
            'message: ' + error.message + '\n');
    },

    hideEventModal : function() {

      console.log("hidden!");
      $("#eventModal").hide();
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
          $("#eventsResults").html('');
          $("#eventsResults").append("<div class='eventResRow'>No results were found... (" + status + ")</div>");
          $("#eventsResults").show();
        }
      });

    },

    onPositionSuccess : function(position)
    {
        currentPosition = position;
    },

    onPositionError : function(error)
    {
        console.log(error.code + "  " + error.message);
    },

    convertToGeoPointObject : function(latitude, longitude) {
      //get geopoint from lat/lng
      return new Parse.GeoPoint({latitude: latitude, longitude: longitude});
    },

    sliderOutputUpdate : function(val) {

      var that = this;
      
      if (val < that.CONSTANTS.METERS) {
        document.querySelector('#output').value = "Radius is: " + val + " Meters";
      }
      else {
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

    calcRoute : function(currentLocation) {

      $("#eventModal").hide();

      PinsterApp.currentPosition = currentLocation;
      // Convert the coordinates to addresses
      this.geoPointToAddress(PinsterApp.currentPosition, PinsterApp.destination);
    },

    geoPointToAddress : function(currentPosition, destination) {
      
      var currentAddress;
      var destinationAddress;

      // Geocoder converts coordinates to addresses
      var geocoder = new google.maps.Geocoder();

      // Convert the current position to actual address
      geocoder.geocode({ "location": currentPosition }, function(results, status) {
        
        if (status == google.maps.GeocoderStatus.OK)
        {
          currentAddress = results[0].formatted_address;

          // Convert the destination position to actual address
          geocoder.geocode({ "location": destination }, function(results, status) {

            if (status == google.maps.GeocoderStatus.OK)
            {
              destinationAddress = results[0].formatted_address;

              // Calculate the route between the addresses
              PinsterApp.getRoute(currentAddress, destinationAddress);
            }
          });
        }
      });
    },

    getRoute : function(start, end) {

      var request = {
            origin: start,
            destination: end,
            travelMode: google.maps.TravelMode.DRIVING
          };
          directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
              directionsDisplay.setDirections(response);
            }
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
                var eventImage = "img/no-image.png";

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
                  category: item._serverData.category 
                  //zIndex: events[i][3]
                });

                PinsterApp.fields.eventsHasMap[item.id] = marker;
                PinsterApp.fields.markers.push(marker);

                // Show event title tooltip on mouse over
                google.maps.event.addListener(marker, 'mouseover', (function(marker, index) {
                  return function() {
                    infowindow.setContent('<div style="text-align: center; font-size:14px;"><center><b>' +
                      results[index]._serverData.title + '</b></center></div>');
                };
              })(marker, index));

              // Close popup
              google.maps.event.addListener(marker, 'mouseout', (function(marker, index) {
                return function() {
                    infowindow.close();
                };
              })(marker, index));

              google.maps.event.addListener(marker, 'click', (function(marker, index) {
                return function() {

                  var userEvent = results[index]._serverData;
                  // Set event location as our destination
                  // in case the user will want to drive there
                  PinsterApp.destination = new google.maps.LatLng(
                    userEvent.location.latitude, userEvent.location.longitude);

                  $("#eventModalLabel").text(userEvent.title);
                  $("#eventDesc").text(userEvent.description);

                  if (userEvent.imageURL) {
                    $("#eventImg").attr("src", userEvent.imageURL);
                  }

                  $("#eventLocationStr").text(userEvent.address);
                  
                  //foursquare tests
                  PinsterApp.foursquare.getFoursquareNearPlaces(
                    userEvent.location.latitude, userEvent.location.longitude);
                                
                  $("#eventModal").show();
                }
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

        directionsService = new google.maps.DirectionsService();
        directionsDisplay = new google.maps.DirectionsRenderer();
        infowindow = new google.maps.InfoWindow();
        var initialLocation = new google.maps.LatLng(31.8759, 34.734948);

        var style = [ { "stylers": [ { "visibility": "simplified" } ] },{ "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [ { "visibility": "on" }, { "color": "#838080" } ] },{ "featureType": "administrative.province", "stylers": [ { "visibility": "on" } ] },{ "featureType": "administrative.locality" },{ "featureType": "administrative.neighborhood", "stylers": [ { "visibility": "on" } ] },{ "featureType": "administrative", "stylers": [ { "visibility": "on" } ] },{ "elementType": "labels.text.fill", "stylers": [ { "color": "#54b5da" } ] },{ "featureType": "water", "elementType": "geometry.fill", "stylers": [ { "color": "#c4e3ff" } ] },{ "featureType": "landscape.man_made", "stylers": [ { "color": "#ececef" }, { "saturation": 5 }, { "lightness": -4 } ] },{ "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [ { "visibility": "on" }, { "color": "#ff755c" } ] },{ "featureType": "road", "elementType": "geometry.fill", "stylers": [ { "color": "#ffffff" } ] },{ "featureType": "landscape.natural.terrain", "elementType": "geometry.fill", "stylers": [ { "color": "#a0ccb5" }, { "visibility": "off" } ] },{ "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [ { "color": "#badfbb" }, { "visibility": "simplified" } ] },{ },{ "featureType": "landscape.natural.landcover", "elementType": "geometry", "stylers": [ { "color": "#f4f7f6" } ] },{ "featureType": "landscape.natural", "stylers": [ { "visibility": "simplified" }, { "color": "#f4f4f6" } ] },{ },{ "featureType": "road", "elementType": "labels.text.fill", "stylers": [ { "visibility": "on" }, { "color": "#8d8c8c" } ] },{ } ];

        var mapOptions = {
          zoom: 12,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControl: false,
          panControl: false,
          zoomControl: false,
          styles: style
        };
        

        var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
          google.maps.event.addListenerOnce(map, 'idle', function(){
                //loaded fully
                console.log("Map loaded...");
                // Filter pins by user last choosen category
                PinsterApp.fields.map.filterMarkers($("#dropdownMenu1").text().toLowerCase());
                // navigator.splashscreen.hide();
          });

        map.setCenter(initialLocation);

        directionsDisplay.setMap(map);
                
        return map;
      };

      this.filterMarkers = function(filter) {

        for (var i = 0; i < PinsterApp.fields.markers.length; i++) {

          if (filter != "all" && PinsterApp.fields.markers[i].category.toLowerCase() != filter) {
            PinsterApp.fields.markers[i].setVisible(false);
          }
          else {
            PinsterApp.fields.markers[i].setVisible(true);
          }
        }

      };

    },  // END of GoogleMap()

    camera : {

      destinationType : null, // sets the format of returned value

      capturePhoto : function() {

        var that = this;
        that.destinationType = navigator.camera.DestinationType;
        
        // Take picture using device camera and retrieve image as base64-encoded string
        navigator.camera.getPicture(PinsterApp.camera.onPhotoDataSuccess, PinsterApp.camera.onFail, { quality: 50,
          destinationType: that.destinationType.DATA_URL });
      },

      // Called when a photo is successfully retrieved
      onPhotoDataSuccess : function(imageData) {
        // Uncomment to view the base64-encoded image data
        //console.log(imageData);
        console.log("image success");
        
        // Get image handle
        //
        // var smallImage = document.getElementById('smallImage');

        // Unhide image elements
        //
        // smallImage.style.display = 'block';

        // Show the captured photo
        // The in-line CSS rules are used to resize the image
        //
        // smallImage.src = "data:image/jpeg;base64," + imageData; HEAD
        PinsterApp.fields.dataImage = imageData;
      },

      onFail : function(message) {
        alert('Failed because: ' + message);
      }

    },
    
        foursquare : {
      
        getFoursquareNearPlaces : function(lat, lng)
        {
            var foursquareBarStrArr = [];
            var foursquareFields = [];
            var foursquareField = {};
            $("#fourSquareBar").text("");
          
          $.ajax({

              url: 'https://api.foursquare.com/v2/venues/search?ll=' + lat + ',' + lng +'&intent=browse&radius=30&limit=3&client_id=' + PinsterApp.CONSTANTS.CLIENT_ID_foursquare + '&client_secret=' + PinsterApp.CONSTANTS.CLIENT_SECRET_foursquare + '&v=20140503',
              type: "GET",
              dataType: "json",
              async:true,

              //success of fetching json
              success: function (json)
              {
                 var venues = json.response.venues;
          
                for(var i = 0; i < venues.length; i++)
                {  
                     foursquareField = {};
                     foursquareField.venueID = venues[i].id;
                     foursquareField.name = venues[i].name;
                     foursquareField.tips = PinsterApp.foursquare.getFoursquareTips(venues[i].id);
                     foursquareFields[i] = foursquareField;
                }

                console.log(foursquareFields);
                //add to UI ele

               foursquareFields.forEach(function(item){              

                   item.tips.forEach(function(tip, index){
                      foursquareBarStrArr.push("<b> " + item.name + " :</b> " + tip + "");                      
                   });
               });

                var k = 0;
               var foursquareInterval =  setInterval(function()
                {
                  $("#fourSquareBar").html(""); 
                  $("#fourSquareBar").html(foursquareBarStrArr[k]);
                  k++;

                  if(k == foursquareBarStrArr.length)
                  {
                    clearInterval(foursquareInterval);
                  }
                }, 3000);
               // $("#fourSquareBar").text(foursquareFields);

              },
              
              //failure of fetching json
              error: function ()
              {
                  console.log("error: Foursquare API - Places info fetching");
              }

            });

        },

        getFoursquareTips : function(venueID)
        {
            var venueTips = [];
       
            $.ajax({

              url: 'https://api.foursquare.com/v2/venues/'+ venueID +'/tips?sort=popular&limit=5&client_id=' + PinsterApp.CONSTANTS.CLIENT_ID_foursquare + '&client_secret=' + PinsterApp.CONSTANTS.CLIENT_SECRET_foursquare + '&v=20140503',
              type: "GET",
              dataType: "json",
              async:false,

              //success of fetching json
              success: function (json)
              { 
                 var temp  = [];
                 var tips = json.response.tips.items;
                 
                 for(var i = 0; i < tips.length; i++)
                 {
                      temp[i] = tips[i].text;
                 }
                 venueTips = temp;
               },
              
              //failure of fetching json
              error: function ()
              {
                  console.log("error: Foursquare API  -Tips fetching");
              }

            });

              return venueTips;
         },
    },
 };
