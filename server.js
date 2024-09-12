const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express(); // iniciando servidor express
const server = http.createServer(app); // criando server

const io = new Server(server); // wen socket

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

let esperandoUsuario = null;

io.on('connection', (socket) => {
    console.log('Um usuário se conectou');
    socket.on('set username', (username) => {
        socket.username = username; // capturando o nome do usuario
        // para ver quem conectou na sala
        console.log(`${username} entrou na sala.`);

        if(esperandoUsuario) {
            // se há um usuario esperando, emparelha os dois
            socket.parther = esperandoUsuario;
            esperandoUsuario.parther = socket;
            // notificar os usuarios conectadas
            esperandoUsuario.emit('chat start', `Falando com: ${socket.username}`);
            socket.emit('chat start', `Falando com: ${esperandoUsuario.username}`);
            // Zeramos o usuario que esta esperando
            esperandoUsuario = null;
        } else {
            // Se nao tem ninguem esperando, colocar ele como procimo a esperar
            esperandoUsuario = socket;
            socket.emit('waiting', 'Aguardando por um usuario para papear...');
        }
    });

    // enviar mensagem
    socket.on('chat message', (msg) => {
        if(socket.parther) { //validando se existe alguem na conexao
            socket.parther.emit('chat message', `${socket.username}: ${msg}`);
        }
    });
    // se desconectar
    socket.on('manual disconnect', () => {
        if(socket.parther) {
            socket.parther.emit('chat end', `${socket.username} desconectou.`);
            socket.parther.parther = null;
            socket.parther = null;
        }
        socket.emit('chat end', 'Voce desconectou.');
    });

    // lidar com desconexao
    socket.on('disconnect', () => {
        console.log('Usuario se desconectou');
        if(socket.parther) {
            socket.parther.emit('chat end', `${socket.username} desconectou`);
            socket.parther.parther = null;
        }
        if(esperandoUsuario === socket) {
            esperandoUsuario = null;
        }
    });
});

server.listen(3000, () => {
    console.log('Servidor na porta 3000');
});