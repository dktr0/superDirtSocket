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
node superDirtSocket.js
```

5. Finally, launch SuperDirt, open a browser and connect to a running Estuary deployment somewhere.
You'll probably want to turn off the audio in your browser, otherwise you'll probably hear things from SuperDirt and WebDirt. Note: don't hit Estuary's WebDirt mute button if you want to hear something as it currently mutes both WebDirt and this link to SuperDirt.
 
