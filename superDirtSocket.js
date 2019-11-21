"use strict";
process.title = 'superDirtSocket';
var http = require('http');
var WebSocket = require('ws');
var nopt = require('nopt');
var osc = require('osc');

// parse command-line options
var knownOpts = {
  "help": Boolean,
  "superCollider" : [Number, null],
  "qlc" : [Number, null],
  "ws-port" : [Number, null],
  "verbose" : Boolean
};
var shortHands = {
  "h" : ["--help"],
  "s" : ["--superCollider"],
  "q" : ["--qlc"],
  "w" : ["--websocket"],
  "v" : ["--verbose"]
};

function help() {
  console.log("superDirtSocket");
  console.log("usage:");
  console.log(" --help (-h)                   this help message");
  console.log(" --superCollider (-s) [number] UDP port for sending OSC messages to SuperCollider");
  console.log(" --qlc (-q) [number]           UDP port for sending OSC messages to QLC");
  console.log(" --websocket (-w) [number]     TCP port (WebSocket) to listen on (default: 7772)");
  console.log(" --verbose (-v)                console logging of messages received from Estuary");
  process.exit(1);
}

var parsed = nopt(knownOpts,shortHands,process.argv,2);
if(parsed['help']!=null) help();
var scPort = parsed['superCollider'];
var qlcPort = parsed['qlc'];
if(scPort == null && qlcPort == null) {
  console.log("*WARNING* will not do anything (neither supercollider nor QLC option selected)");
  help();
}
var wsPort = parsed['ws-port'];
if(wsPort==null) wsPort = 7772;
var verbose = parsed['verbose'];
if(verbose == null) verbose = false;

var sc;
if(scPort!=null) {
  sc = new osc.UDPPort({ localAddress: "127.0.0.1", localPort: 7773 });
  sc.open();
}

var qlc;
if(qlcPort!=null) {
  qlc = new osc.UDPPort({ localAddress: "127.0.0.1", localPort: 7774 });
  qlc.open();
}
var qlcQueue = [];

function appendSuperDirtArg(superDirtArgName,oscType,sourceValue,targetArray) {
  if(sourceValue != null) {
    targetArray.push({ type: "s", value: superDirtArgName});
    targetArray.push({ type: oscType, value: sourceValue });
  }
}

function sendSuperDirtBundle(n) {
  if(n.sample_name == null || n.sample_name == "") return;
  var args = [];
  appendSuperDirtArg("s","s",n.sample_name,args);
  appendSuperDirtArg("n","i",n.sample_n,args);
  appendSuperDirtArg("speed","f",n.speed,args);
  appendSuperDirtArg("note","f",n.note,args);
  appendSuperDirtArg("shape","f",n.shape,args);
  appendSuperDirtArg("begin","f",n.begin,args);
  appendSuperDirtArg("end","f",n.end,args);
  appendSuperDirtArg("length","f",n.f,args);
  appendSuperDirtArg("accelerate","i",n.accelerate,args);
  appendSuperDirtArg("cps","f",n.cps,args);
  appendSuperDirtArg("unit","i",n.unit,args);
  appendSuperDirtArg("loop","i",n.loop,args);
  appendSuperDirtArg("delta","f",n.delta,args);
  appendSuperDirtArg("legato","f",n.legato,args);
  appendSuperDirtArg("sustain","f",n.sustain,args);
  appendSuperDirtArg("amp","f",n.amp,args);
  appendSuperDirtArg("gain","f",n.gain,args);
  appendSuperDirtArg("pan","f",n.pan,args);
  appendSuperDirtArg("note","f",n.note,args);
  appendSuperDirtArg("freq","f",n.freq,args);
  appendSuperDirtArg("midinote","f",n.midinote,args);
  appendSuperDirtArg("octave","f",n.octave,args);
  appendSuperDirtArg("latency","f",n.latency,args);
  appendSuperDirtArg("lag","f",n.lag,args);
  appendSuperDirtArg("offset","f",n.offset,args);
  appendSuperDirtArg("cut","i",n.cut,args);
  appendSuperDirtArg("orbit","i",n.orbit,args);
  appendSuperDirtArg("cycle","i",n.cycle,args);
  var bundle = {
    timeTag: { native: n.when * 1000 + 300 },
    packets: [ { address: "/play2", args: args }]
  };
  sc.send(bundle,"127.0.0.1",scPort);
}

function formatQLCPacket(sourceValue,oscAddress) {
  if(sourceValue != null) return [ { address: oscAddress, args: [{type: "f", value: sourceValue}] } ];
  else return [];
}

function queueQLCBundle(n) {
  if(n.dmx == null) return;
  var packets = [];
  packets = packets.concat(formatQLCPacket(n.red,"/" + n.dmx + "/red"));
  packets = packets.concat(formatQLCPacket(n.green,"/" + n.dmx + "/green"));
  packets = packets.concat(formatQLCPacket(n.blue,"/" + n.dmx + "/blue"));
  var bundle = {
    timeTag: { native: n.when * 1000 + 300 },
    packets: packets
  };
  qlcQueue.push(bundle);
}

// create WebSocket server (*** note: for security we should add a default so only local connections are accepted...)
var server = http.createServer();
var wss = new WebSocket.Server({server: server});
wss.on('connection',function(ws) {
  console.log("new WebSocket connection ");
  ws.on("message",function(m) {
    var n = JSON.parse(m);
    if(verbose) console.log(n);
    if(sc != null) sendSuperDirtBundle(n);
    if(qlc != null) queueQLCBundle(n);
  });
});

// make it go
server.listen(wsPort, function () {
  console.log('superDirtSocket listening (WebSocket) on ' + server.address().port);
  if(scPort) console.log('will forward OSC messages to SuperCollider at 127.0.0.1:' + scPort);
  if(qlcPort) console.log('will forward OSC messages to QLC at 127.0.0.1:' + qlcPort);
});

function flushQLCqueue() {
  var d = new Date();
  var t = d.getTime() + 5; // events that occur before 5 milliseconds from now will be sent
  var x;
  x = qlcQueue[0];
  // if(x != null) {
  //  console.log(" " + t + " " + x.timeTag.native);
  // }
  while(x != null && x.timeTag.native < t) {
    qlc.send(x,"127.0.0.1",qlcPort);
    qlcQueue.shift();
    x = qlcQueue[0];
  }
}
if(qlcPort != null)setInterval(flushQLCqueue,20);
