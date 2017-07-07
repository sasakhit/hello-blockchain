myApp.controller('slController',
  ['$http', '$rootScope', '$scope', '$route', '$log', '$mdDialog', 'DataService',
  function($http, $rootScope, $scope, $route, $log, $mdDialog, DataService) {

    var user;

    $scope.chaincodeID = 'c42cb8b7f587b7881ef427cee5b2ec303b7fdbeb0d642c9f99df9b4acb45fb0d';
    $scope.username = 'user_type1_0';
    $scope.password = '4e59f90521';
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

    $scope.getOutstandings = function() {
      $scope.comment = 'Getting outstandings ...';
      DataService.querySl($scope.chaincodeID, 'getOutstandings')
        .then(function(data) {
          $scope.outstandings = data;
          $scope.comment = '';
        })
        .catch(function(error) {
          $scope.comment = error;
        });
    }

    $scope.getTransactions = function() {
      $scope.comment = 'Getting transactions ...';
      DataService.querySl($scope.chaincodeID, 'getTransactions')
        .then(function(data) {
          $scope.transactions = data;
          $scope.comment = '';
        })
        .catch(function(error) {
          $scope.comment = error;
        });
    }

    $scope.tradeSl = function(brInd,borrower,lender,secCode,qty,ccy,amt) {
      $scope.comment = 'Invoking ...';
      DataService.invokeSlTrade(brInd,borrower,lender,secCode,qty,ccy,amt, $scope.chaincodeID)
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
