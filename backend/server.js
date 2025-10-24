import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(
    cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    })
);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

let players = [];
let currentTurn = "X";
let board = Array(9).fill(null);
let gameOver = false;

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // assign player
    if (players.length < 2) {
        const symbol = players.length === 0 ? "X" : "O";
        players.push({ id: socket.id, symbol: symbol });
        socket.emit("player-assign", symbol);
        io.emit("status", `Player ${symbol} joined!`);
    } else {
        socket.emit("status", "Game full. Try again later.");
        socket.disconnect(true);
        return;
    }

    // ✅ always check if both players are ready and then start game
    setTimeout(() => {
        if (players.length === 2 && !gameOver) {
            io.emit("status", "Game start! Player X goes first.");
            io.emit("update-board", { board, currentTurn });
        } else if (players.length === 1) {
            io.emit("status", "Waiting for another player to join...");
        }
    }, 200); // short delay ensures both clients subscribed

    socket.on("make-move", (index) => {
        const player = players.find((p) => p.id === socket.id);
        if (!player || board[index] || player.symbol !== currentTurn || gameOver) return;

        board[index] = player.symbol;
        currentTurn = currentTurn === "X" ? "O" : "X";
        io.emit("update-board", { board, currentTurn });

        const winner = checkWinner(board);
        if (winner) {
            io.emit("status", `Player ${winner} wins!`);
            io.emit("game-over");
            gameOver = true;
        } else if (!board.includes(null)) {
            io.emit("status", "Draw!");
            io.emit("game-over");
            gameOver = true;
        }
    });

    socket.on("rematch", () => {
        console.log("Rematch by:", socket.id);
        resetGame();
        io.emit("status", "Rematch started! Player X goes first.");
        io.emit("update-board", { board, currentTurn });
    });

    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);
        players = players.filter((p) => p.id !== socket.id);
        if (players.length === 0) {
            resetGame();
        } else {
            io.emit("status", "A player left. Waiting for another player...");
            board = Array(9).fill(null);
            currentTurn = "X";
            gameOver = false;
        }
    });
});

function checkWinner(board) {
    const combos = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (const [a, b, c] of combos) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    return null;
}

function resetGame() {
    players = [];
    board = Array(9).fill(null);
    currentTurn = "X";
    gameOver = false;
    console.log("Game reset, waiting for new players...");
}

server.listen(5001, () => console.log("Tic Tac Toe server running on 5001"));
