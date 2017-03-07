"use strict";

/*
TODO: 
1. If the drawer disconnects before anyone has guessed the word, the code should designate the earliest connected user as the new drawer.
    a. Detect disconnect, get id of user that disconnected
    b. Remove user id from `users` array
    c. If id === drawer, set `drawer = users[0]` (since newer users get pushed onto the array)
    d. Update news feed with a message to the effect of `The drawer ${id} disconnected! The new drawer is ${drawer}`

2. If all guessers disconnect (so, all users minus the drawer), the drawing board should be disabled until someone connects again.
    a. This requires task #1 to be done first, since that will update the users list.
    b. Then, this will check the length of the list of users. If length === 1 (only the drawer), then disable canvas.
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
    
    /*
    // StackOverflow example. Use this instead of the above, to track users?
    var userId;
    socket.on('new player', function(id, name) {
        userId = id = parseInt(id);
        // ...
    });
    
    socket.on('disconnect', function() {
        delete playerList[userId];
    });
    */
    
    // We know we'll always have at least one client at index 0, even if it's current socket.
    drawer = users[0];
    let userObj = {
        // ES2015 syntactic sugar for when property and value are identical
        users, 
        drawer, 
        currentUserId
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
    
    socket.on('disconnect', (e) => {
        console.log(`User ${currentUserId} has disconnected`);
        
        // Rem ove current user from 'users' array
        let currentUserIndex = users.indexOf(currentUserId);
        users.splice(currentUserIndex, 1);
        
        if (currentUserId == drawer) {
            // Reset drawer to earliest connected user
            drawer = users[0];
        }
        
        let userObj = {
            // ES2015 syntactic sugar for when property and value are identical
            users, 
            drawer, 
            currentUserId
        };
        
        // Update users again
        io.emit('updateUsers', userObj);

    });
});

server.listen(process.env.PORT || 8080);