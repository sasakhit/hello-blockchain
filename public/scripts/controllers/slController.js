myApp.controller('slController',
  ['$http', '$rootScope', '$scope', '$route', '$log', '$mdDialog', 'DataService',
  function($http, $rootScope, $scope, $route, $log, $mdDialog, DataService) {

    var user;

    $scope.chaincodeID = '40fe432488edd23182f5882a71a1a627406cf1aa4b8e5cca20d210a3edeb6226';
    $scope.username = 'user_type1_0';
    $scope.password = '53a2377961';
    $scope.brInd = 'B';
    $scope.borrower = '0876111111';
    $scope.lender = '0876222222';
    $scope.secCode = '8756';
    $scope.qty = 5000;
    $scope.ccy = 'JPY';
    $scope.amt = 4000000;

    $scope.login = function() {
      $scope.comment = 'Logging in ...';
      DataService.login($scope.username, $scope.password).then(function(data) {
        $scope.comment = data;
      });
    }

    $scope.deploy = function() {
      $scope.comment = 'Deploying chaincode ...';
      DataService.deploySl().then(function(data) {
        $scope.chaincodeID = data;
      });
    }

    $scope.query = function() {
      $scope.comment = 'Querying ...';
      DataService.querySl($scope.chaincodeID)
        .then(function(data) {
          $scope.outstandings = data;
          $scope.comment = '';
        })
        .catch(function(error) {
          $scope.comment = error;
        });
    }

    $scope.invoke = function(brInd,borrower,lender,secCode,qty,ccy,amt) {
      $scope.comment = 'Invoking ...';
      DataService.invokeSl(brInd,borrower,lender,secCode,qty,ccy,amt, $scope.chaincodeID)
        .then(function(data) {
          $scope.comment = data;
        })
        .catch(function(error) {
          $scope.comment = error;
        });
    }

    $scope.marginCall = function() {
      $scope.comment = 'Margin Call Calculating ...';
      DataService.invokeSlMarginCall($scope.chaincodeID)
        .then(function(data) {
          $scope.comment = data;
        })
        .catch(function(error) {
          $scope.comment = error;
        });
    }



  }
]);
