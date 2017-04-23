myApp.factory('DataService',
    ['$http', '$mdDialog', '$q', '$route',
    function($http, $mdDialog, $q, $route) {

      return {
        deployHelloworld : deployHelloworld,
        queryHelloworld : queryHelloworld,
        invokeHelloworld : invokeHelloworld
      };

      function deployHelloworld() {
        return $http.get('/helloworld/deploy', {timeout: 10000}).then(function(response) {
          return response.data;
        });
      }

      function queryHelloworld(owner, chaincodeID) {
        return $http.get('/helloworld/query', {params: {owner: owner, chaincodeID: chaincodeID}}).then(function(response) {
          return response.data;
        });
      }

      function invokeHelloworld(fromOwner, toOwner, moveQuantity, chaincodeID) {
        return $http.post('/helloworld/invoke', {fromOwner: fromOwner, toOwner: toOwner, moveQuantity: moveQuantity, chaincodeID: chaincodeID}).then(function(response) {
          return response.data;
        });
      }

    }
]);
