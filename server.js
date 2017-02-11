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
    
    socket.on('disconnect', (userThatLeft) => {
        console.log(`A user has disconnected`);
        console.log('userThatLeft: ', userThatLeft);
        
        // Don't need to fire this, because it causes a continuous loop that blows the stack
        // socket.broadcast.emit('disconnect', userThatLeft);
    });
});

server.listen(process.env.PORT || 8080);