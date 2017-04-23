process.env.GOPATH = __dirname

// Web
var express = require('express');
//var app = module.exports = express();
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var session = require('express-session');

// Route includes
var helloworld = require('./routes/helloworld');

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

app.use('/helloworld', helloworld);

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
    config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf8'));
    //app.set('config', config);
    module.exports.config = config;
} catch (err) {
    console.log("config.json is missing or invalid file, Rerun the program with right file")
    process.exit();
}

// Create a client blockchin.
var chain = hfc.newChain(config.chainName);
var certPath = __dirname+"/src/"+config.deployRequest.chaincodePath+"/certificate.pem";

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

    // Enroll a 'admin' who is already registered because it is
    // listed in fabric/membersrvc/membersrvc.yaml with it's one time password.
    chain.enroll(users[0].enrollId, users[0].enrollSecret, function (err, admin) {
        if (err) throw Error("\nERROR: failed to enroll admin : " + err);

        console.log("\nEnrolled admin sucecssfully");

        // Set this user as the chain's registrar which is authorized to register other users.
        chain.setRegistrar(admin);

        var enrollName = config.user.username; //creating a new user
        var registrationRequest = {
            enrollmentID: enrollName,
            affiliation: config.user.affiliation
        };
        chain.registerAndEnroll(registrationRequest, function (err, user) {
            if (err) throw Error(" Failed to register and enroll " + enrollName + ": " + err);

            console.log("\nEnrolled and registered " + enrollName + " successfully");

            //setting timers for fabric waits
            chain.setDeployWaitTime(config.deployWaitTime);
            app.set('user', user);
            console.log("\nUser : " + user);
        });
    });
}

function getArgs(request) {
    var args = [];
    for (var i = 0; i < request.args.length; i++) {
        args.push(request.args[i]);
    }
    return args;
}
