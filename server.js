"use strict";

const http = require('http');
const express = require('express');
const socket_io = require('socket.io');

let app = express();
app.use(express.static('public'));

let server = http.Server(app);
var io = socket_io(server);

server.listen(process.env.PORT || 8080);