import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import '../App.css';

const socket = io('http://localhost:5001');

function App() {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [player, setPlayer] = useState('');
    const [turn, setTurn] = useState('');
    const [status, setStatus] = useState('Waiting for players...');

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

        return () => {
            socket.off('player-assign');
            socket.off('update-board');
            socket.off('status');
        };
    }, []);

    const handleClick = (index) => {
        if (board[index] || turn !== player) return;
        socket.emit('make-move', index);
    };

    return (
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
        </div>
    );
}

export default App;
