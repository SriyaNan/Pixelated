import { useMemo, useState } from "react";
import { useContext } from "react";
import { UserContext } from "../UserContext";

export default function GuessNumber() {
    const { user } = useContext(UserContext);
    const target = useMemo(() => Math.floor(Math.random() * 100) + 1, []);
    const [guess, setGuess] = useState("");
    const [msg, setMsg] = useState("Guess a number between 1 and 100.");
    const [attempts, setAttempts] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    function submit() {
        if (gameOver) return;
        const n = Number.parseInt(guess, 10);
        if (isNaN(n)) return setMsg("Enter a valid number.");
        if (n < 1 || n > 100) return setMsg("Stay between 1 and 100.");

        setAttempts((prev) => prev + 1);

        if (n === target) {
            setMsg(`Correct! You took ${attempts + 1} attempts. Refresh to play again.`);
            setGameOver(true);

            if (user) {
                const score = (attempts + 1) * 0.5; // multiply attempts by 0.5
                fetch("http://localhost:5000/api/guessnumber_score", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ username: user.username, score }),
                }).catch((err) => console.error("Error saving score:", err));
            }
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
                    fontWeight: 100,
                    letterSpacing: "5px",
                    userSelect: "none",
                    borderBottom: "1px solid white",
                }}
            >
                <h1 style={{ margin: 0 }}>Pixelated</h1>
            </nav>
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
                                transition: "background 0.2s",
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
