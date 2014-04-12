/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {

        app.receivedEvent('deviceready');

       //var map = new GoogleMap();
       // map.initialize();
        
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

$(document).ready(function(){

    console.log("Document ready...");

    Parse.initialize("4ChsdpMV3dxl3PNBzWTi3wHX5dfpt9Ddnm1t31Db", 
       "HksWttYlv8V6K07OsrV3aeQMED3XOCTmO2iYvKqn");
     
    var map = new GoogleMap();
    map.initialize();

    $(".fancyBtn").mousedown(function(){
      $(this).addClass('fancyBtnDown');
      // $("#myModal").modal();
    });
    $(".fancyBtn").mouseup(function(){
      $(this).removeClass('fancyBtnDown');
    });
    // Define events
    $(".reportBtn").click(function(){
      $("#myModal").modal();
    });

    $(".searchBtn").click(function(){
      $("#searchModal").modal();
    });

});

function sliderOutputUpdate(vol)
{
  document.querySelector('#output').value = "Radius is: " + vol + " Kelometers";
}

function GoogleMap(){
    
    this.initialize = function(){
        var map = showMap();
        addMarkersToMap(map);
    }    
    
    var addMarkersToMap = function(map){
        // Image url for the markers
    var image = { 
        url: 'img/pin4.png'
    };

    // Shapes define the clickable region of the icon.
    // The type defines an HTML &lt;area&gt; element 'poly' which
    // traces out a polygon as a series of X,Y points. The final
    // coordinate closes the poly by connecting to the first
    // coordinate.
    var shape = {
    coord: [1, 1, 1, 20, 18, 20, 18 , 1],
    type: 'poly'
    };

    var infowindow = new google.maps.InfoWindow;
    var marker;

    // Retreive events from the database
    var Event = Parse.Object.extend("Event");
        var query = new Parse.Query(Event);
        query.find({
          success: function(results) {
            for (var i = 0; i < results.length; i++)
            {
              var title = results[i]._serverData.title;
              var latitude = results[i]._serverData.location._latitude;
              var longitude = results[i]._serverData.location._longitude;
              var zIndex = 4;

              marker = new google.maps.Marker({
            position: new google.maps.LatLng(latitude, longitude),
          map: map,
          icon: image, 
          //shape: shape,
          title: title,
          //zIndex: events[i][3]
        });

        google.maps.event.addListener(marker, 'click', (function(marker, i) {
          return function() {
            infowindow.setContent("<b>" + results[i]._serverData.title + "</b><br>" + results[i]._serverData.description);
            infowindow.open(map, marker);
          }
        })(marker, i));
            }
          },
          error: function(object, error) {
            // The object was not retrieved successfully.
            // error is a Parse.Error with an error code and description.
            alert("Failed to retreive events from the database");
          }
        });
    }
    
    var showMap = function(){

      var initialLocation = new google.maps.LatLng(31.8759, 34.734948);

      var mapOptions = {
        zoom: 12,
        zoomControl: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

        var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
        google.maps.event.addListenerOnce(map, 'idle', function(){
            //loaded fully
            console.log("Map loaded...");
            // navigator.splashscreen.hide();
        });

        map.setCenter(initialLocation);
        
        return map;
    }
}
