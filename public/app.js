// angular routing
var app = angular.module('ChartApp', []);

  app.controller('appController', ['$scope', '$http', function($scope, $http) {

    var isSender = false;

  var socket = io.connect();
  socket.on('stock.added', function (stock) {
    console.log("receiving stock.added message");
    if (isSender) {
      isSender = false;
      return;
    }
    // check if data is double
    var index = $scope.activeStocks.map(function (item) {
      return item.name;
    }).indexOf(stock.name);
    if (index > -1) {
      return;
    }
    getStockData(stock.name);
    socket.emit('my other event', { my: 'data' });
  });
  socket.on('stock.removed', function (stock) {
    console.log("receiving stock.removed message");
    if (isSender) {
      isSender = false;
      return;
    }
    var index = $scope.activeStocks.map(function (item) {
      return item.name;
    }).indexOf(stock.name);
    if (index < 0) {
      return;
    }
    // remove stock from activeStocks array
    $scope.activeStocks.splice(index, 1);
    $scope.$apply();
    // remove stock from dataChart for the chart visualization
    var i = dataChart[0].indexOf(stock.name);
    for (var x = 0; x < dataChart.length; x++) {
      dataChart[x].splice(i, 1);
    }
    // remove the color from the colorsUsed array to make it available again
    colorsUsed.splice(i - 1, 1);

    //draw the chart again
    drawChart();
  });

  // instantiate variables
  $scope.showError = false;
  var colors = ["#03C03C", "#779ECB", "#C23B22", "#FFD1DC", "#FDFD96", "#B39EB5", "#AEC6CF", "#FF6961", "#CB99C9", "#77DD77", "#966FD6", "#CFCFC4", "#F49AC2", "#B19CD9", "#836953", "#FFB347", "#DEA5A4"] // colors used to randomly assigned a color to each new stock added
  var colorsUsed = [];
  $scope.activeStocks = []; // holds all the stocks obj the user is looking at
  var sevenDays = new Date(); // used to get the date seven days ago
  sevenDays.setDate(sevenDays.getDate() - 7); // get the date of seven days ago
  var API_KEY = ".json?api_key=JdyZLwrscH221zT7yas7"; // API personal key
  var URL_START = "https://www.quandl.com/api/v3/datasets/WIKI/"; // beginning of the API call url
  var URL_DATE = "&start_date=" + sevenDays.getFullYear() + "-" + (sevenDays.getMonth() + 1) + "-" + sevenDays.getDate(); // start date for the api call
  var dataChart = [['Day']];

  // get the window height and stretch the vertical divider - 50 to show the footer
  $(".divider").css("min-height", $(window).height() - 70);
  $("#chart").css("height", $(window).height() - 260)

  // check the DB and retrieve the stocks currently active
  checkDatabase();

  // called when the user click on searching for a new stock
  $scope.search = function(stock) {
    isSender = true;
    stock.toLowerCase(); // make lower case and also check against a lower case string in the if statement
    // if stock already under visualization, return
    if ($scope.activeStocks.map(function(item) {return item.name.toLowerCase()}).indexOf(stock) > -1) {
      return;
    }
    // disable search
    $('#submit').prop('disabled', true);
    $('#input-search').prop('disabled', true);

    var url = URL_START + stock + API_KEY + URL_DATE;
    $http.get(url)
    .success(function(data) {
      var stockObj = {name : data.dataset.dataset_code, color : getRandomColor()}; // create stock obj for DB and the chart
      // save stock to DB
      $http.post("/api/stock/", stockObj)
      .success(function(status) {
        console.log(status);
      })
      .error(function(err) {
        console.log("There has been an error of communication with the server.");
        return;
      })
      // in case the error was showing, disable it now
      $scope.showError = false;
      // add stock code to table columns
      dataChart[0].push(data.dataset.dataset_code);
      var reversedArray = data.dataset.data.reverse();
      // for every day in the chart results
      for (var i = 0; i < reversedArray.length; i++) {
        // if the day already exists
        if (dataChart[i + 1]) {
          // add data to the existing day
          dataChart[i + 1].push(data.dataset.data[i][4]);
        } else {
          // else add the date and data to the dataChart array
          dataChart.push([data.dataset.data[i][0], data.dataset.data[i][4]]);
        }
      }
      $scope.activeStocks.push(stockObj);
      drawChart();
    })
    .error(function(err) {
      console.log("error!");
      $scope.showError = true;
      // re-enable search
      $('#submit').prop('disabled', false);
      $('#input-search').prop('disabled', false);
    })
  }

  // when user clicks on the X icon of one stock to remove it
  $scope.remove = function(stock, index) {
    isSender = true;
    // disable search
    $('#submit').prop('disabled', true);
    $('#input-search').prop('disabled', true);
    // remove stock from DB
    $http.delete("/api/stock/" + stock)
    .success(function(status) {
      console.log(status);
      // remove stock from activeStocks array
      $scope.activeStocks.splice(index, 1);
      // remove stock from dataChart for the chart visualization
      var i = dataChart[0].indexOf(stock);
      for (var x = 0; x < dataChart.length; x++) {
        dataChart[x].splice(i, 1);
      }
      // remove the color from the colorsUsed array to make it available again
      colorsUsed.splice(i - 1, 1);
      //draw the chart again
      drawChart();
    })
    .error(function(err) {
      console.log("There has been an error of communication with the server.");
      return;
    })
  }

  function checkDatabase() {
    // get all stocks under visualization
    $http.get("/api/stocks")
    .success(function(stocks) {
      // populate activeStocks array
      for (var i = 0; i < stocks.length; i++) {
        getStockData(stocks[i].name);
      }
    })
    .error(function(err) {
      console.log("There has been an error of communication with the server.")
    })
  }

  function getStockData(stock) {
    var url = URL_START + stock + API_KEY + URL_DATE;
    $http.get(url)
    .success(function(data) {
      var stockObj = {name : data.dataset.dataset_code, color : getRandomColor()}; // create stock obj for DB and the chart
      // add stock code to table columns
      dataChart[0].push(data.dataset.dataset_code);
      var reversedArray = data.dataset.data.reverse();
      // for every day in the chart results
      for (var i = 0; i < reversedArray.length; i++) {
        // if the day already exists
        if (dataChart[i + 1]) {
          // add data to the existing day
          dataChart[i + 1].push(data.dataset.data[i][4]);
        } else {
          // else add the date and data to the dataChart array
          dataChart.push([data.dataset.data[i][0], data.dataset.data[i][4]]);
        }
      }
      $scope.activeStocks.push(stockObj);
      drawChart();
    })
    .error(function(err) {
      console.log("error!");
    })
  }

  // called by $scope.search, used to give a random color to the new stock
  function getRandomColor() {
    // if almost all colors have been used, empty the colorsUsed array
    if (colorsUsed.length >= colors.length / 3 * 2) {
      colorsUsed = [];
      console.log("Colors emptied")
    }
    // generate random index
    var index =  Math.floor(Math.random() * colors.length);
    // keep generating a new index until you find one color that has not been used
    while(colorsUsed.indexOf(colors[index]) > -1) {
      index =  Math.floor(Math.random() * colors.length);
    }
    // add color to colorsUsed
    colorsUsed.push(colors[index]);
    return colors[index];
  }

  // draw stock chart
  function drawChart() {
    // if all stocks have been removed, don't show the chart
    if ($scope.activeStocks.length < 1) {
      $("#chart").hide();
      // re-enable search
      $('#submit').prop('disabled', false);
      $('#input-search').prop('disabled', false);
      return;
    }
    $("#chart").show();
    google.setOnLoadCallback(drawChart);
    var data = google.visualization.arrayToDataTable(dataChart);
    var chart = new google.visualization.LineChart(document.getElementById('chart'));
    var options = { lineWidth: 5, backgroundColor : "#dddddd", colors : colorsUsed, legend: {position: 'none'} };
    chart.draw(data, options);
    // re-enable search
    $('#submit').prop('disabled', false);
    $('#input-search').prop('disabled', false);
  }
}]);
