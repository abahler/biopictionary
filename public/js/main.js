let pictionary = () => {
    let canvas, context;
    
    let draw = (position) => {
        context.beginPath();
        context.arc(position.x, position.y, 6, 0, 2 * Math.PI);
        context.fill();
    };
    
    canvas = $('canvas');
    context = canvas[0].getContext('2d');
    canvas[0].width = canvas[0].offsetWidth;
    canvas[0].height = canvas[0].offsetHeight;
    
    // Handler callback gets an event object
    canvas.on('mousemove', (ev) => {
        let offset = canvas.offset();
        let newPosition = {
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