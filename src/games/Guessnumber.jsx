import { useMemo, useState, useContext, useEffect, useRef } from "react";
import { UserContext } from "../UserContext";
import { useNavigate, Link } from "react-router-dom";

export default function GuessNumber() {
    const navigate = useNavigate();
    const { user } = useContext(UserContext);

    const target = useMemo(() => Math.floor(Math.random() * 100) + 1, []);
    const [guess, setGuess] = useState("");
    const [msg, setMsg] = useState("Guess a number between 1 and 100.");
    const [attempts, setAttempts] = useState(0);
    const [best, setBest] = useState(() => {
        try {
            const saved = localStorage.getItem("guess_best");
            return saved ? parseInt(saved, 10) : null;
        } catch {
            return null;
        }
    });
    const [gameOver, setGameOver] = useState(false);

    const bestRef = useRef(best);
    const attemptsRef = useRef(attempts);

    useEffect(() => {
        bestRef.current = best;
        try {
            if (best !== null) localStorage.setItem("guess_best", String(best));
        } catch { }
    }, [best]);

    useEffect(() => {
        attemptsRef.current = attempts;
    }, [attempts]);

    const fetchBest = async () => {
        if (!user) return;
        try {
            const res = await fetch("http://localhost:5000/api/get_guessnumber_score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username: user.username }),
            });
            const data = await res.json();
            if (res.ok) setBest(data.best ?? null);
        } catch (err) {
            console.error("Error fetching score:", err);
        }
    };

    const saveBest = async (newBest) => {
        if (!user) return;
        try {
            await fetch("http://localhost:5000/api/update_guessnumber_score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    username: user.username,
                    attempts: newBest,
                }),
            });
        } catch (err) {
            console.error("Error saving score:", err);
        }
    };

    useEffect(() => {
        if (user) fetchBest();
    }, [user]);

    function submit() {
        if (gameOver) return;
        const n = Number.parseInt(guess, 10);
        if (isNaN(n)) return setMsg("Enter a valid number.");
        if (n < 1 || n > 100) return setMsg("Stay between 1 and 100.");

        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (n === target) {
            setMsg(`✅ Correct! You took ${newAttempts} attempts.`);
            setGameOver(true);

            if (bestRef.current === null || newAttempts < bestRef.current) {
                setBest(newAttempts);
                saveBest(newAttempts);
            }
        } else if (newAttempts >= 30) {
            setMsg(`❌ Game over! You failed to guess in 30 attempts. The number was ${target}.`);
            setGameOver(true);
        } else if (n < target) setMsg("Too low!");
        else setMsg("Too high!");

        setGuess("");
    }

    return (
        <>
            <nav
                style={{
                    backgroundColor: "black",
                    height: "50px",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 20px",
                    position: "sticky",
                    top: 0,
                    zIndex: 1000,
                    color: "white",
                    fontFamily: "'Jersey 10', sans-serif",
                    letterSpacing: "5px",
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
                    minHeight: "calc(100vh - 50px)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "#000",
                }}
            >
                <div
                    style={{
                        background: "#111",
                        border: "1px solid white",
                        borderRadius: "24px",
                        padding: "40px 32px",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: "50vw",
                        minWidth: "300px",
                        maxWidth: "500px",
                    }}
                >
                    <p
                        style={{
                            marginBottom: "24px",
                            color: "white",
                            fontSize: "1.1rem",
                            textAlign: "center",
                        }}
                    >
                        {msg}
                    </p>

                    <p style={{ color: "#22c55e", fontSize: "0.9rem" }}>
                        {best !== null ? `Best: ${best} attempts` : ""}
                    </p>

                    <div style={{ display: "flex", gap: "16px" }}>
                        <input
                            type="number"
                            value={guess}
                            onChange={(e) => setGuess(e.target.value)}
                            placeholder="Enter your guess"
                            style={{
                                width: "120px",
                                padding: "10px",
                                borderRadius: "10px",
                                border: "1px solid white",
                                background: "#222",
                                color: "white",
                                fontSize: "1rem",
                                outline: "none",
                                boxShadow: "0 1px 6px rgba(255,255,255,0.1)",
                            }}
                            min="1"
                            max="100"
                        />
                        <button
                            onClick={submit}
                            style={{
                                padding: "10px 24px",
                                background: "white",
                                color: "black",
                                border: "none",
                                borderRadius: "10px",
                                fontWeight: "600",
                                cursor: "pointer",
                                fontSize: "1rem",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            }}
                        >
                            Guess
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
