var express = require('express');
var router = express.Router();
var fs = require('fs');
var user;

var config;
try {
    config = JSON.parse(fs.readFileSync(__dirname + '/../config.json', 'utf8'));
} catch (err) {
    console.log("config.json is missing or invalid file, Rerun the program with right file");
    process.exit();
}

// Read and process the credentials.json
var network;
try {
    network = JSON.parse(fs.readFileSync(__dirname + '/../ServiceCredentials.json', 'utf8'));
    if (network.credentials) network = network.credentials;
} catch (err) {
    console.log("ServiceCredentials.json is missing or invalid file, Rerun the program with right file")
    process.exit();
}

router.get('/deploy', function(req, res) {
  var user = req.app.get('user');

  deployChaincode(user)
    .then(function(data) {
      return res.json(data);
    })
    .catch(function(error) {
      return res.json(error);
    });
});

router.get('/query', function(req, res) {
  var chain = req.app.get('chain');
  var user = req.app.get('loginUser');
  var chaincodeID = req.query.chaincodeID;

  console.log("loginUser: " + user);
  console.log("chaincodeID: " + chaincodeID);
  if (! user) return res.status(500).json('No login user');
  if (! chaincodeID) return res.status(500).json('No chaincode ID');

  queryUser(user, chaincodeID)
    .then(function(data) {
      return res.json(data);
    })
    .catch(function(error) {
      console.log("Error: " + error);
      return res.status(500).json(error);
    });
});

router.post('/invoke', function(req, res) {
  var user = req.app.get('loginUser');
  var counterId = req.body.counterId;
  var chaincodeID = req.body.chaincodeID;

  invokeOnUser(user, counterId, chaincodeID)
    .then(function(data) {
      return res.json(data);
    })
    .catch(function(error) {
      return res.json(error);
    });
});

function deployChaincode(user) {
  return new Promise(function (resolve, reject) {
    console.log("\nDeploying chaincode ...");

    var args = [];
    // Construct the deploy request
    var deployRequest = {
        // Function to trigger
        fcn: init,
        // Arguments to the initializing function
        args: args,
	      chaincodePath : config.deployRequest.chaincodePath + '\\counter',
        // the location where the startup and HSBN store the certificates
        certificatePath: network.cert_path
    };

    // Trigger the deploy transaction
    var deployTx = user.deploy(deployRequest);
    console.log("\nDeploying chaincode ... checkpoint 2");

    // Print the deploy results
    deployTx.on('complete', function (results) {
        // Deploy request completed successfully
        var chaincodeID = results.chaincodeID;
        console.log("\nChaincode ID : " + chaincodeID);
        console.log("\nSuccessfully deployed chaincode: request=%j, response=%j", deployRequest, results);

        resolve(chaincodeID);
    });

    deployTx.on('error', function (err) {
        // Deploy request failed
        console.log("\nFailed to deploy chaincode: request=%j, error=%j", deployRequest, err);
        reject('Failed to deploy chaincode');
    });

    console.log("\nDeploying chaincode ... checkpoint 3");
  });
}

function invokeOnUser(user, counterId, chaincodeID) {
  return new Promise(function (resolve, reject) {
    var args = [counterId];
    // Construct the invoke request
    var invokeRequest = {
        // Name (hash) required for invoke
        chaincodeID: chaincodeID,
        // Function to trigger
        fcn: 'countUp',
        // Parameters for the invoke function
        args: args
    };

    // Trigger the invoke transaction
    var invokeTx = user.invoke(invokeRequest);

    // Print the invoke results
    invokeTx.on('submitted', function (results) {
        // Invoke transaction submitted successfully
        console.log("\nSuccessfully submitted chaincode invoke transaction: request=%j, response=%j", invokeRequest, results);
        //resolve('Successfully submitted chaincode invoke transaction');
    });
    invokeTx.on('complete', function (results) {
        // Invoke transaction completed successfully
        console.log("\nSuccessfully completed chaincode invoke transaction: request=%j, response=%j", invokeRequest, results);
        resolve('Successfully completed chaincode invoke transaction');
    });
    invokeTx.on('error', function (err) {
        // Invoke transaction submission failed
        console.log("\nFailed to submit chaincode invoke transaction: request=%j, error=%j", invokeRequest, err);
        reject('Failed to submit chaincode invoke transaction');
    });
  });
}

function queryUser(user, chaincodeID) {
  return new Promise(function (resolve, reject) {
    var args = [];
    // Construct the query request
    var queryRequest = {
        // Name (hash) required for query
        chaincodeID: chaincodeID,
        // Function to trigger
        fcn: 'refresh',
        // Existing state variable to retrieve
        args: args
    };

    // Trigger the query transaction
    var queryTx = user.query(queryRequest);
    var value;

    // Print the query results
    queryTx.on('complete', function (results) {
        // Query completed successfully
        //value = results.result.toString();
        value = results.result;
        console.log("\nSuccessfully queried chaincode function: request=%j, value=%s", queryRequest, value);
        resolve(JSON.parse(value));
    });
    queryTx.on('error', function (err) {
        // Query failed
        console.log("\nFailed to query chaincode, function: request=%j, error=%j", queryRequest, err);
        reject('Failed to query chaincode');
    });

  });
}

function queryUserWithCallback(user, callback) {
    var args = getArgs(config.queryRequest);
    // Construct the query request
    var queryRequest = {
        // Name (hash) required for query
        chaincodeID: testChaincodeID,
        // Function to trigger
        fcn: config.queryRequest.functionName,
        // Existing state variable to retrieve
        args: args
    };

    // Trigger the query transaction
    var queryTx = user.query(queryRequest);
    var value;

    // Print the query results
    queryTx.on('complete', function (results) {
        // Query completed successfully
        value = results.result.toString();
        console.log("\nSuccessfully queried  chaincode function: request=%j, value=%s", queryRequest, value);
        callback(value);
    });
    queryTx.on('error', function (err) {
        // Query failed
        console.log("\nFailed to query chaincode, function: request=%j, error=%j", queryRequest, err);
        callback(null);
    });
}

function getArgs(request) {
    var args = [];
    for (var i = 0; i < request.args.length; i++) {
        args.push(request.args[i]);
    }
    return args;
}

module.exports = router;
