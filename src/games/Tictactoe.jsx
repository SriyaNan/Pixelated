import React, { useState, useEffect } from "react";
import "../assets/Tictactoe.css";
import { useNavigate } from "react-router-dom";

function TicTacToe() {
    const navigate = useNavigate();
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);
    const [winner, setWinner] = useState(null);

    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
    ];

    const checkWinner = (squares) => {
        for (let [a, b, c] of lines) {
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                setWinner(squares[a]);
                return;
            }
        }
        if (!squares.includes(null)) setWinner("Draw");
    };

    const handleClick = (index) => {
        if (board[index] || winner || !isXNext) return;

        const newBoard = [...board];
        newBoard[index] = "X";
        setBoard(newBoard);
        setIsXNext(false);

        checkWinner(newBoard);
    };

    const findBestMove = (squares, player) => {
        for (let [a, b, c] of lines) {
            const line = [squares[a], squares[b], squares[c]];
            if (
                line.filter((v) => v === player).length === 2 &&
                line.includes(null)
            ) {
                if (squares[a] === null) return a;
                if (squares[b] === null) return b;
                if (squares[c] === null) return c;
            }
        }
        return -1;
    };

    useEffect(() => {
        if (winner || isXNext) return;

        const timer = setTimeout(() => {
            const newBoard = [...board];
            let move = findBestMove(newBoard, "O");
            if (move === -1) {
                move = findBestMove(newBoard, "X");
            }
            if (move === -1) {
                const availableIndices = newBoard
                    .map((v, i) => (v === null ? i : null))
                    .filter((v) => v !== null);
                move = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            }
            newBoard[move] = "O";
            setBoard(newBoard);
            setIsXNext(true);
            checkWinner(newBoard);
        }, 500);

        return () => clearTimeout(timer);
    }, [board, isXNext, winner]);

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setIsXNext(true);
        setWinner(null);
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
            <div className="tictactoe-container">
                <h1>Tic Tac Toe</h1>
                <div className="tictactoe-grid">
                    {board.map((value, index) => (
                        <button
                            key={index}
                            onClick={() => handleClick(index)}
                            className="tictactoe-button"
                        >
                            {value === "X" ? "X" : value === "O" ? "O" : ""}
                        </button>
                    ))}
                </div>
                {winner && (
                    <div className="tictactoe-info">
                        {winner === "Draw" ? "It's a Draw!" : `Winner: ${winner}`}
                    </div>
                )}
                <button onClick={resetGame} className="tictactoe-restart">
                    Restart Game
                </button>
            </div>
        </>
    );
}

export default TicTacToe;
