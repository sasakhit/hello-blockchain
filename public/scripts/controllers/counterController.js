myApp.controller('counterController',
  ['$http', '$rootScope', '$scope', '$route', '$log', '$mdDialog', 'DataService',
  function($http, $rootScope, $scope, $route, $log, $mdDialog, DataService) {

    var user;

    $scope.chaincodeID = '0afe2306335e38c2612218db73862aca2eaa5eaa25d08832bb6f92006edd1b6c';
    $scope.username = 'user_type1_0';
    $scope.password = '53a2377961';

    $scope.login = function() {
      $scope.comment = 'Logging in ...';
      DataService.login($scope.username, $scope.password).then(function(data) {
        $scope.comment = data;
      });
    }

    $scope.deploy = function() {
      $scope.comment = 'Deploying chaincode ...';
      DataService.deployCounter().then(function(data) {
        $scope.chaincodeID = data;
      });
    }

    $scope.query = function() {
      $scope.comment = 'Querying ...';
      DataService.queryCounter($scope.chaincodeID)
        .then(function(data) {
          $scope.counters = data;
          $scope.comment = '';
          $scope.selectedItem = 0;
          $scope.changeItem = function(index) {
            $scope.selectedItem = index;
          };
        })
        .catch(function(error) {
          $scope.comment = error;
        });
    }

    $scope.invoke = function(counterId) {
      $scope.comment = 'Invoking ...';
      DataService.invokeCounter(counterId.toString(), $scope.chaincodeID).then(function(data) {
        $scope.comment = data;
      });
    }

  }
]);
