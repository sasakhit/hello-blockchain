var myApp = angular.module('myApp',
  ['ngRoute', 'ngAnimate', 'ui.bootstrap', 'ngTagsInput' , 'ngMaterial', 'ngCookies']);

myApp.config(['$routeProvider', function($routeProvider) {

  $routeProvider
    .when('/helloworld', {
      templateUrl: '/views/templates/helloworld.html',
      controller: 'helloworldController'
    })
    .when('/notImplemented', {
      templateUrl: '/views/templates/notImplemented.html'
    })
    .otherwise({
      redirectTo: '/helloworld'
    });
}]);
