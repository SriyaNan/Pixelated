import express from "express";
import http from "http";
import { Server } from "socket.io";
import session from "express-session";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true, // must match withCredentials: true
    },
});


const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
});

app.use(sessionMiddleware);

// Wrap express-session for Socket.IO
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

const waitingPlayers = [];
const rooms = {};

function checkWinner(board) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (let [a, b, c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c])
            return board[a];
    }
    if (board.every(cell => cell)) return "draw";
    return null;
}

io.on("connection", (socket) => {
    console.log("New client:", socket.id);

    socket.on("findMatch", ({ name }) => {
        socket.username = name; // store username on socket

        if (waitingPlayers.length > 0) {
            const opponent = waitingPlayers.shift();
            const roomId = `${socket.id}#${opponent.id}`;
            rooms[roomId] = {
                board: Array(9).fill(null),
                turn: "X",
                players: { X: { id: socket.id, username: socket.username }, O: { id: opponent.id, username: opponent.username } },
                marks: { [socket.id]: "X", [opponent.id]: "O" },
            };
            socket.join(roomId);
            opponent.join(roomId);

            io.to(roomId).emit("matched", {
                roomId,
                playerMap: { [socket.id]: "X", [opponent.id]: "O" },
            });

            io.to(roomId).emit("gameState", rooms[roomId]);
        } else {
            waitingPlayers.push(socket);
            socket.emit("waiting");
        }
    });

    socket.on("makeMove", async ({ roomId, index }) => {
        const room = rooms[roomId];
        if (!room) return;

        const mark = room.marks[socket.id];
        if (room.board[index] || room.turn !== mark) return;

        room.board[index] = mark;
        room.turn = mark === "X" ? "O" : "X";

        const winnerMark = checkWinner(room.board);
        if (winnerMark) {
            room.winner = winnerMark;
            io.to(roomId).emit("gameState", room);

            // Update Supabase TTT score +10 for the winner
            if (winnerMark !== "draw") {
                const winnerUsername = room.players[winnerMark].username;
                try {
                    // Fetch current score
                    const { data, error: fetchError } = await supabase
                        .from("user1")
                        .select("TTT")
                        .eq("username", winnerUsername)
                        .single();

                    if (fetchError) {
                        console.error("Error fetching TTT:", fetchError);
                    } else {
                        const newScore = (data.TTT || 0) + 10;
                        const { error: updateError } = await supabase
                            .from("user1")
                            .update({ TTT: newScore })
                            .eq("username", winnerUsername);

                        if (updateError) console.error("TTT update error:", updateError);
                        else console.log(`${winnerUsername} +10 TTT points!`);
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        } else {
            io.to(roomId).emit("gameState", room);
        }
    });


    socket.on("restart", ({ roomId }) => {
        const room = rooms[roomId];
        if (!room) return;
        room.board = Array(9).fill(null);
        room.turn = "X";
        room.winner = null;
        io.to(roomId).emit("gameState", room);
    });

    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);
        const idx = waitingPlayers.indexOf(socket);
        if (idx !== -1) waitingPlayers.splice(idx, 1);
    });
});

server.listen(5001, () => console.log("✅ Socket.IO server running on http://localhost:5001"));
