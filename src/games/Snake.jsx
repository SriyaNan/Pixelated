import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Snake() {
    const navigate = useNavigate();
    const ref = useRef(null);
    const [running, setRunning] = useState(true);
    const [gameOver, setGameOver] = useState(false);

    useEffect(() => {
        const c = ref.current;
        if (!c) return;
        const ctx = c.getContext("2d");
        const size = 20;
        const W = 20,
            H = 20;
        c.width = W * size;
        c.height = H * size;
        c.style.imageRendering = "pixelated";

        let dir = [1, 0];
        let snake = [
            [8, 10],
            [7, 10],
            [6, 10],
        ];
        let food = [Math.floor(Math.random() * W), Math.floor(Math.random() * H)];
        let raf = 0;
        let tick = 0;
        let speed = 7;
        let score = 0;

        function step() {
            tick++;
            if (tick % Math.max(1, Math.floor(60 / speed)) === 0 && !gameOver) {
                let head = [snake[0][0] + dir[0], snake[0][1] + dir[1]];

                if (head[0] < 0 || head[0] >= W || head[1] < 0 || head[1] >= H) {
                    setGameOver(true);
                    setRunning(false);
                    return; 
                }

                // hit self
                if (snake.some(([x, y]) => x === head[0] && y === head[1])) {
                    setGameOver(true);
                    setRunning(false);
                    return;
                } else {
                    snake.unshift(head);
                    if (head[0] === food[0] && head[1] === food[1]) {
                        score++;
                        speed = Math.min(18, speed + 0.5);
                        food = [Math.floor(Math.random() * W), Math.floor(Math.random() * H)];
                    } else snake.pop();
                }
            }

            // draw
            ctx.fillStyle = "#0b0b12";
            ctx.fillRect(0, 0, c.width, c.height);

            ctx.fillStyle = "#10b981";
            snake.forEach(([x, y]) => ctx.fillRect(x * size, y * size, size, size));

            ctx.fillStyle = "#ef4444";
            ctx.fillRect(food[0] * size, food[1] * size, size, size);

            ctx.fillStyle = "#e5e7eb";
            ctx.font = "12px monospace";
            ctx.fillText(`Score: ${score}`, 8, 14);

            if (running) raf = requestAnimationFrame(step);
        }

        raf = requestAnimationFrame(step);

        function onKey(e) {
            if (gameOver) return;
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault(); 
            }
            if (e.key === "ArrowUp" && dir[1] !== 1) dir = [0, -1];
            if (e.key === "ArrowDown" && dir[1] !== -1) dir = [0, 1];
            if (e.key === "ArrowLeft" && dir[0] !== 1) dir = [-1, 0];
            if (e.key === "ArrowRight" && dir[0] !== -1) dir = [1, 0];
            }


        window.addEventListener("keydown", onKey);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("keydown", onKey);
        };
    }, [running, gameOver]);

    return (
        <>
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

            <main
                style={{
                    height: "100vh",
                    paddingTop: 60,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 12,
                    fontFamily: "sans-serif",
                    backgroundColor: "#000000ff",
                    color: "white",
                }}
            >
                <canvas
                    ref={ref}
                    style={{
                        borderRadius: 12,
                        border: "2px solid #10b981",
                        boxShadow: "0 0 8px #10b981",
                        display: "block",
                    }}
                />
                <button
                    onClick={() => {
                        setGameOver(false);
                        setRunning(true);
                    }}
                    style={{
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        padding: "8px 20px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontFamily: "inherit",
                    }}
                    disabled={running}
                >
                    {gameOver ? "Restart" : running ? "Pause" : "Resume"}
                </button>
                {gameOver && (
                    <div style={{ marginTop: 20, fontSize: 24, fontWeight: "bold", color: "#ef4444" }}>
                        You Lose!
                    </div>
                )}
            </main>
        </>
    );
}
