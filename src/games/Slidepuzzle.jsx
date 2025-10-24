import { useState } from "react";

import img1 from "../images/slider1.jpg";
import img2 from "../images/slider2.jpg";
import img3 from "../images/slider3.jpg";
import img4 from "../images/slider4.jpg";
import img5 from "../images/slider5.jpg";
import img6 from "../images/slider6.jpg";
import img7 from "../images/slider7.jpg";
import img8 from "../images/slider8.jpg";
import img9 from "../images/slider9.jpg";
import img10 from "../images/slider10.jpg";
import { Link, useNavigate } from "react-router-dom";

const IMAGES = [img1, img2, img3, img4, img5, img6, img7, img8, img9, img10];

const N = 3;
const GOAL = Array.from({ length: N * N }, (_, i) => (i + 1) % (N * N));

function shuffleSolvable(goal) {
    
    let arr;
    do {
        arr = [...goal];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    } while (!isSolvable(arr) || arraysEqual(arr, goal));
    return arr;
}

function isSolvable(arr) {
    const inv = arr.reduce(
        (acc, v, i) =>
            acc + arr.slice(i + 1).filter((x) => x && x < v).length,
        0
    );
    return inv % 2 === 0;
}

function arraysEqual(a, b) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
}

export default function SlidePuzzle() {
    const navigate = useNavigate();
    const [tiles, setTiles] = useState(() => shuffleSolvable(GOAL));
    const [moves, setMoves] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [image, setImage] = useState(() => IMAGES[Math.floor(Math.random() * IMAGES.length)]);

    function move(i) {
        if (gameOver) return;

        const empty = tiles.indexOf(0);
        const x = i % N, y = Math.floor(i / N);
        const ex = empty % N, ey = Math.floor(empty / N);
        const dx = Math.abs(x - ex) + Math.abs(y - ey);

        if (dx === 1) {
            const copy = [...tiles];
            [copy[i], copy[empty]] = [copy[empty], copy[i]];
            setTiles(copy);
            setMoves((m) => {
                const newMoves = m + 1;
                if (newMoves > 50) setGameOver(true);
                return newMoves;
            });
        }
    }

    const solved = arraysEqual(tiles, GOAL);
    const isGameEnd = solved || gameOver;

    function shuffleNewPuzzle() {
        setTiles(shuffleSolvable(GOAL));
        setMoves(0);
        setGameOver(false);
        setImage(IMAGES[Math.floor(Math.random() * IMAGES.length)]);
    }

    return (
        <>
            {/* Navbar */}
            <nav
                style={{
                    backgroundColor: "black",
                    height: 50,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 20px",
                    position: "fixed",
                    top: 0,
                    width: "100%",
                    zIndex: 1000,
                    color: "white",
                    fontFamily: "'Jersey 10', sans-serif",
                    fontWeight: 100,
                    letterSpacing: 5,
                    userSelect: "none",
                    borderBottom: "1px solid white",
                }}
            >
                <h1 style={{ margin: 0 }}>Pixelated</h1>
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

            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    paddingTop: 60,
                    gap: 40,
                    fontFamily: "sans-serif",
                }}
            >
                <div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${N}, 1fr)`,
                            gap: 4,
                            marginBottom: 16,
                            maxWidth: 400,
                            width: "100%",
                        }}
                    >
                        {tiles.map((v, i) => (
                            <button
                                key={i}
                                onClick={() => move(i)}
                                disabled={v === 0 || isGameEnd}
                                aria-label={v === 0 ? "Empty tile" : `Tile ${v}`}
                                style={{
                                    aspectRatio: "1 / 1",
                                    borderRadius: 6,
                                    border: "1px solid #555",
                                    backgroundImage: v === 0 ? "none" : `url(${image})`,
                                    backgroundSize: `${N * 100}% ${N * 100}%`,
                                    backgroundPosition:
                                        v === 0
                                            ? "none"
                                            : `${((v - 1) % N) * (100 / (N - 1))}% ${Math.floor(
                                                (v - 1) / N
                                            ) * (100 / (N - 1))}%`,
                                    imageRendering: "pixelated",
                                    cursor: v === 0 || isGameEnd ? "default" : "pointer",
                                }}
                            >
                                <span style={{ position: "absolute", left: "-9999px" }}>
                                    {v === 0 ? "Empty" : v}
                                </span>
                            </button>
                        ))}
                    </div>

                    <p style={{ marginBottom: 16, textAlign: "center" }}>
                        Moves: {moves}{" "}
                        {solved && "— 🎉 You Win!"} {gameOver && !solved && "— ❌ You Lose!"}
                    </p>

                    <div style={{ textAlign: "center" }}>
                        <button
                            onClick={shuffleNewPuzzle}
                            style={{
                                cursor: "pointer",
                                backgroundColor: "#0070f3",
                                color: "white",
                                border: "none",
                                padding: "8px 16px",
                                borderRadius: 6,
                                fontWeight: "bold",
                            }}
                        >
                            Shuffle New Puzzle
                        </button>
                    </div>
                </div>

                <div>
                    <img
                        src={image}
                        alt="Original"
                        style={{
                            maxWidth: 260,
                            border: "2px solid #333",
                            borderRadius: 6,
                            imageRendering: "pixelated",
                        }}
                    />
                    <p style={{ textAlign: "center", marginTop: 8, fontWeight: "bold" }}>
                        Original
                    </p>
                </div>
            </div>
        </>
    );
}
