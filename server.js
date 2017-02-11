"use strict";

const http = require('http');
const express = require('express');
const socket_io = require('socket.io');

const app = express();
app.use(express.static('public'));

const server = http.Server(app);
const io = socket_io(server);

let users = [];     // Keep a list of all currently connected users
let drawer;

io.on('connect', (socket) => {
    console.log('New client connected! Socket id: ', socket.id);
    users.push(socket.id);
    
    // We know we'll always have at least one client at index 0, even if it's current socket.
    drawer = users[0];
    let userObj = {users: users, drawer: drawer};
    io.emit('updateUsers', userObj);
    
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
        
        // TODO: broadcast an event that can be listened for, at which point the news feed can be updated
        // But the following line appears to cause a continuous loop that blows the stack
        // socket.broadcast.emit('disconnect', userThatLeft);
    });
});

server.listen(process.env.PORT || 8080);