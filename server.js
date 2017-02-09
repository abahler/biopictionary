"use strict";

const http = require('http');
const express = require('express');
const socket_io = require('socket.io');

let app = express();
app.use(express.static('public'));

let server = http.Server(app);
var io = socket_io(server);

io.on('connect', (socket) => {
    console.log('Client connected');
    
    socket.on('draw', (position) => {
        console.log('Draw event received on server');  
        // Emit out to all other clients
        socket.broadcast.emit('draw', position);
    });
    
    socket.on('guess', (theGuess) => {
        socket.broadcast.emit('guess', theGuess);
    });
});

server.listen(process.env.PORT || 8080);