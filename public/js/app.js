// angular routing
var app = angular.module('NightApp', ['ngRoute']);

app.config(function ($routeProvider, $locationProvider) {
  $routeProvider
  .when('/login', {
    controller: 'LoginController',
    templateUrl: 'views/login.html'
  })
  .when('/signup', {
    controller: 'SignupController',
    templateUrl: 'views/signup.html'
  })
  .otherwise({
    templateUrl: 'views/home.html'
  });

  // use the HTML5 History API
  $locationProvider.html5Mode(true);
});
