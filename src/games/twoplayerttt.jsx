import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5001", {
    transports: ["websocket"],
    withCredentials: false,
});

export default function TwoPlayerTicTacToe() {
    const [status, setStatus] = useState("Connecting...");
    const [roomId, setRoomId] = useState(null);
    const [myMark, setMyMark] = useState(null);
    const [game, setGame] = useState({
        board: Array(9).fill(null),
        turn: "X",
        winner: null,
    });

    useEffect(() => {
        socket.on("connect", () => setStatus("Connected"));
        socket.on("waiting", () => setStatus("Waiting for opponent..."));
        socket.on("matched", ({ roomId, playerMap }) => {
            setRoomId(roomId);
            setMyMark(playerMap[socket.id]);
            setStatus("Matched!");
        });
        socket.on("gameState", (state) => setGame(state));

        return () => socket.disconnect();
    }, []);

    const findMatch = () => socket.emit("findMatch", { name: "Player" });
    const makeMove = (i) => socket.emit("makeMove", { roomId, index: i });
    const restart = () => socket.emit("restart", { roomId });

    return (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <h2>Tic Tac Toe (Flask + Socket.IO)</h2>
            <p>Status: {status}</p>
            {!roomId && <button onClick={findMatch}>Find Match</button>}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    width: "240px",
                    margin: "20px auto",
                }}
            >
                {game.board.map((cell, i) => (
                    <button
                        key={i}
                        onClick={() => makeMove(i)}
                        disabled={!!game.board[i] || game.winner}
                        style={{
                            width: "80px",
                            height: "80px",
                            fontSize: "2rem",
                            border: "1px solid #333",
                        }}
                    >
                        {cell}
                    </button>
                ))}
            </div>

            {game.winner && (
                <h3>{game.winner === "draw" ? "Draw!" : `Winner: ${game.winner}`}</h3>
            )}
            {roomId && <button onClick={restart}>Restart</button>}
        </div>
    );
}
