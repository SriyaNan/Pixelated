import React, { useEffect, useRef, useState, useContext } from "react";
import { UserContext } from "../UserContext";
import { Link, useNavigate } from "react-router-dom";

export default function FlappyBird() {
    const navigate = useNavigate();
    const { user } = useContext(UserContext);

    const canvasRef = useRef(null);

    const [best, setBest] = useState(() => {
        try {
            const saved = typeof window !== "undefined" && localStorage.getItem("flappy_best");
            return saved ? parseInt(saved, 10) : 0;
        } catch {
            return 0;
        }
    });

    const [score, setScore] = useState(0);
    const [running, setRunning] = useState(false);

    const bestRef = useRef(best);
    const scoreRef = useRef(score);

    useEffect(() => { bestRef.current = best; try { localStorage.setItem("flappy_best", String(best)); } catch { } }, [best]);
    useEffect(() => { scoreRef.current = score; }, [score]);

    const fetchMaxScore = async () => {
        if (!user) return;

        try {
            const res = await fetch("http://localhost:5000/api/get_maxscore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include"
            });
            const data = await res.json();
            if (res.ok) {
                setBest(data.maxscore ?? 0);
            }
        } catch (err) {
            console.error(err);
        }
    };


    const saveScore = async (newScore) => {
        try { localStorage.setItem("flappy_best", String(newScore)); } catch { }

        if (!user) return;

        try {
            await fetch("http://localhost:5000/api/update_score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", 
                body: JSON.stringify({ score: newScore }) 
            });
        } catch (err) {
            console.error("Error saving score:", err);
        }
    };

    useEffect(() => {
        if (user) fetchMaxScore();
        else setBest((prev) => prev || 0);
    }, [user]);

    useEffect(() => {
        if (!running && scoreRef.current > 0) {
            const s = scoreRef.current;
            const b = bestRef.current;
            if (s > b) {
                setBest(s);          
                saveScore(s);       
            }
        }
    }, [running]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let raf = 0;

        const W = 320;
        const H = 440;
        canvas.width = W;
        canvas.height = H;
        canvas.style.imageRendering = "pixelated";

        const birdX = 50;
        const birdRadiusX = 10;
        const birdRadiusY = 8;
        const gravity = 0.2;
        const flap = -5;
        const pipeGap = 110;
        const pipeW = 36;

        let birdY = H / 2;
        let birdVel = 0;
        let pipes = [];
        let localScore = 0;
        let tick = 0;

        function reset() {
            birdY = H / 2;
            birdVel = 0;
            pipes = [];
            localScore = 0;
            tick = 0;
            setScore(0);
           
        }

        function addPipe() {
            const top = 40 + Math.random() * (H - 160);
            pipes.push({ x: W + 20, top });
        }

        function draw() {
            tick++;
            ctx.fillStyle = "#0b0b12";
            ctx.fillRect(0, 0, W, H);

            birdVel += gravity;
            birdY += birdVel;

            if (tick % 110 === 0) addPipe();

            for (let i = pipes.length - 1; i >= 0; i--) {
                const p = pipes[i];
                p.x -= 1.2;

                ctx.fillStyle = "#2dd4bf";
                ctx.fillRect(p.x, 0, pipeW, p.top);
                ctx.fillRect(p.x, p.top + pipeGap, pipeW, H - p.top - pipeGap);

                if (p.x + pipeW < 0) {
                    pipes.splice(i, 1);
                    localScore++;
                    setScore(localScore);
                }

                const hitX = p.x < birdX + birdRadiusX && p.x + pipeW > birdX - birdRadiusX;
                const hitY = birdY - birdRadiusY < p.top || birdY + birdRadiusY > p.top + pipeGap;
                if (hitX && hitY) {
                    setRunning(false);
                }
            }

            ctx.fillStyle = "#f59e0b";
            ctx.fillRect(birdX - birdRadiusX, Math.round(birdY) - birdRadiusY, birdRadiusX * 2, birdRadiusY * 2);

            ctx.fillStyle = "#111827";
            ctx.fillRect(0, H - 20, W, 20);

            ctx.fillStyle = "#e5e7eb";
            ctx.font = "12px monospace";
            ctx.fillText(`Score: ${localScore}  Best: ${Math.max(bestRef.current, localScore)}`, 8, 14);

            if (!running) ctx.fillText("Space to start/flap", 60, H / 2);

            if (birdY + birdRadiusY > H - 20 || birdY - birdRadiusY < 0) setRunning(false);

            if (running) raf = requestAnimationFrame(draw);
        }

        function drawStill() {
            ctx.fillStyle = "#0b0b12";
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = "#2dd4bf";
            pipes.forEach((p) => {
                ctx.fillRect(p.x, 0, pipeW, p.top);
                ctx.fillRect(p.x, p.top + pipeGap, pipeW, H - p.top - pipeGap);
            });
            ctx.fillStyle = "#f59e0b";
            ctx.fillRect(birdX - birdRadiusX, Math.round(birdY) - birdRadiusY, birdRadiusX * 2, birdRadiusY * 2);
            ctx.fillStyle = "#111827";
            ctx.fillRect(0, H - 20, W, 20);
            ctx.fillStyle = "#e5e7eb";
            ctx.font = "12px monospace";
            ctx.fillText(`Score: ${scoreRef.current}  Best: ${bestRef.current}`, 8, 14);
            ctx.fillText("Space to start/flap", 60, H / 2);
        }

        if (running) {
            reset();
            raf = requestAnimationFrame(draw);
        } else {
            drawStill();
        }

        function onKeyDown(e) {
            if (e.code === "Space") {
                if (!running) setRunning(true);
                else birdVel = flap;
            }
        }

        window.addEventListener("keydown", onKeyDown);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [running]); 

    return (
        <>
            <nav
                style={{
                    backgroundColor: "black",
                    height: "50px",
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
                    letterSpacing: "5px",
                    userSelect: "none",
                    borderBottom: "1px solid white",
                }}
            >
                <h1 style={{ margin: 0 }}>
                    <Link
                        to="/dashboard"
                        style={{
                            color: "white",
                            textDecoration: "none",
                            fontWeight: "500",
                            marginLeft: 20,
                        }}
                    >
                        Pixelated
                    </Link>
                </h1>
            </nav>

            <div
                style={{
                    position: "relative", 
                    width: "100vw",
                    height: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#0b0b12",
                    overflow: "hidden",
                }}
            >
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

                <canvas
                    ref={canvasRef}
                    style={{
                        borderRadius: "6px",
                        border: "1px solid #22c55e",
                        boxShadow: "0 0 8px #22c55e",
                        imageRendering: "pixelated",
                        display: "block",
                    }}
                />
                <p style={{ fontSize: "12px", color: "#888", marginTop: "12px" }}>
                    Press Space to flap. Avoid the pipes.
                </p>
            </div>
        </>
    );


}
