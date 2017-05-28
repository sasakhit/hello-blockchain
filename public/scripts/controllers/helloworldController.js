myApp.controller('helloworldController',
  ['$http', '$rootScope', '$scope', '$route', '$log', '$mdDialog', 'DataService',
  function($http, $rootScope, $scope, $route, $log, $mdDialog, DataService) {

    $scope.chaincodeID = 'dadf4014463eef207c73e3f6ad98c5e50bf842bb95fb190b5597c69d67a5ff90';
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
      DataService.deployHelloworld().then(function(data) {
        $scope.chaincodeID = data;
        alert('chaincodeID:' + data);
      });
    }

    $scope.query = function(owner) {
      $scope.comment = 'Querying ...';
      DataService.queryHelloworld(owner, $scope.chaincodeID)
        .then(function(data) {
          $scope.owner = owner;
          $scope.quantity = data;
          $scope.comment = '';
        })
        .catch(function(error) {
          $scope.comment = error.data;
        });
    }

    $scope.invoke = function(fromOwner, toOwner, moveQuantity) {
      $scope.comment = 'Invoking ...';
      DataService.invokeHelloworld(fromOwner, toOwner, moveQuantity, $scope.chaincodeID)
        .then(function(data) {
          $scope.comment = 'Invoking ...';
        })
        .catch(function(error) {
          $scope.comment = error.data;
        });
    }

  }
]);
