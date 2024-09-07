const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = process.env.PORT || 3000;

app.use(express.static('public'));

const users = {}; // Store user connections
const connections = {}; // Store active user connections

io.on('connection', (socket) => {
    console.log('New user connected');

    // When a username is set
    socket.on('setUsername', (username) => {
        if (users[username]) {
            socket.emit('usernameExists', username); // Username is already taken
        } else {
            users[username] = socket;
            socket.username = username;
            socket.emit('usernameSet', username);
        }
    });

    // Handle connection requests
    socket.on('requestConnection', ({ from, to }) => {
        if (users[to]) {
            users[to].emit('connectionRequest', { from });
        } else {
            socket.emit('userNotFound', to); // Notify if user not found
        }
    });

    // When a user accepts the connection
    socket.on('acceptConnection', ({ from, to }) => {
        if (users[from] && users[to]) {
            connections[from] = to;
            connections[to] = from;
            users[from].emit('connectionAccepted', { from, to });
            users[to].emit('connectionAccepted', { from, to });
        }
    });

    // Handle message sending
    socket.on('message', (msg) => {
        const recipient = connections[msg.username];
        if (recipient && users[recipient]) {
            users[recipient].emit('message', msg); // Send message to the connected user
        }
        socket.emit('message', msg); // Send message to the sender as well
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const disconnectedUser = socket.username;
        if (disconnectedUser) {
            delete users[disconnectedUser];
            const connectedUser = connections[disconnectedUser];
            if (connectedUser) {
                delete connections[connectedUser];
                delete connections[disconnectedUser];
                if (users[connectedUser]) {
                    users[connectedUser].emit('userDisconnected');
                }
            }
        }
        console.log('User disconnected');
    });
});

server.listen(port, () => console.log(`Server running on port ${port}`));
