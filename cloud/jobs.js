// Handles event deletion in the application
// Should be set to run hourly
Parse.Cloud.job("eventDeletionJob", function(request, status) 
{
  // Query all events
  var query = new Parse.Query(Parse.Event);

  query.find(
  {
    success: function(results) 
    {
      results.forEach(function(eventObj, index) 
      {
        if (eventObj.deleteReqs >= 3)
        {
          // Remove event from database
          eventObj.destroy({});
        }
        else if (eventObj.category == 'Sports')
        {
          var timeDiff = Math.abs(eventObj.createdAt - new Date().getTime());
          var diffHours = Math.ceil(timeDiff / (1000 * 3600 * 24 * 60));

          // Sports events expiration is 3 hours
          if (diffHours >= 3)
          {
            // Remove event from database
            eventObj.destroy({});
          }
        }
        else if (eventObj.category == 'Hazrads')
        {
          var timeDiff = Math.abs(eventObj.createdAt - new Date().getTime());
          var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

          // Hazards events expiration is 1 day
          if (diffDays >= 1)
          {
            // Remove event from database
            eventObj.destroy({});
          }
        }
      });

      // Set the job's success status
      status.success("eventDeletionJob completed successfully.");
    },
    error: function(object, error) 
    {
      // Set the job's error status
      status.error("Uh oh, something went wrong in: eventDeletionJob.");
    } 
  });
});

