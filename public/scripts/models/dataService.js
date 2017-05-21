myApp.factory('DataService',
    ['$http', '$mdDialog', '$q', '$route',
    function($http, $mdDialog, $q, $route) {

      return {
        login : login,
        deployHelloworld : deployHelloworld,
        queryHelloworld : queryHelloworld,
        invokeHelloworld : invokeHelloworld,
        deployCounter : deployCounter,
        queryCounter : queryCounter,
        invokeCounter : invokeCounter,
        deployFx : deployFx,
        queryFx : queryFx,
        invokeFx : invokeFx
      };

      function login(username, password) {
        return $http.get('/login', {params: {username: username, password: password}}).then(function(response) {
          return response.data;
        });
      }

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

      function deployCounter() {
        return $http.get('/counter/deploy', {timeout: 10000}).then(function(response) {
          return response.data;
        });
      }

      function queryCounter(chaincodeID) {
        return $http.get('/counter/query', {params: {chaincodeID: chaincodeID}}).then(function(response) {
          return response.data;
        }).catch(function(error) {
          throw error.data;
        });
      }

      function invokeCounter(counterId, chaincodeID) {
        return $http.post('/counter/invoke', {counterId: counterId, chaincodeID: chaincodeID}).then(function(response) {
          return response.data;
        });
      }

      function deployFx() {
        return $http.get('/fx/deploy', {timeout: 10000}).then(function(response) {
          return response.data;
        });
      }

      function queryFx(chaincodeID) {
        return $http.get('/fx/query', {params: {chaincodeID: chaincodeID}}).then(function(response) {
          return response.data;
        }).catch(function(error) {
          throw error.data;
        });
      }

      function invokeFx(fromAccount, fromCcy, fromAmt, toAccount, toCcy, toAmt, chaincodeID) {
        return $http.post('/fx/invoke', {fromAccount: fromAccount, fromCcy: fromCcy, fromAmt: fromAmt, toAccount: toAccount, toCcy: toCcy, toAmt: toAmt, chaincodeID: chaincodeID}).then(function(response) {
          return response.data;
        });
      }

    }
]);
