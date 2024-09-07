const socket = io();
const chat = document.getElementById('chat');
const messageInput = document.getElementById('message');
let username = '';
let connectedUser = '';
let chatHistory = [];

function initialize() {
    username = prompt("Enter your username");
    if (!username) {
        alert("Username is required.");
        return;
    }
    socket.emit('setUsername', username);
}

function connectUser() {
    const userToConnect = prompt("Enter username to connect with:");
    if (userToConnect) {
        socket.emit('requestConnection', { from: username, to: userToConnect });
    }
}

socket.on('connectionRequest', (data) => {
    if (confirm(`${data.from} wants to connect with you. Accept?`)) {
        connectedUser = data.from;
        socket.emit('acceptConnection', { from: data.from, to: username });
    }
});

socket.on('connectionAccepted', (data) => {
    connectedUser = data.to;
    alert(`Connected with ${connectedUser}`);
});

socket.on('message', (data) => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', data.username === username ? 'own-message' : 'other-message');
    messageElement.innerText = `${data.username}: ${data.message}`;
    chat.appendChild(messageElement);
    chat.scrollTop = chat.scrollHeight;
    chatHistory.push(`${data.username}: ${data.message}`);
});

function sendMessage() {
    const message = messageInput.value;
    if (connectedUser) {
        socket.emit('message', { username, message });
        messageInput.value = '';
    } else {
        alert("You are not connected.");
    }
}

function endChat() {
    if (confirm("Do you want to end the chat?")) {
        location.reload();
    }
}

document.addEventListener("DOMContentLoaded", initialize);
