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
    let socketId = socket.id;
    console.log('New client connected! Socket id: ', socketId);
    users.push(socketId);
    
    // We know we'll always have at least one client at index 0, even if it's current socket.
    drawer = users[0];
    let userObj = {
        // ES2015 syntactic sugar for when property and value are identical
        users, 
        drawer, 
        socketId
    };
    io.emit('updateUsers', userObj);
    
    // If user is drawer, show list of words and have them pick.
    let words = [
        "closer", "farm", "computer", "god", "sun", "shoe", "trick", 
        "skateboard", "anarchy", "crow", "angel", "priest", "picture", 
        "doppelganger", "autobiography", "beach", "war", "peace", "neighborhood",
        "dynasty", "blueprint", "animal", "machine", "goat", "cherry", 
        "butcher", "death", "life", "rifle", "cinema", "necklace", "prince",
        "pool", "evil", "monster", "up", "music", "wave", "metal", "reptile", 
        "wire", "lemon", "love", "kite", "cowboy", "whiskey", "forever", 
        "day", "night", "alien", "hacker", "enemy", "government"
    ];
    
    if (socketId == drawer) {
        console.log('Drawer connected');
        socket.emit('chooseWord', words);
    }
    
    socket.on('draw', (position) => {
        console.log('Draw event received on server');  
        // Emit out to all other clients
        socket.broadcast.emit('draw', position);
    });
    
    socket.on('guess', (theGuess) => {
        io.emit('guess', theGuess);         // Emit to all clients
    });
    
    socket.on('disconnect', (e) => {
        console.log(`A user has disconnected`);
        // console.log(e);          // transport close
        // console.log(typeof e);   // "string"
        
        
        // TODO: broadcast an event that can be listened for, at which point the news feed can be updated
        // But the following line appears to cause a continuous loop that blows the stack
        // socket.broadcast.emit('disconnect', userThatLeft);
    });
    
    socket.on('disconnectFromClient', (d) => {
        console.log('disconnectFromClient event received');
        console.log('d: ', d);
    });
});

server.listen(process.env.PORT || 8080);