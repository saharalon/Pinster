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

    Parse.initialize("4ChsdpMV3dxl3PNBzWTi3wHX5dfpt9Ddnm1t31Db", "HksWttYlv8V6K07OsrV3aeQMED3XOCTmO2iYvKqn");

    $("#loginBtn").click(function() {
        Parse.User.logIn($("#pinUsername").val(), $("#pinPassword").val(), {
            success: function (user) { console.log(user.attributes); },
            error: function (user, error) { console.log(user + " | " + error); }
        });

        Parse.Cloud.run('hello', {}, {
    success: function(result) 
    {
        alert(result);
        var Event = Parse.Object.extend("Event");
        var query = new Parse.Query(Event);
        query.find({
          success: function(results) {
            console.log(results[0]);
          },
          error: function(object, error) {
            // The object was not retrieved successfully.
            // error is a Parse.Error with an error code and description.
          }
        });
  
      },
      error: function(error) {
      }
    });
    });


});



///Save event on parse object
      // var Event = Parse.Object.extend("Event");
      //   var event = new Event();
         
      //   event.set("title", "Great street party");
      //   event.set("description", "Mosh ben ari is here!");
      //   var point = new Parse.GeoPoint({latitude: 40.0, longitude: -30.0});
      //   event.set("location", point);
         
      //   event.save(null, {
      //     success: function(event) {
      //       // Execute any logic that should take place after the object is saved.
      //       alert('New object created with objectId: ' + event.id);
      //     },
      //     error: function(event, error) {
      //       // Execute any logic that should take place if the save fails.
      //       // error is a Parse.Error with an error code and description.
      //       alert('Failed to create new object, with error code: ' + error.description);
      //     }
      //   });