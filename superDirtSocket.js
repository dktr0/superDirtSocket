"use strict";
process.title = 'superDirtSocket';
var http = require('http');
var WebSocket = require('ws');
var nopt = require('nopt');
var osc = require('osc');

// parse command-line options
var knownOpts = {
  "help": Boolean,
  "dirt-address" : [String, null],
  "dirt-port" : [Number, null],
  "ws-port" : [Number, null],
  "udp-port" : [Number, null]
};
var shortHands = {
  "h" : ["--help"],
  "a" : ["--superDirtAddress"],
  "p" : ["--superDirtPort"],
  "w" : ["--superDirtPort"],
  "u" : ["--osc-address"]
};

var parsed = nopt(knownOpts,shortHands,process.argv,2);
if(parsed['help']!=null) {
  console.log("superDirtSocket");
  console.log("usage:");
  console.log(" --help (-h)                  this help message");
  console.log(" --dirt-address (-a) [string] address for sending OSC messages to SuperDirt (default: 127.0.0.1)");
  console.log(" --dirt-port (-p) [number]    port for sending OSC messages to SuperDirt (default: 57120)");
  console.log(" --ws-port (-w) [number]      TCP port (WebSocket) to listen on (default: 7772)");
  console.log(" --udp-port (-u) [number]     UDP port to listen on (default: 7773)")
  process.exit(1);
}

var dirtAddress = parsed['dirt-address'];
if(dirtAddress==null) dirtAddress="127.0.0.1";
var dirtPort = parsed['dirt-port'];
if(dirtPort==null) dirtPort = 57120;
var wsPort = parsed['ws-port'];
if(wsPort==null) wsPort = 7772;
var udpPort = parsed['udp-port'];
if(udpPort==null) udpPort = 7773;

// create UDP port (currently only used for sending to SuperCollider)
var udp = new osc.UDPPort( { localAddress: "127.0.0.1", localPort: udpPort });
udp.open();

// create WebSocket server (*** note: for security we should add a default so only local connections are accepted...)
var server = http.createServer();
var wss = new WebSocket.Server({server: server});
wss.on('connection',function(ws) {
  var ip = ws.upgradeReq.connection.remoteAddress;
  console.log("new WebSocket connection " + ip);
  ws.on("message",function(m) {
    var n = JSON.parse(m);
    if(n.request == "play") {
      udp.send( { address: "/play", args: [] },dirtAddress,dirtPort);
    }
  });
});

// make it go
server.listen(wsPort, function () {
  console.log('superDirtSocket listening (WebSocket) on ' + server.address().port)
  console.log('will forward OSC messages to SuperDirt at ' + dirtAddress + ':' + dirtPort + " using UDP port " + udpPort);
});
