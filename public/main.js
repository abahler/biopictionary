"use strict";

let pictionary = () => {
    let socket = io();
    let drawing = false;
    
    let users, drawer, currentUserId, message;      // Track users and 'draw' permission
    let canvas, context, guessBox;   // Track drawing
    let canvasEnabled = false;                      // Disabled on initial load
  
    // Note we don't have a variable to store the word the drawer is using to draw the picture.
    // Clients don't (shouldn't?) need to know that, so we'll ping the server with each guess to test if it's right.
    
    // Get list elements from the DOM
    let userList = $('#userList ul');
    let newsFeed = $('#newsFeed ul');
    let guessList = $('#guessDisplay ul')
    
    // Create containers for lists
    let newsFeedItems = [];
    let guesses = []; 
    
    let updateNewsFeed = (newsItems) => {
        let refreshedFeed = '';
        newsItems.forEach( (v, i) => {
            refreshedFeed += `<li>${v}</li>`;
        });
        newsFeed.html(refreshedFeed);  
    };

    let updateUserList = (listOfUsers) => {
        let listHTML = '';
        listOfUsers.forEach( (v, i) => {
            // Note that this doesn't automatically assume that the first user is the drawer.
            if (v === drawer) {
                listHTML += `<li>${v} <b>(drawer)</b></li>`;
            } else {
                listHTML += `<li>${v}</li>`;    
            }
        });
        userList.html(listHTML);
    };
    
    let updateGuesses = (guesses) => {
        let newList = '';
        guesses.forEach( (v, i) => {
            newList += `<li>${v}</li>`;
        });
        guessList.html(newList);
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
        if (canvasEnabled == true) {
            if (currentUserId == drawer) {
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
        } else {
            alert('The canvas is not enabled because you are only one in the room! Wait for some guessers to join.');
        }

    });
    
    canvas.on('mouseup', () => {
        if (canvasEnabled == true && currentUserId == drawer) {
            drawing = false;    
        }
    });        

    // Guessbox handlers
    let logEnteredVal = (e) => {
        // Don't let the drawer make guesses
        if (currentUserId !== drawer) {
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
    
    socket.on('newClientConnect', (userObj) => {
        users = userObj.users;
        drawer = userObj.drawer;
        currentUserId = userObj.currentUserId;
        message = userObj.message;

        // Render list of users
        updateUserList(users);
        newsFeedItems.push(message);
        updateNewsFeed(newsFeedItems);
        
        if (users.length > 1) {
            // TODO: send an event to the server, with TRUE as the value
		    // toggleCanvas(true); 
		    socket.emit('toggleCanvas', true);
        }
        
    });
    
    socket.on('toggleCanvas', (setting) => {
        canvasEnabled = setting;
    });
    
    socket.on('newClientDisconnect', (userObj) => {
        users = userObj.users;
        drawer = userObj.drawer;
        message = userObj.message;
        
        updateUserList(users);
        newsFeedItems.push(message);
        updateNewsFeed(newsFeedItems);
        
	    if (users.length === 1) {   // Will always be at least the drawer in the users list
		    socket.emit('toggleCanvas', false);
	    }
        
    });
    
    socket.on('chooseWord', (wordChoices) => {
        let randomChoice = Math.round(Math.random() * wordChoices.length + 1);
        let word = wordChoices[randomChoice];

        // Since the 'chooseWord' event is emitted after a guesser picks the right word and gets reset as drawer, 
        // this event should work for the initial drawer as well as all subsequent ones
        if (currentUserId == drawer) {
            let txt = `<p>Your word is:<br><b>${word}</b></p>`;
            $('#currentWord').html(txt);
           
            // Send up to the server, so the server can broadcast it to the guessers
            socket.emit('setCurrentWord', word);
        }
    });
    
    // Listen for events emit from server.js
    socket.on('draw', (receivedPosition) => {
        draw(receivedPosition);
    });
    
    socket.on('guess', (theGuess) => {
        guesses.unshift(theGuess);
        updateGuesses(guesses);
    });
    
    socket.on('correctWordGuessed', (res) => {
        // Reset the drawer
        drawer = res.newDrawer;

        // Notify room that <user> made the correct guess of <word>
        newsFeedItems.push(`${drawer} made the correct guess! The word was <b>${res.correctWord}</b>. ${drawer}, you're up!`);
        updateNewsFeed(newsFeedItems);
    });
    
};

// Included where jquery is, so ignore the '$ is not defined' error in IDE
$(document).ready( () => {
    pictionary();
});
