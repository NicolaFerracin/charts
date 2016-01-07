app.controller('IndexController', ['$scope', '$http', '$window', function($scope, $http, $window) {

  // initialize variables
  $scope.user = null;
  $scope.searchString = ""; // holds the search term for searching bars in a different location
  $scope.bars = []; // to store the bars retrieved by location or coordinates
  $scope.barsIds = []; // to store only the ids of the bars retrieved by location or coordinates
  $scope.userBars = []; // to store the bars the user is going to
  $scope.userBarsIds = []; // to store only the ids of the bars the user is going to
  $scope.barsWithAttendants = []; // array to store the bars and update their atendance
  var isFinished = 0; // +1 for each ajax call finished. After they all finished we can cross the data. Total amount = 3

  // get all bars with attendants so to check and upate the counters
  $http.get('/api/bars')
  .success(function(data) {
    $scope.barsWithAttendants = data;
    isFinished++;
    processAttendants($scope.barsWithAttendants);
  })
  .error(function(data) {
    console.log('Error: ' + data);
  });

  // check if user is loggedin and store user information
  $http.get("/loggedin")
  .success(function (data) {
    if (data) {
      $scope.user = data;
      // retrieve bars where user is going to
      if (data.bars.length > 0) {
        $scope.userBars = data.bars;
        for (var i = 0; i < data.bars.length; i++) {
          $scope.userBarsIds.push(data.bars[i].id);
        }
      }
    }
    else {
      $scope.user = null;
    }
    isFinished++;
    processAttendants($scope.barsWithAttendants);
  })
  .error(function (err) {
    console.log('Error: ' + err);
  });

  // get latitude and longitude and store to User global obj
  var options = {enableHighAccuracy:true}
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
  }

  // if geolocation successfull call yelp api and show result
  function onSuccess(position) {
    // call to yelp api using user's current location
    $http.get("/api/yelp/" + position.coords.latitude + "/" + position.coords.longitude)
    .success(function (data) {
      $scope.bars = data.businesses;
      // go through all the bars the user is going to one remove it from the results if it's there too
      for (var i = 0; i < $scope.bars.length; i++) {
        if ($.inArray($scope.bars[i].id, $scope.userBarsIds) > -1) {
          $scope.bars.splice(i, 1);
          i--;
        } else {
          $scope.barsIds.push($scope.bars[i].id);
        }
      }
      isFinished++;
      processAttendants($scope.barsWithAttendants);
    })
    .error(function (err) {
      console.log('Error: ' + err);
    });
  }

  // if geolocation gives error
  function onError() {
    alert("Geolocation is not supported by this browser.");
  }

  // manage user signing up to a bar
  $scope.barSignUp = function(bar, index) {
    // if user is logged out redirect to login
    if ($scope.user == null) {
      window.location.href = '/login';
    }
    else {
      // manage user entry in DB
      // check if bar already in user's bars list and return
      if ($.inArray(bar.id, $scope.userBarsIds) > -1) {
        alert("You are already going to this bar.");
        return;
      } else {
        $scope.userBars.push(bar);
        $scope.userBarsIds.push(bar.id);
        $scope.bars.splice(index, 1);
        // add 1 attendant to people going to bar
        if($scope.userBars[$scope.userBars.length - 1].attendants == undefined) {
          $scope.userBars[$scope.userBars.length - 1].attendants = 1;
        } else {
          $scope.userBars[$scope.userBars.length - 1].attendants += 1;
        }
        // add bar to user bars in DB
        updateUserAttendance($scope.user._id, $scope.userBars);
      }
      // manage bar entry in DB
      var barUpdate = {
        yelp_id : bar.id,
        action : 'add'
      };
      updateBarAttendance(barUpdate);
    }
  }

  var updateUserAttendance = function(_id, bars) {
    $http.post("/api/user/" + _id, bars)
    .success(function (data, status) {
      console.log('User bars list updated.');
    })
    .error(function (data) {
      console.log('Error: ' + data);
    });
  }

  // this function updates the bar entry in DB using the barUpdate obj, containing a yelp_id and an action that can be either add or remove
  var updateBarAttendance = function(barUpdate) {
    $http.post("/api/bar",  barUpdate)
    .success(function (data, status) {
      console.log('Bar attendance registered.');
    })
    .error(function (data) {
      console.log('Error: ' + data);
    });
  }

  $scope.barSignOut = function(bar, index) {
    // if user is logged out redirect to login
    if ($scope.user == null) {
      window.location.href = '/login';
    } else {
      // manage user entry in DB
      // remove bar from user.bars array of bars the user is going to
      $scope.userBars.splice(index, 1);
      // remove bar id from userBarsIds of ids of bars the user is going to
      $scope.userBarsIds.splice(index, 1);
      // add bar to user bars in DB
      updateUserAttendance($scope.user._id, $scope.userBars);
      // manage bar entry in DB
      var barUpdate = {
        yelp_id : bar.id,
        action : 'remove'
      };
      updateBarAttendance(barUpdate);
    }
  }

  var processAttendants = function(arr) {
    if (isFinished < 3) {
      console.log("wait for all ajax calls to finish. Calls left: " + (3 - isFinished));
    } else {
      isFinished = 0;
      for (var i = 0; i < arr.length; i++) {
        console.log(arr[i])
        // if a bar has attendants
        if (arr[i].attendants > 0) {
          // check if bar in user bars list and update it
          if ($.inArray(arr[i].yelp_id, $scope.userBarsIds) > -1) {
            console.log("the user is going to one of the bars with attendants");
            // add +1 to attendants in userBars that are shown in the view
            var index = $.inArray(arr[i].yelp_id, $scope.userBarsIds);
            $scope.userBars[index].attendants = arr[i].attendants;
          }
          // check if bar in result bar list and update it
          if ($.inArray(arr[i].yelp_id, $scope.barsIds) > -1) {
            console.log("the bars in the results have attendants")
            // add +1 to attendants in bars that are shown in the view
            var index = $.inArray(arr[i].yelp_id, $scope.barsIds);
            $scope.bars[index].attendants = arr[i].attendants;
          }
        }
      }
    }
  }

  $scope.search = function(searchString) {
    if (searchString == "") {
      return;
    }
    // call to yelp api using user's current location
    $http.get("/api/yelp/" + searchString)
    .success(function (data) {
      console.log(data);
      $scope.bars = data.businesses;
    })
    .error(function (err) {
      console.log('Error: ' + err);
    });
  }

  $scope.logout = function() {
    $http.get("/logout");
    $scope.user = null;
    window.location.href = '/';
  }
}]);
