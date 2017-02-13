"use strict";

let pictionary = () => {
    
    let socket = io();
    let drawing = false;
    
    let users, drawer, mySocketId;              // Track users and 'draw' permission
    let userList = $('#userList');
    let canvas, context, guessBox;  // Track drawing

    let updateUserList = (listOfUsers) => {
        let listHTML = '';
        listOfUsers.forEach( (v, i) => {
            // Note that this doesn't automatically assume that the first user is the drawer.
            // This makes it more flexible.
            if (v === drawer) {
                listHTML += `<li>${v} <b>(drawer)</b></li>`;
            } else {
                listHTML += `<li>${v}</li>`;    
            }
        });
        userList.html(listHTML);
    };
    
    let updateGuesses = (guesses) => {
        let guessList = '';
        guesses.forEach( (v, i) => {
            guessList += `<li>${v}</li>`;
        });
        $('#guessDisplay ul').html(guessList);
    };
    
    let draw = (position) => {
        // Alert `context` to the fact that we're beginning to draw a new object
        context.beginPath();                    
        // Actually draw the arc
        context.arc(position.x, position.y, 6, 0, 2 * Math.PI);
        // Fill in the path with solid black circle
        context.fill();
        // Send this event upstream to the Socket.IO server
        socket.emit('draw', position);
    };
    
    canvas = $('canvas');
    // Create drawing context for the canvas. This object allows us to draw graphics.
    context = canvas[0].getContext('2d');       
                                    
    // Set width and height for correct resolutions
    canvas[0].width = canvas[0].offsetWidth;
    canvas[0].height = canvas[0].offsetHeight;
    
    // Handler callback gets an event object
    canvas.on('mousedown', (ev) => {
        if (mySocketId == drawer) {
            drawing = true;
            // Grab the current offset
            let offset = canvas.offset();
            
            let newPosition = {
                // The subtractions get us the position of the mouse relative to the top-left of the canvas
                // Top left is {x; 0, y: 0}. 
                // Bottom right is total width and heigh in pixels (for x and y, respectively).
                x: ev.pageX - offset.left,
                y: ev.pageY - offset.top
            };
            draw(newPosition);             
        } else {
            alert('You are not the drawer, but you can venture a guess in the box above.');
        }
    });
    
    canvas.on('mouseup', () => {
        if (mySocketId == drawer) {
            drawing = false;    
        }
    });        

    
    // Guessbox handlers
    let logEnteredVal = (e) => {
        // Don't let the drawer make guesses
        if (mySocketId !== drawer) {
            if (e.keyCode != 13) {
                return;
            }  
        
            let currentGuess = guessBox.val();    
            socket.emit('guess', currentGuess);
            guessBox.val('');              
        } else {
            alert("You're the drawer! Sit back and let the others guess.");
        }
    };
    
    guessBox = $('#guess input');       // Should this be moved before the onKeyDown function expression?
    guessBox.on('keydown', logEnteredVal);
    
    socket.on('updateUsers', (userObj) => {
        users = userObj.users;
        drawer = userObj.drawer;
        mySocketId = userObj.socketId;

        // Render list of users
        updateUserList(users);
    });
    
    socket.on('chooseWord', (wordChoices) => {
        let randomChoice = Math.round(Math.random() * wordChoices.length + 1);
        let word = wordChoices[randomChoice];
        
        if (mySocketId == drawer) {
           let txt = `<p>Your word is:<br><b>${word}</b></p>`;
           $('#currentWord').html(txt);
        }
    });
    
    // Listen for events emit from server.js
    socket.on('draw', (receivedPosition) => {
        draw(receivedPosition);
    });
    
    let guesses = [];
    socket.on('guess', (theGuess) => {
        guesses.unshift(theGuess);
        updateGuesses(guesses);
    });
    
    // TODO: improve this so it tells us which user left, and drops that into the news feed
    socket.on('disconnect', (userThatLeft) => {
        console.log('A disconnect event was received from the server!');
        console.log('User that left: ', userThatLeft);
    });
    
};

// Included where jquery is, so ignore the '$ is not defined' error in IDE
$(document).ready( () => {
    pictionary();
});