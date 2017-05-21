myApp.controller('helloworldController',
  ['$http', '$rootScope', '$scope', '$route', '$log', '$mdDialog', 'DataService',
  function($http, $rootScope, $scope, $route, $log, $mdDialog, DataService) {

    $scope.chaincodeID = '44cdfe9503fcc9c472d7cd99d9c7ca609d2498cb76a5e56ca11252629540e9fa';

    $scope.deploy = function() {
      $scope.comment = 'Deploying chaincode ...';
      DataService.deployHelloworld().then(function(data) {
        $scope.chaincodeID = data;
        alert('chaincodeID:' + data);
      });
    }

    $scope.query = function(owner) {
      $scope.comment = 'Querying ...';
      DataService.queryHelloworld(owner, $scope.chaincodeID).then(function(data) {
        $scope.owner = owner;
        $scope.quantity = data;
        $scope.comment = '';
      });
    }

    $scope.invoke = function(fromOwner, toOwner, moveQuantity) {
      $scope.comment = 'Invoking ...';
      DataService.invokeHelloworld(fromOwner, toOwner, moveQuantity, $scope.chaincodeID).then(function(data) {
        $scope.comment = data;
      });
    }

  }
]);
