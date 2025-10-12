import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();

app.use(
    cors({
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    })
);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true, // 👈 ADD THIS
    },
});


let players = [];
let currentTurn = 'X';
let board = Array(9).fill(null);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    if (players.length < 2) {
        const playerSymbol = players.length === 0 ? 'X' : 'O';
        players.push({ id: socket.id, symbol: playerSymbol });
        socket.emit('player-assign', playerSymbol);
        io.emit('status', `Player ${playerSymbol} joined!`);

        if (players.length === 2) {
            io.emit('status', 'Game start! Player X goes first.');
            io.emit('update-board', { board, currentTurn });
        }
    } else {
        socket.emit('status', 'Game full. Try again later.');
    }

    socket.on('make-move', (index) => {
        const player = players.find(p => p.id === socket.id);
        if (!player || board[index] || player.symbol !== currentTurn) return;

        board[index] = player.symbol;
        currentTurn = currentTurn === 'X' ? 'O' : 'X';
        io.emit('update-board', { board, currentTurn });

        const winner = checkWinner(board);
        if (winner) {
            io.emit('status', `Player ${winner} wins!`);
            board = Array(9).fill(null);
            currentTurn = 'X';
        } else if (!board.includes(null)) {
            io.emit('status', 'Draw!');
            board = Array(9).fill(null);
            currentTurn = 'X';
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        players = players.filter(p => p.id !== socket.id);
        board = Array(9).fill(null);
        io.emit('status', 'A player left. Waiting for players...');
    });
});

function checkWinner(board) {
    const combos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
    ];
    for (let [a, b, c] of combos) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

server.listen(5001, () => {
    console.log('Tic Tac Toe server running on port 5001');
});

