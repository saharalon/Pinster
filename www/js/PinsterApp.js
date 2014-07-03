var PinsterApp = {

    fields : {

      currentLanguage : "עברית",
      markers : [],
      eventsHashMap : {},
      user : {},
      utils : {},
      map : {},
      mapInstance : {},
      searchArea : {},
      geocoder : {},
      directionsDisplay: {},
      directionsService: {},
      destination: {},
      infowindow : {},
      watchID: null,
      currentPosition: {},
      dataImage: null,
      foursquareInterval: {},
      currentEventId: "",
      currentSearchCategory : {},
      currentWindow : "main",
    },

    CONSTANTS : {

      METERS : 1000,
      CLIENT_ID_foursquare : "XWLOQFQSYT5KYGPKYHJS4GGMAAZI51IPQ2WSIRUAA5PTSPFB",
      CLIENT_SECRET_foursquare : "HXRLKL1U422VH5JZGLMN2UHHZIRDWH44P0CMDXN2OQK0FK1Z",
      GPS_SETTINGS : { enableHighAccuracy: true, maximumAge:3000, timeout: 15000 },
      pinImgs : {},
      categories : [],
    },

    initialize : function () {

      document.addEventListener('deviceready', PinsterApp.onDeviceReady, false);

    },

    // deviceready Event Handler

    onDeviceReady : function() {

      console.log("deviceReady");
      var that = PinsterApp;
      // that.receivedEvent('deviceready');

     //  var fbLoginSuccess = function (userData) {
     //     PinsterApp.log("UserInfo: " + JSON.stringify(userData));
     //  };

     // if (isPhone)
     // {
     //    facebookConnectPlugin.login(["basic_info"],
     //        fbLoginSuccess,
     //        function (error) { PinsterApp.log("" + error); }
     //    );
     //  }

      //Android back key
      document.addEventListener("backbutton", that.handleBackbutton, false);

      //Android search key (magnifying glass) - search events
      document.addEventListener("searchbutton", that.searchEvents, false);

      document.addEventListener("menubutton", function() {
        PinsterApp.fields.currentWindow = "settings";
        $("#settingsModal").modal();
      }, false);
      
      document.addEventListener("offline", that.offlineSignalEvent, false);

      var options = { enableHighAccuracy: true, timeout: 1000, frequency: 3000 };
      //watchID = navigator.geolocation.watchPosition(that.onPositionSuccess, that.onPositionError, options);

    },

    onDocumentReady: function() {

      var that = this;

      Parse.initialize("4ChsdpMV3dxl3PNBzWTi3wHX5dfpt9Ddnm1t31Db",
        "HksWttYlv8V6K07OsrV3aeQMED3XOCTmO2iYvKqn");

      that.fields.utils = new that.Utils();
      that.fields.utils.initCategories(function() {
        
        // Init the map only after the ategories are loaded
        that.fields.map = new that.GoogleMap();
        that.fields.geocoder = new google.maps.Geocoder();
        that.fields.map.initialize();

      });

      that.registerEvents();

      that.fields.user = new that.User();
      that.fields.user.settings.init();

      that.fields.utils.setAppLanguage(that.fields.currentLanguage);

      //that.fields.user.searchData.getSmartRandomEvent();

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
        that.returnFromSearchToMain(e);
      });

      $(".fancyBtn").on("touchstart", function(){
        $(this).addClass('fancyBtnDown');
      });
        
      $(".settingsBtn").on("touchend", function(){
        PinsterApp.fields.currentWindow = "settings";
      });

      $(".reportBtn").on("touchend", function(){
        $(".fancyBtn").removeClass('fancyBtnDown');
        PinsterApp.fields.currentWindow = "reportEvent";
      });

      $(".randomEventBtn").on("touchend", function(){
        $(".fancyBtn").removeClass('fancyBtnDown');
      });

      $(".settingsBtn").click(function(){
        PinsterApp.fields.currentWindow = "settings";
        $("#settingsModal").modal();
      });

      $(".reportBtn").click(function(){
        PinsterApp.fields.currentWindow = "reportEvent";
        $("#reportModal").modal();
      });

      $(".randomEventBtn").click(function(){
        that.fields.user.searchData.getSmartRandomEvent();
      });

      $('#settingsModal').on('hidden.bs.modal', function () {
          PinsterApp.fields.currentWindow = "main";
      });

      $('#reportModal').on('hidden.bs.modal', function () {
          PinsterApp.fields.currentWindow = "main";
      });

      $("#settingsModal #languageDropdownMenu li a").click(function(){
        var language = $(this).text(),
            languageText = "English";
        if (language.match('עברית')) { languageText = "עברית"; language = 'Hebrew'; }
        else if (language.match('English')) { language = 'English'; }
        $("#languageDropdownMenu").html(languageText + "<img src='img/" + language + ".png' style='width: 20px; left: 6px; position: absolute; top: 9px;' /><span class='caret caretRight'></span>");
      });

      $("#settingsModal #categoryDropdownMenu li a").click(function(){
        $("#dropdownMenu1").html($(this).text() + '<span class="caret caretRight"></span>');
      });

      $("#reportModal .dropdown-menu li a").click(function(){
        $("#dropdownMenu2").html($(this).text() + '<span class="caret caretRight"></span>');
      });

      $("#settingsSaveBtn").click(function() {

        var user = that.fields.user;
        var map = that.fields.map;

        var language = $("#languageDropdownMenu").text();
        if (language.match('עברית')) { language = 'עברית'; }
        else if (language.match('English')) { language = 'English'; }
        var category = $("#dropdownMenu1").text();

        that.fields.currentLanguage = language;
        user.settings.setLanguage(language);
        user.settings.setAddress($("#settingsModal #address").val());
        user.settings.setCategory(category);
        user.settings.setRadius($('#radiusSlider').val());

        that.fields.utils.setAppLanguage($("#languageDropdownMenu").text());
        //map.filterMarkers(category.toLowerCase());

      });

      $('#reportBtnModal').click(function() {

        var that = PinsterApp;

        // if (that.fields.user.isUserLoggedIn())
        // {
              that.reportAnEvent();
        // }
        // else
        // {
        //   that.log("You need to be logged in order to report an event");
        // }

      });

      $('#wazeBtn').click(function() {
          window.open("waze://?q=" + $("#eventLocationStr").text() + "", '_system', 'location=yes');
      });

      $('#likeBtn').click(function() {

        var Event = Parse.Object.extend("Event");
        var eventObj = new Event();
        eventObj.id = PinsterApp.fields.currentEventId;

        eventObj.increment("likes", 1);

        // Save
        eventObj.save(null, {
          success: function(eventObj) {
            // Saved successfully.
            $("#numOfLikes").text(eventObj._serverData.likes);
            PinsterApp.initEventDeleteReqs();
          },
          error: function(eventObj, error) {
            console.log("Error incrementing event likes");
          }
        });

      });

      $('#hyperlapseBtn').click(function() {

        // that.closeEventModal();
        PinsterApp.fields.currentWindow = "simulation";

        navigator.geolocation.getCurrentPosition(
            that.onCurrentLocationForHyperlapseSuccess, that.onCurrentLocationError,
              PinsterApp.CONSTANTS.GPS_SETTINGS);

        // For debuging on local host
        //that.showHyperlapse(new google.maps.LatLng(31.911441999999994,34.8078167), PinsterApp.destination);
      
      });

      $('#quickSearch').click(function(){
        if ($("#eventsResults").is(":visible")) { $("#eventsResults").hide(); }
        if (!$("#searchByCatTooltip").is(":visible")) { PinsterApp.addSearchByCatElem(); }
      });

      //Enter key - search events
      $('#quickSearch').keypress(function( event ) {
        
        if ( event.which == 13 ) {
          event.preventDefault();
          PinsterApp.searchEvents();
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
        that.closeEventModal();
      });

      // ESC pressed
      $(document).keyup(function(e) {
        if (e.keyCode == 27 && PinsterApp.fields.currentWindow == "event")
        {
          that.closeEventModal();
        }
      });

      $(".removeEventBtn").click(function(){
        that.log("We got your feedback, thanks...");
        that.incrementEventDeleteReqs();
        that.closeEventModal();
      });

      $("#searchByCatTooltip .glyphicon-chevron-up").click(function(e){
        e.stopPropagation();
        $(".categories").scrollTop($(".categories").scrollTop() - 32);
      });

      $("#searchByCatTooltip .glyphicon-chevron-down").click(function(e){
        e.stopPropagation();
        $(".categories").scrollTop($(".categories").scrollTop() + 32);
      });

      // bind a listener for categories picker
      that.scrollStoppedListener(that.handleCatPicker);

    },  // END of registerEvents()

    log : function (msg) {

      if (isPhone) { window.plugins.toast.show(msg); }
      else { alert(msg); }

    },

    addSearchByCatElem : function() {

      var that = this;

      that.fields.currentWindow = "eventsSearch";
      var elem = $("#searchByCatTooltip .categories"),
          image;

      elem.html("");
      elem.append("<div class='categoryRow' style='margin-top: 6px;'>&nbsp;</div>");

      that.CONSTANTS.categories.forEach(function(item) {
        image = that.CONSTANTS.pinImgs[item];
        elem.append("<div class='categoryRow'><span style='margin-left: 30px;'>" + item + "</span><img class='' style='width: 18px;float: right;margin-top: -2px;margin-right: 8px;' src='img/" + image + "' /></div>");
      });

      elem.append("<div class='categoryRow'>&nbsp;</div>");
      
      $("#searchByCatTooltip").show();

    },

    scrollStoppedListener : function(handleCatPicker) {
      $(".categories").scroll(function(){
          var self = this, $this = $(self);
          if ($this.data('scrollTimeout')) {
            clearTimeout($this.data('scrollTimeout'));
          }
          $this.data('scrollTimeout', setTimeout(handleCatPicker,250,self));
      });
    },

    handleCatPicker : function(){

      var rowHeight = $(".categoryRow").height(),
          diff = $(".categories").scrollTop(),
          level = parseInt(diff / rowHeight),
          image,
          scrollTo;

      // console.log(diff);
      diff = diff - (level * rowHeight);
      if (diff > (rowHeight / 2) - 1) {
        // console.log("higher: " + diff);
        scrollTo = (level * rowHeight) + rowHeight;
      }
      else {
        // console.log("lower: " + diff);
        scrollTo = level * rowHeight;
      }

      clearTimeout($(".categories").data('scrollTimeout'));
        $(".categories").unbind();
        $(".categories").animate({scrollTop: scrollTo}, 250, 'swing', function(){});
        PinsterApp.currentSearchCategory = PinsterApp.CONSTANTS.categories[(scrollTo / rowHeight)];
        image = PinsterApp.CONSTANTS.pinImgs[PinsterApp.currentSearchCategory];
        $("#searchBar .filterPin").attr('src', 'img/' + image);
        // console.log("category no. " + (scrollTo / rowHeight) + " was selected.");
        setTimeout(function(){
          PinsterApp.scrollStoppedListener(PinsterApp.handleCatPicker);
        }, 500);

    },

    returnFromSearchToMain : function (e) {
      if (e.target.id != "quickSearch" &&
          e.target.className != "eventResRow" &&
          e.target.id != "eventModalClose" &&
          e.target.className != "categoryRow" &&
          e.target.className != "catGlass" &&
          e.target.id != "searchByCatTooltip" &&
          e.target.id != "searchTipText") {
          $("#eventsResults").hide();
          $("#searchByCatTooltip").hide();
        }
    },

    closeEventModal : function() {

      PinsterApp.fields.currentWindow = "main";
      $("#wazeBtn").hide();
      $("#likeBtn").hide();
      $("#numOfLikes").hide();
      $("#eventModal").hide();
      $("#eventImg").attr("src","img/no-image.png");
      // Make sure the foursquare display interval is cleared
      clearInterval(PinsterApp.fields.foursquareInterval);

    },

    closeReportModal : function(isError) {
      clearInterval(PinsterApp.fields.animateReport);
      $("#reportBtnModal .glyphicon-bullhorn").show();
      $(".mayTakeAMin").hide();
      if (!isError) {
        PinsterApp.fields.currentWindow = "main";
        $("#reportModal").modal('hide');
      }
    },

    closeSimulation : function () {

      var that = this;
      that.fields.currentWindow = "event";
      // @idogold : maybe some more code needed here to free memory or somthing
    },

    reportAnEvent : function() {
      
      var that = this;

      if ($("#reportModal #dropdownMenu2").text().match(that.fields.utils.getText("dropdownMenu2", that.fields.currentLanguage))) {
        $("#reportModal #dropdownMenu2").css("border", "1px solid red");
        return;
      }
      if ($("#reportModal #eventTitle").val() == "") {
        $("#reportModal #dropdownMenu2").css("border", "1px solid #ccc");
        $("#reportModal #eventTitle").css("border", "1px solid red").focus();
        return;
      }

      $("#reportModal #dropdownMenu2").css("border", "1px solid #ccc");
      $("#reportModal #eventTitle").css("border", "1px solid #ccc");

      that.fields.animateReport = setInterval(function() {
        $("#reportBtnModal .glyphicon-bullhorn").fadeOut().fadeIn();
      }, 400);
      $(".mayTakeAMin").show();

      navigator.geolocation.getCurrentPosition(
        that.onCurrentLocationSuccess, that.onCurrentLocationError,
          that.CONSTANTS.GPS_SETTINGS);

    },

    handleBackbutton : function() {

      var that = PinsterApp;

      function handleMain() {
        if (that.fields.mapInstance.getZoom() > 10) { that.fields.mapInstance.setZoom(10); }
        else { navigator.app.exitApp(); }
      }

      if (that.fields.currentWindow == "main") {
        handleMain();
      }
      else if (that.fields.currentWindow == "event") {
        that.closeEventModal(); // this function also changing currentWinow to = "main"
      }
      else if (that.fields.currentWindow == "reportEvent") {

        that.fields.currentWindow = "main";
        $("#reportModal").modal('hide');
      }
      else if (that.fields.currentWindow == "settings") {
        that.fields.currentWindow = "main";
        $("#settingsModal").modal('hide');
      }
      else if (that.fields.currentWindow == "eventsSearch") {
        
        if (!$("#eventsResults").is(":visible") && !$("#searchByCatTooltip").is(":visible")) { handleMain(); }
        else {
          that.fields.currentWindow = "main";
          $("#eventsResults").hide();
          $("#searchByCatTooltip").hide();
          PinsterApp.removeSearchArea();
        }
      }
      else if (that.fields.currentWindow == "simulation") {
        that.closeSimulation(); // this function also changing currentWinow to = "event"
      }
      else if (that.fields.currentWindow == "googleStreetView") {
        // TODO
      }

    },

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
              PinsterApp.fields.dataImage, eventAddress, Parse.User.current());
      });
    },

    onCurrentLocationForRouteSuccess : function(position) {

      var currentLocation =
        new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        
      PinsterApp.calcRoute(currentLocation);

    },

    onCurrentLocationForHyperlapseSuccess : function(position) {

      var currentLocation =
        new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        
      that.showHyperlapse(currentLocation, PinsterApp.destination);

    },

    // Error Callback receives a PositionError object
    onCurrentLocationError : function(error) {

      PinsterApp.closeReportModal(true);
      PinsterApp.log(PinsterApp.fields.utils.getText("gps_error", PinsterApp.fields.currentLanguage));
    },

    offlineSignalEvent : function() {

      PinsterApp.log("You are offline, FYI - this App needs Internet connectivity");
    },

    searchEvents : function() {

      var that = this;

      PinsterApp.fields.aniMagnify = setInterval(function() {
        $("#quickSearchBtn").fadeOut().fadeIn();
      }, 400);

      that.fields.currentWindow = "eventsSearch";
      $("#searchByCatTooltip").hide();

      //get address from address element
      var address = $('#quickSearch').val();
      //get radius from radius ele, divide with 1000, to get KM
      var radius = $('#radiusSlider').val() / that.CONSTANTS.METERS;

      // collect user searches
      var tmpObj = JSON.parse(localStorage.getItem("pinsterSearches"));
      tmpObj.addresses.push(address);
      localStorage.setItem("pinsterSearches", JSON.stringify(tmpObj));

      // No address given, search by category
      if (address == "")
      {
        that.fields.user.searchEvents(address, radius);
        return;
      }
        
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
          var language = that.fields.currentLanguage;
          var msg = that.fields.utils.getText("no_results", language);
          clearInterval(PinsterApp.fields.aniMagnify);
          $("#quickSearchBtn").show();
          $("#eventsResults").html('');
          $("#eventsResults").append("<div class='eventResRow' style='margin-top: 40px;'>" + msg + "...</div>");
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
        PinsterApp.log("this App works great with GPS on, Please turn on GPS");
        console.log(error.code + "  " + error.message);
    },

    convertToGeoPointObject : function(latitude, longitude) {
      //get geopoint from lat/lng
      return new Parse.GeoPoint({latitude: latitude, longitude: longitude});
    },

    sliderOutputUpdate : function(val) {

      var that = this;

      var language = that.fields.currentLanguage;

      var text = that.fields.utils.getText("radius", language);
      var metersStr = that.fields.utils.getText("meters", language);
      var kilometersStr = that.fields.utils.getText("kilometers", language);
      
      if (val < that.CONSTANTS.METERS) {
        document.querySelector('#output').value = text + val + metersStr;
      }
      else {
        document.querySelector('#output').value = text + val / that.CONSTANTS.METERS + kilometersStr;
      }

    },

    incrementEventDeleteReqs : function() {

      var Event = Parse.Object.extend("Event");
      var eventObj = new Event();
      eventObj.id = PinsterApp.fields.currentEventId;

      eventObj.increment("deleteReqs", 1);

      eventObj.save(null, {
        success: function(eventObj) { },
        error: function(eventObj, error) { console.log("Error: incrementEventDeleteReqs"); }
      });

    },

    initEventDeleteReqs : function() {

      var Event = Parse.Object.extend("Event");
      var eventObj = new Event();
      eventObj.id = PinsterApp.fields.currentEventId;

      eventObj.set("deleteReqs", 0);

      eventObj.save(null, {
        success: function(eventObj) { },
        error: function(eventObj, error) { console.log("Error: initEventDeleteReqs"); }
      });

    },

    addressToGeopoint : function(address, callback) {

      // Geocoder converts coordinates to addresses
      var geocoder = new google.maps.Geocoder();

      // Convert the current position to actual address
      geocoder.geocode({ "address": address }, function(results, status) {
        
        if (status == google.maps.GeocoderStatus.OK)
        {
          if (typeof(callback) == 'function')
            callback(results[0].geometry.location);
        }
        else
        {
          if (typeof(callback) == 'function')
            callback(""); 
        }

      });

    },

    showEventAddress : function(position, hasDesc) {

      // Geocoder converts coordinates to addresses
      var geocoder = new google.maps.Geocoder();

      // Convert the current position to actual address
      geocoder.geocode({ "location": position }, function(results, status) {
        
        if (status == google.maps.GeocoderStatus.OK)
        {
          $("#eventLocationStr").text(results[0].formatted_address);
          if (hasDesc) { $("#eventLocationStr").css('border-bottom', '1px solid rgb(69, 168, 247)'); }
          else { $("#eventLocationStr").css('border', 'none'); }
        }

      });

    },

    calcRoute : function(currentLocation) {

      var that = PinsterApp;

      that.closeEventModal();
      that.currentPosition = currentLocation;
      // Convert the coordinates to addresses
      this.geoPointToAddress(that.currentPosition, that.destination);
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

    showHyperlapse : function(origin, destination) {

      var hyperlapse = new Hyperlapse(document.getElementById('hyperlapseModal'), {
        //lookat: new google.maps.LatLng(32.0898263, 34.8028122),
        zoom: 1,
        use_lookat: false,
        elevation: 50
      });

      hyperlapse.onError = function(e) {
        console.log(e);
      };

      hyperlapse.onRouteComplete = function(e) {
        $("#hyperlapseModal").show();
        hyperlapse.load();
      };

      hyperlapse.onRouteProgress = function(e) {
        $("#hyperlapseSpinner").show();
      };

      hyperlapse.onLoadComplete = function(e) {
        $("#hyperlapseSpinner").hide();
        hyperlapse.play();
      };

      // Google Maps API stuff here...
      var directions_service = new google.maps.DirectionsService();

      var route = {
        request:{
          origin: origin,
          destination: destination,
          travelMode: google.maps.DirectionsTravelMode.DRIVING
        }
      };

      directions_service.route(route.request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          hyperlapse.generate( {route:response} );
        } else {
          console.log(status);
        }
      });

    },

    removeSearchArea : function()
    {
      if (PinsterApp.fields.searchArea.setMap != undefined)
      PinsterApp.fields.searchArea.setMap(null);
    },

    showSearchArea : function(address, radius)
    {
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
    },

    GoogleMap : function() {

      var that = this;
        
      this.initialize = function()
      {
        var userAddress = PinsterApp.fields.user.settings.address;
        // Try to center the map in the user preffered location
        PinsterApp.addressToGeopoint(userAddress, function(location) {
            PinsterApp.fields.mapInstance = showMap(location);
            loadMarkers(PinsterApp.fields.mapInstance);
        });
      };
      
      var loadMarkers = function(map)
      {
        var marker;

        // Retreive events from the databas
        var Event = Parse.Object.extend("Event");
        var query = new Parse.Query(Event);

        // var currentTime = new Date();
        // Subtract one day from today's time to search
        // only events that had been updated at the last 24 hours
        // currentTime.setDate(currentTime.getDate() - 1);
        // var time = new Date(currentTime.getTime());
        // query.greaterThanOrEqualTo('updatedAt', time);

        // Don't load events with status id 99 (deleted)
        query.notEqualTo('statusId', 99);

        query.find({
            success: function(results) {
              results.forEach(function(item, index) {
                var title = item._serverData.title;
                var latitude = item._serverData.location._latitude;
                var longitude = item._serverData.location._longitude;
                // TODO: load from database
                var path = "img/";
                var image = PinsterApp.CONSTANTS.pinImgs[item._serverData.category];

                if (image == undefined)
                  image = "defaultPin.png"; 

                // Image for the marker
                var markerImage = {
                    url: path + image
                };

                marker = new google.maps.Marker({
                  id: item.id,
                  createdAt: item.createdAt,
                  position: new google.maps.LatLng(latitude, longitude),
                  map: map,
                  icon: markerImage,
                  //shape: shape,
                  title: title,
                  category: item._serverData.category 
                  //zIndex: events[i][3]
                });

                PinsterApp.fields.eventsHashMap[item.id] = marker;
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
                  var createdAt = results[index].createdAt;
                  PinsterApp.fields.currentEventId = results[index].id; 
                  var hasDesc = true;

                  var geoLocation = new google.maps.LatLng(
                    userEvent.location.latitude, userEvent.location.longitude);

                  // Set event location as our destination
                  // in case the user will want to drive there
                  PinsterApp.destination = geoLocation;

                  // collect user searches
                  var tmpObj = JSON.parse(localStorage.getItem("pinsterSearches"));
                  tmpObj.eventsCategory.push(userEvent.category);
                  localStorage.setItem("pinsterSearches", JSON.stringify(tmpObj));

                  $("#eventModalLabel").text(userEvent.title);
                  $("#eventDesc").text(userEvent.description);

                  //new save with col imageFile
                  if (userEvent.imageFile) {
                    var photo = userEvent.imageFile;
                    $("#eventImg").attr("src", photo.url());
                  }
                  
                  else
                  {
                    var steetViewImage = 'http://maps.googleapis.com/maps/api/streetview?size=1200x600&' +
                      'location=' + geoLocation +'&heading=151.78&pitch=-0.76';
                    // When no image is available, use an image from street view
                    $("#eventImg").attr("src", steetViewImage);  
                  }

                  if (userEvent.description == "") { hasDesc = false; }

                  $("#numOfLikes").text(userEvent.likes);
                  $(".stamp").text("By: KrugerStein67, in " + PinsterApp.fields.utils.formatDate(createdAt));

                  PinsterApp.showEventAddress(geoLocation, hasDesc);
                  
                  //foursquare tests
                  PinsterApp.foursquare.getFoursquareNearPlaces(
                    userEvent.location.latitude, userEvent.location.longitude);
                                
                  PinsterApp.fields.currentWindow = "event";
                  $("#eventModal").show();

                  setTimeout(function() {
                    $("#wazeBtn").fadeIn();
                    $("#likeBtn").fadeIn();
                    $("#numOfLikes").fadeIn();
                  }, 750);

                }
                })(marker, index));
              });

            },
            error: function(object, error) {
              // The object was not retrieved successfully.
              // error is a Parse.Error with an error code and description.
              PinsterApp.log("Failed to retreive events from the database");
            }
        });
      };
      
      var showMap = function(location) {

        directionsService = new google.maps.DirectionsService();
        directionsDisplay = new google.maps.DirectionsRenderer();
        infowindow = new google.maps.InfoWindow();
        var initalLocation = new google.maps.LatLng(31.8759, 34.734948); 

        if (location != "")
          initalLocation = location; 

        var style = [ { "stylers": [ { "visibility": "simplified" } ] },{ "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [ { "visibility": "on" }, { "color": "#838080" } ] },{ "featureType": "administrative.province", "stylers": [ { "visibility": "on" } ] },{ "featureType": "administrative.locality" },{ "featureType": "administrative.neighborhood", "stylers": [ { "visibility": "on" } ] },{ "featureType": "administrative", "stylers": [ { "visibility": "on" } ] },{ "elementType": "labels.text.fill", "stylers": [ { "color": "#54b5da" } ] },{ "featureType": "water", "elementType": "geometry.fill", "stylers": [ { "color": "#c4e3ff" } ] },{ "featureType": "landscape.man_made", "stylers": [ { "color": "#ececef" }, { "saturation": 5 }, { "lightness": -4 } ] },{ "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [ { "visibility": "on" }, { "color": "#ff755c" } ] },{ "featureType": "road", "elementType": "geometry.fill", "stylers": [ { "color": "#ffffff" } ] },{ "featureType": "landscape.natural.terrain", "elementType": "geometry.fill", "stylers": [ { "color": "#a0ccb5" }, { "visibility": "off" } ] },{ "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [ { "color": "#badfbb" }, { "visibility": "simplified" } ] },{ },{ "featureType": "landscape.natural.landcover", "elementType": "geometry", "stylers": [ { "color": "#f4f7f6" } ] },{ "featureType": "landscape.natural", "stylers": [ { "visibility": "simplified" }, { "color": "#f4f4f6" } ] },{ },{ "featureType": "road", "elementType": "labels.text.fill", "stylers": [ { "visibility": "on" }, { "color": "#8d8c8c" } ] },{ } ];

        var mapOptions = {
          zoom: 14,
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
                //PinsterApp.fields.map.filterMarkers($("#dropdownMenu1").text().toLowerCase());
                // navigator.splashscreen.hide();
          });

        map.setCenter(initalLocation);

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
        PinsterApp.log('Failed because: ' + message);
      }

    },
    
    foursquare : {
      
        getFoursquareNearPlaces : function(lat, lng)
        {
            var foursquareBarStrArr = [];
            var foursquareFields = [];
            var foursquareField = {};

            var utils = PinsterApp.fields.utils;
            var language = PinsterApp.fields.currentLanguage;

            $(".fsq-content").html("<h4>" + utils.getText("fsq-content-search", language) + "</h4>");
          
          $.ajax({

              url: 'https://api.foursquare.com/v2/venues/search?ll=' + lat + ',' + lng +'&intent=browse&radius=30&limit=3&client_id=' + PinsterApp.CONSTANTS.CLIENT_ID_foursquare + '&client_secret=' + PinsterApp.CONSTANTS.CLIENT_SECRET_foursquare + '&v=20140503',
              type: "GET",
              cache: false,
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

                if (foursquareBarStrArr.length > 0) {

                  var k = 0;
                  PinsterApp.fields.foursquareInterval = setInterval(function()
                    {
                      $(".fsq-content").html("");
                      if (foursquareBarStrArr[k] == "") { k++ }
                      $(".fsq-content").html(foursquareBarStrArr[k]);
                      k++;

                      if(k == foursquareBarStrArr.length)
                      {
                        k = 0;
                      }
                    }, 3000);
                }
                else {
                  $(".fsq-content").html("<h4>" + utils.getText("fsq-content-not-found", language) + "</h4>");
                }

              },
              
              //failure of fetching json
              error: function ()
              {
                $(".fsq-content").html("<h4>" + utils.getText("fsq-content-not-found", language) + "</h4>");
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
              cache: false,
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
