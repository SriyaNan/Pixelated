import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import '../App.css';
import { useNavigate } from "react-router-dom";


const socket = io('http://localhost:5001');

function App() {
    const navigate = useNavigate();
    const [board, setBoard] = useState(Array(9).fill(null));
    const [player, setPlayer] = useState('');
    const [turn, setTurn] = useState('');
    const [status, setStatus] = useState('Waiting for players...');
    const [gameOver, setGameOver] = useState(false);

    useEffect(() => {
        socket.on('player-assign', (symbol) => {
            setPlayer(symbol);
            setStatus(`You are Player ${symbol}`);
        });

        socket.on('update-board', ({ board, currentTurn }) => {
            setBoard(board);
            setTurn(currentTurn);
        });

        socket.on('status', (msg) => {
            setStatus(msg);
        });

        socket.on('game-over', () => {
            setGameOver(true);
        });

        return () => {
            socket.off('player-assign');
            socket.off('update-board');
            socket.off('status');
            socket.off('game-over');
        };
    }, []);

    const handleClick = (index) => {
        if (board[index] || turn !== player || gameOver) return;
        socket.emit('make-move', index);
    };

    const handleRematch = () => {
        socket.emit('rematch');
        setGameOver(false);
    };

    return (
        <>
            <nav className="navbar">
                <h1>Pixelated</h1>
            </nav>
            <button
                onClick={() => navigate("/dashboard")}
                style={{
                    position: "absolute",
                    top: 70,
                    left: 20,
                    background: "none",
                    color: "#22c55e",
                    border: "1px solid #22c55e",
                    borderRadius: 8,
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontFamily: "monospace",
                    transition: "0.2s",
                    zIndex: 10,
                }}
                onMouseOver={(e) => (e.target.style.background = "#22c55e")}
                onMouseOut={(e) => (e.target.style.background = "none")}
            >
                ← Back
            </button>     
            <div className="game-container">
            <h1>Tic Tac Toe</h1>
            <p className="status">{status}</p>
            <div className="board">
                {board.map((cell, i) => (
                    <div key={i} className="cell" onClick={() => handleClick(i)}>
                        {cell}
                    </div>
                ))}
            </div>
            {player && <p>You are: <strong>{player}</strong></p>}
            {gameOver && (
                <button className="rematch-btn" onClick={handleRematch}>
                    Rematch 🔁
                </button>
            )}
        </div>
        </>
    );
}

export default App;
