"use strict";

const http = require('http');
const express = require('express');
const socket_io = require('socket.io');

const app = express();
app.use(express.static('public'));

const server = http.Server(app);
const io = socket_io(server);

io.on('connect', (socket) => {
    console.log('Client connected');
    
    socket.on('draw', (position) => {
        console.log('Draw event received on server');  
        // Emit out to all other clients
        socket.broadcast.emit('draw', position);
    });
    
    socket.on('guess', (theGuess) => {
        io.emit('guess', theGuess);         // Emit to all clients
    });
    
    socket.on('disconnect', () => {
        console.log('A user has disconnected');
    });
});

server.listen(process.env.PORT || 8080);