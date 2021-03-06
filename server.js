"use strict";

/*
TODO: 
If all guessers disconnect (so, all users minus the drawer), the drawing board should be disabled until someone connects again.
    a. On disconnect, check the length of the list of users. 
    b. If length === 1 (only person in the room is the drawer), then disable canvas.
    c. On new connect, enable canvas.
*/

const http = require('http');
const express = require('express');
const socket_io = require('socket.io');

const app = express();
app.use(express.static('public'));

const server = http.Server(app);
const io = socket_io(server);

let users = [];     // Keep a list of all currently connected users
let drawer;
let currentWord;
let canvasEnabled = false;

io.on('connect', (socket) => {
    let currentUserId = socket.id;
    users.push(currentUserId);
    
    // We know we'll always have at least one client at index 0, even if it's the current socket.
    drawer = users[0];
    
    let message = `User ${currentUserId} joined the game`;
    
    let userObj = {
        // ES2015 syntactic sugar for identical property/value names
        users, 
        drawer, 
        currentUserId,
        message
    };
    socket.emit('newClientConnect', userObj);
    
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
    
    if (currentUserId == drawer) {
        socket.emit('chooseWord', words);
    }
    
    socket.on('toggleCanvas', (setting) => {
        canvasEnabled = setting;
        io.emit('toggleCanvas', canvasEnabled);
    });
    
    socket.on('draw', (position) => {
        // Emit out to all other clients
        socket.broadcast.emit('draw', position);
    });
    
    socket.on('setCurrentWord', (word) => {
        currentWord = word;
    });
    
    socket.on('guess', (theGuess) => {
        // Update the list of guesses every time...
        io.emit('guess', theGuess);         // Emit to all clients
        
        // ...But perform an extra check to see if the user entered the correct word
        if (theGuess == currentWord) {
            // User is now drawer
            drawer = currentUserId;
            
            // Notify room that correct word was guessed
            let responseObj = {newDrawer: currentUserId, correctWord: theGuess};
            io.emit('correctWordGuessed', responseObj);
            
            // Give new drawer the new word
            socket.emit('chooseWord', words);
        }
    });
    
    socket.on('disconnect', () => {
        
        // Rem ove current user from 'users' array
        let currentUserIndex = users.indexOf(currentUserId);
        users.splice(currentUserIndex, 1);
        
        let message = '';
        if (currentUserId == drawer) {
            // Reset drawer to earliest connected user
            drawer = users[0];
            
            message = `The drawer ${currentUserId} disconnected! Rude. ${drawer}, you are now the drawer.`;
        } else {
            message = `User ${currentUserId} left the game.`;
        }
        
        // Client doesn't need to receive id of disconnected user outside of news feed message
        let userObj = {
            users, 
            drawer, 
            message
        };
        
        // Update users again
        socket.broadcast.emit('newClientDisconnect', userObj);
    });
});

server.listen(process.env.PORT || 8080);
