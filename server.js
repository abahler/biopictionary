"use strict";

/*
TODO: 
1. If the drawer disconnects before anyone has guessed the word, the code should designate the earliest connected user as the new drawer.
    a. DONE - Detect disconnect, get id of user that disconnected
    b. DONE - Remove user id from `users` array
    c. DONE - If id === drawer, set `drawer = users[0]` (since newer users get pushed onto the array)
    d. DONE - Update news feed with a message to the effect of `The drawer ${id} disconnected! The new drawer is ${drawer}`
    e. Somehow recognize on the client when "you" are the new drawer, and enable drawing
    (for now, don't go back to the first tab after opening a second, because the first tab can't draw for some reason)
    ** QUESTION: do we let client hit the server every time for a "who am i" check, or store that knowledge on client? **

2. If all guessers disconnect (so, all users minus the drawer), the drawing board should be disabled until someone connects again.
    a. This requires task #1 to be done first, since that will update the users list.
    b. Then, this will check the length of the list of users. 
        If length === 1 (only person in the room is the drawer), then disable canvas.
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

io.on('connect', (socket) => {
    let currentUserId = socket.id;
    console.log('New client connected! Socket id: ', currentUserId);
    users.push(currentUserId);
    console.log('Updated list of connected users: ', users);
    
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
    io.emit('newClientConnect', userObj);
    
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
        console.log('Drawer connected');
        socket.emit('chooseWord', words);
    }
    
    socket.on('draw', (position) => {
        console.log('Draw event received on server');  
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
        console.log(`User ${currentUserId} has disconnected`);
        
        // Rem ove current user from 'users' array
        let currentUserIndex = users.indexOf(currentUserId);
        users.splice(currentUserIndex, 1);
        
        let message = '';
        if (currentUserId == drawer) {
            console.log('The disconnected user was also the drawer!');
            // Reset drawer to earliest connected user
            drawer = users[0];
            
            message = `The drawer ${currentUserId} disconnected! Rude. ${drawer}, you are now the drawer.`;
        } else {
            message = `User ${currentUserId} left the game.`;
        }
        
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