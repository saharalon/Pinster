
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});

Parse.Cloud.define("getRecommendedEvents", function(request, response) {
  response.success([{title: "event1"},{title: "event2"},{title: "event3"}]);
});
