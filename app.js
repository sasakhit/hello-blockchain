process.env.GOPATH = __dirname

// Web
var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var session = require('express-session');

// Route includes
var login = require('./routes/login');
var helloworld = require('./routes/helloworld');
var counter = require('./routes/counter');
var fx = require('./routes/fx');
var sl = require('./routes/sl');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Passport Session Configuration //
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'secret',
    key: 'user',
    resave: 'true',
    saveUninitialized: false,
    cookie: {maxage: 60000, secure: false}
}));

app.use('/login', login);
app.use('/helloworld', helloworld);
app.use('/counter', counter);
app.use('/fx', fx);
app.use('/sl', sl);

// Serve back static files
app.use(express.static('public'));
app.use(express.static('public/views'));

// App Set //
app.set('port', (process.env.PORT || 5000));

// Listen //
app.listen(app.get("port"), function(){
    console.log("Listening on port: " + app.get("port"));
});

// HFC
var hfc = require('hfc');
var util = require('util');
var fs = require('fs');
const https = require('https');

var config;
try {
    config = JSON.parse(fs.readFileSync(__dirname + '/config/config.json', 'utf8'));
    //module.exports.config = config;
} catch (err) {
    console.log("config.json is missing or invalid file, Rerun the program with right file")
    process.exit();
}

var ccConfig;
var chaincodeName = "sl" //helloworld, counter, fx, sl
try {
    ccConfig = JSON.parse(fs.readFileSync(__dirname + '/config/'+ chaincodeName + '.json', 'utf8'));
    //module.exports.ccConfig = ccConfig;
} catch (err) {
    console.log(chaincodeName + ".json is missing or invalid file, Rerun the program with right file")
    process.exit();
}

// Create a client blockchain.
var chain = hfc.newChain(config.chainName);
var certPath = __dirname + "/src/" + ccConfig.deployRequest.chaincodePath + "/certificate.pem";

// Read and process the credentials.json
var network;
try {
    network = JSON.parse(fs.readFileSync(__dirname + '/ServiceCredentials.json', 'utf8'));
    if (network.credentials) network = network.credentials;
} catch (err) {
    console.log("ServiceCredentials.json is missing or invalid file, Rerun the program with right file")
    process.exit();
}

var peers = network.peers;
var users = network.users;

// Determining if we are running on a startup or HSBN network based on the url
// of the discovery host name.  The HSBN will contain the string zone.
var isHSBN = peers[0].discovery_host.indexOf('secure') >= 0 ? true : false;
var network_id = Object.keys(network.ca);
var ca_url = "grpcs://" + network.ca[network_id].discovery_host + ":" + network.ca[network_id].discovery_port;

// Configure the KeyValStore which is used to store sensitive keys.
// This data needs to be located or accessible any time the users enrollmentID
// perform any functions on the blockchain.  The users are not usable without
// This data.
var uuid = network_id[0].substring(0, 8);
chain.setKeyValStore(hfc.newFileKeyValStore(__dirname + '/keyValStore-' + uuid));
var certFile = 'us.blockchain.ibm.com.cert';
init();

function init() {
	if (isHSBN) {
		certFile = '0.secure.blockchain.ibm.com.cert';
	}
	fs.createReadStream(certFile).pipe(fs.createWriteStream(certPath));
	enrollAndRegisterUsers();
}

function enrollAndRegisterUsers() {
    var cert = fs.readFileSync(certFile);

    chain.setMemberServicesUrl(ca_url, {
        pem: cert
    });

    // Adding all the peers to blockchain
    // this adds high availability for the client
    for (var i = 0; i < peers.length; i++) {

        // Peers on Bluemix require secured connections, hence 'grpcs://'
        chain.addPeer("grpcs://" + peers[i].discovery_host + ":" + peers[i].discovery_port, {
            pem: cert
        });
    }

    console.log("\n\n------------- peers and caserver information: -------------");
    console.log(chain.getPeers());
    console.log(chain.getMemberServices());
    console.log('-----------------------------------------------------------\n\n');

    //setting timers for fabric waits
    chain.setDeployWaitTime(config.deployWaitTime);
    app.set('chain', chain);

    // Note: Uncomment the following deployment, when deploying the chaincode

    chain.enroll(users[1].enrollId, users[1].enrollSecret, function (err, admin) {
      if (err) throw Error("\nERROR: failed to enroll admin : " + err);
      console.log("\nDeploying chaincode ...");
      deployChaincode(admin);
    });


}

function deployChaincode(user) {
    var args = getArgs(ccConfig.deployRequest);
    // Construct the deploy request
    var deployRequest = {
        // Function to trigger
        fcn: ccConfig.deployRequest.functionName,
        // Arguments to the initializing function
        args: args,
        chaincodePath: ccConfig.deployRequest.chaincodePath,
        // the location where the startup and HSBN store the certificates
        certificatePath: network.cert_path
    };

    // Trigger the deploy transaction
    var deployTx = user.deploy(deployRequest);

    // Print the deploy results
    deployTx.on('complete', function(results) {
        // Deploy request completed successfully
        chaincodeID = results.chaincodeID;
        console.log("\nChaincode ID : " + chaincodeID);
        console.log(util.format("\nSuccessfully deployed chaincode: request=%j, response=%j", deployRequest, results));
        // Save the chaincodeID
        //fs.writeFileSync(chaincodeIDPath, chaincodeID);
        //invoke();
    });

    deployTx.on('error', function(err) {
        // Deploy request failed
        console.log(util.format("\nFailed to deploy chaincode: request=%j, error=%j", deployRequest, err));
        process.exit(1);
    });
}

function getArgs(request) {
    var args = [];
    for (var i = 0; i < request.args.length; i++) {
        args.push(request.args[i]);
    }
    return args;
}
