# SocketAPIExample
This example shows how to use SocketAPI to connect a nodejs server to a html,javascript client.

Using the websocket package (check out the package.json file for package info).

Basically, it uses the 
```socket.emit('$messagename', data);```
Line to send data to the other end (data can be a big object or array or anything)

Then, on the other end you use:

```socket.on('$messagename', function(data){
    'do stuff with data'
}```

To get the data. The function will be called any time another end emits. The communications work the same both ways.

This example does this with 'left, right, down' keys.

##To Run
First, make sure you have Node.js (with NPM included) installed: https://nodejs.org/en/download/

Then, download this repository to a local folder on your computer.
Open command prompt in that folder and use the command ```Npm install``` in order to install needed packages.

Then you should be set to start the server, try using ```Node app.js``` to start it. After, a client can connect through *localhost:8012* in a browser.