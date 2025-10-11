import React, { useEffect, useRef, useState, useContext } from "react";
import { UserContext } from "../UserContext";

export default function FlappyBird() {
    const { user } = useContext(UserContext);

    const canvasRef = useRef(null);

    // initialize best from localStorage (instant on refresh)
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

    // refs to hold latest values without forcing canvas effect re-runs
    const bestRef = useRef(best);
    const scoreRef = useRef(score);

    useEffect(() => { bestRef.current = best; try { localStorage.setItem("flappy_best", String(best)); } catch { } }, [best]);
    useEffect(() => { scoreRef.current = score; }, [score]);

    // -----------------------------
    // Fetch max score for the user (backend)
    // -----------------------------
    const fetchMaxScore = async () => {
        if (!user) return;
        try {
            const res = await fetch("http://localhost:5000/api/get_maxscore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: user.username, game: "Flappy" }),
            });
            const data = await res.json();
            if (res.ok) {
                const ms = data.maxscore ?? 0;
                // update both state + localStorage
                setBest(ms);
            } else {
                console.warn("get_maxscore failed:", data);
            }
        } catch (err) {
            console.error("Failed to fetch maxscore", err);
        }
    };

    // -----------------------------
    // Save score to backend (and localStorage)
    // -----------------------------
    const saveScore = async (newScore) => {
        // always persist locally instantly
        try { localStorage.setItem("flappy_best", String(newScore)); } catch { }

        // only call backend if user exists
        if (!user) return;
        try {
            await fetch("http://localhost:5000/api/update_score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username: user.username, score: newScore, game: "Flappy" }),
            });
        } catch (err) {
            console.error("Error saving score:", err);
        }
    };

    // Fetch best when user becomes available (or on mount if user already there)
    useEffect(() => {
        if (user) fetchMaxScore();
        else setBest((prev) => prev || 0);
        // only run when `user` changes
    }, [user]);

    // When the game ends (running toggles false), save if it's a new best
    useEffect(() => {
        if (!running && scoreRef.current > 0) {
            const s = scoreRef.current;
            const b = bestRef.current;
            if (s > b) {
                setBest(s);           // updates state + localStorage via effect above
                saveScore(s);         // persist to backend if user exists
            }
        }
        // intentionally only depend on `running` so this runs exactly when the game stops
    }, [running]);

    // -----------------------------
    // Game logic (canvas) — depends only on `running`
    // -----------------------------
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
            // IMPORTANT: do NOT save on restart — we save after a game ends instead
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
            // show the current best from ref so it updates without restarting the effect
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
    }, [running]); // don't depend on `best` (avoids resetting game loop)

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",        // Prevent scrolling
                margin: 0,
                padding: 0,
                backgroundColor: "#0b0b12" // optional: match your game bg color
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    imageRendering: "pixelated",
                    display: "block"
                }}
            />
            <p style={{ fontSize: "12px", color: "#888", marginTop: "12px" }}>
                Press Space to flap. Avoid the pipes.
            </p>
        </div>
    );

}
