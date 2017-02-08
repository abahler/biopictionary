"use strict";

let pictionary = () => {
    
    let socket = io();
    
    let canvas, context;
    
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
    canvas.on('mousemove', (ev) => {
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
    });
    
};

// Included where jquery is, so ignore the '$ is not defined' error in IDE
$(document).ready( () => {
    pictionary();
});