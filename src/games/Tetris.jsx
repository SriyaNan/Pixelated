import React, { useEffect, useRef, useState } from "react";

const W = 10;
const H = 20;
const SIZE = 20;

const SHAPES = [
    [[1, 1, 1, 1]], // I
    [
        [1, 1],
        [1, 1],
    ], // O
    [
        [1, 1, 1],
        [0, 1, 0],
    ], // T
    [
        [1, 1, 1],
        [1, 0, 0],
    ], // L
    [
        [1, 1, 1],
        [0, 0, 1],
    ], // J
    [
        [0, 1, 1],
        [1, 1, 0],
    ], // S
    [
        [1, 1, 0],
        [0, 1, 1],
    ], // Z
];

function rotate(m) {
    const r = [];
    for (let x = 0; x < m[0].length; x++) {
        r[x] = [];
        for (let y = m.length - 1; y >= 0; y--) r[x].push(m[y][x]);
    }
    return r;
}

function clone(v) {
    return JSON.parse(JSON.stringify(v));
}

export default function Tetris() {
    const canvasRef = useRef(null);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = W * SIZE;
        canvas.height = H * SIZE;
        canvas.style.imageRendering = "pixelated";

        let board = Array.from({ length: H }, () => Array(W).fill(0));
        let cur = { x: 3, y: 0, m: clone(SHAPES[Math.floor(Math.random() * SHAPES.length)]) };
        let raf = 0;
        let dropTick = 0;
        let speed = 48;
        let alive = true;

        function collide(nx = cur.x, ny = cur.y, m = cur.m) {
            for (let y = 0; y < m.length; y++) {
                for (let x = 0; x < m[y].length; x++) {
                    if (!m[y][x]) continue;
                    const yy = ny + y,
                        xx = nx + x;
                    if (xx < 0 || xx >= W || yy >= H) return true;
                    if (yy >= 0 && board[yy][xx]) return true;
                }
            }
            return false;
        }

        function merge() {
            for (let y = 0; y < cur.m.length; y++) {
                for (let x = 0; x < cur.m[y].length; x++) {
                    if (cur.m[y][x]) {
                        const yy = cur.y + y,
                            xx = cur.x + x;
                        if (yy >= 0) board[yy][xx] = 1;
                    }
                }
            }
        }

        function spawn() {
            cur = { x: 3, y: 0, m: clone(SHAPES[Math.floor(Math.random() * SHAPES.length)]) };
            if (collide()) alive = false;
        }

        function clearLines() {
            let cleared = 0;
            for (let y = H - 1; y >= 0; y--) {
                if (board[y].every((v) => v === 1)) {
                    board.splice(y, 1);
                    board.unshift(Array(W).fill(0));
                    cleared++;
                    y++;
                }
            }
            if (cleared) {
                setScore((s) => s + cleared * 100);
                speed = Math.max(16, speed - 2);
            }
        }

        function hardDrop() {
            while (!collide(cur.x, cur.y + 1)) cur.y++;
            tick(true);
        }

        function move(dx) {
            if (!collide(cur.x + dx, cur.y)) cur.x += dx;
        }

        function rotateCur() {
            const r = rotate(cur.m);
            if (!collide(cur.x, cur.y, r)) cur.m = r;
        }

        function tick(force = false) {
            dropTick++;
            if (force || dropTick % speed === 0) {
                if (!collide(cur.x, cur.y + 1)) cur.y++;
                else {
                    merge();
                    clearLines();
                    spawn();
                }
            }
            draw();
            if (alive) raf = requestAnimationFrame(() => tick());
        }

        function draw() {
            ctx.fillStyle = "#0b0b12";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (let y = 0; y < H; y++) {
                for (let x = 0; x < W; x++) {
                    if (board[y][x]) {
                        ctx.fillStyle = "#22c55e";
                        ctx.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
                    }
                }
            }

            ctx.fillStyle = "#60a5fa";
            for (let y = 0; y < cur.m.length; y++) {
                for (let x = 0; x < cur.m[y].length; x++) {
                    if (cur.m[y][x]) {
                        const yy = cur.y + y,
                            xx = cur.x + x;
                        if (yy >= 0) ctx.fillRect(xx * SIZE, yy * SIZE, SIZE, SIZE);
                    }
                }
            }

            ctx.strokeStyle = "#111827";
            for (let x = 0; x <= W; x++) {
                ctx.beginPath();
                ctx.moveTo(x * SIZE, 0);
                ctx.lineTo(x * SIZE, H * SIZE);
                ctx.stroke();
            }
            for (let y = 0; y <= H; y++) {
                ctx.beginPath();
                ctx.moveTo(0, y * SIZE);
                ctx.lineTo(W * SIZE, y * SIZE);
                ctx.stroke();
            }

            if (!alive) {
                ctx.fillStyle = "#e5e7eb";
                ctx.font = "20px monospace";
                ctx.fillText("Game Over - press R", 20, 40);
            }
        }

        function onKey(e) {
            if (!alive && e.key.toLowerCase() === "r") {
                board = Array.from({ length: H }, () => Array(W).fill(0));
                spawn();
                setScore(0);
                alive = true;
            }
            if (!alive) return;
            if (e.key === "ArrowLeft") move(-1);
            if (e.key === "ArrowRight") move(1);
            if (e.key === "ArrowUp") rotateCur();
            if (e.key === "ArrowDown") tick(true);
            if (e.key === " ") hardDrop();
        }

        window.addEventListener("keydown", onKey);
        spawn();
        raf = requestAnimationFrame(() => tick());

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("keydown", onKey);
        };
    }, []);

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
                    backgroundColor: "#0b0b12",
                    color: "white",
                    overflow: "hidden", // prevent scroll
                }}
            >

                <canvas
                    ref={canvasRef}
                    style={{
                        borderRadius: 12,
                        border: "2px solid #22c55e",
                        boxShadow: "0 0 8px #22c55e",
                        display: "block",
                    }}
                />
                <div style={{ marginTop: 12 }}>
                    Controls: ← → move, ↑ rotate, ↓ soft drop, Space hard drop.
                </div>
                <div style={{ marginTop: 4, fontWeight: "bold" }}>Score: {score}</div>
            </main>
        </>
    );
}
