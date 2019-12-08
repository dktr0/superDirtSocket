# superDirtSocket

Tiny thing to listen on a WebSocket and forward OSC-over-UDP events to SuperDirt

# How to use

1. Clone it somewhere useful (just one-time):
```
cd ~
git clone https://github.com/d0kt0r0/superDirtSocket.git
```

2. Install node.js, SuperCollider and SuperDirt (just one-time)

3. Install node modules used by this thing (just one-time):
```
cd ~/superDirtSocket
npm install
```

4. To make it go, run it with node:
```
cd ~/superDirtSocket
node superDirtSocket.js --superCollider 57120
```

5. Finally, launch SuperDirt, open a browser and connect to a running Estuary deployment somewhere. Check the SuperDirt checkbox at the top of Estuary to connect, through the superDirtSocket, to SuperDirt.
