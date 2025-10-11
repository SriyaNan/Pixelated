import "./App.css";
import React, { useState, useEffect, useRef } from "react";
import { useContext } from "react";
import { UserContext } from "./UserContext";
import { Link } from "react-router-dom";
import "./Slider.css";
import snake from "./images/snake.jpg";
import number from "./images/guessnumber.png";
import flappy from "./images/flappy.jpg";
import slidepuzzle from "./images/puzzle.jpg";
import tetris from "./images/tetris.jpg";
import tictactoe from "./images/tictactoe.jpg";
import { useNavigate } from "react-router-dom";



function App() {
    const navigate = useNavigate();
    const [showAuthPopup, setShowAuthPopup] = useState(false);
    const [authMode, setAuthMode] = useState("login"); // "login" or "signup"
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const intervalRef = useRef(null);
    // Keep only:
    const { user, setUserContext } = useContext(UserContext);


    const games = [
        { title: "Flappy Bird", desc: "A classic game where you navigate a bird through obstacles.", link: "/games/Flappybird", img: flappy },
        { title: "Guess the Number", desc: "A guessing game where you try to guess a random number.", link: "/games/Guessnumber", img: number },
        { title: "Slide Puzzle", desc: "A puzzle game where you slide tiles to form a complete image.", link: "/games/Slidepuzzle", img: slidepuzzle },
        { title: "Snake Game", desc: "A classic game where you navigate a snake to eat food.", link: "/games/Snake", img: snake },
        { title: "Tetris", desc: "A classic puzzle game where you rotate blocks to form a solid line.", link: "/games/Tetris", img: tetris },
        { title: "Tic-Tac-Toe", desc: "A game of strategy, where you play against the computer or a friend.", link: "/games/Tictactoe", img: tictactoe },
    ];

    // Slider functions
    const nextSlide = () => setActiveIndex((prev) => (prev + 1) % games.length);
    const prevSlide = () => setActiveIndex((prev) => (prev - 1 + games.length) % games.length);

    useEffect(() => {
        intervalRef.current = setInterval(nextSlide, 5000);
        return () => clearInterval(intervalRef.current);
    }, []);

    useEffect(() => {
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(nextSlide, 5000);
    }, [activeIndex]);

    useEffect(() => {
        async function fetchCurrentUser() {
            try {
                const res = await fetch("http://localhost:5000/api/current_user", {
                    credentials: "include",
                });
                const data = await res.json();
                if (data.user) {
                    setUserContext(data.user);
                } else {
                    setUserContext(null);
                }
            } catch {
                setUserContext(null);
            }
        }
        fetchCurrentUser();
    }, []);


    // -----------------------------
    // Login with Flask API
    // -----------------------------
    const handleLogin = async () => {
        if (!username || !password) return alert("Enter username and password");

        try {
            const res = await fetch("http://localhost:5000/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();
            if (res.ok) {
                setUserContext({ username: data.username }); // ✅ set in context
                setShowAuthPopup(false);
                setUsername("");
                setPassword("");
                navigate("/dashboard"); // Redirect to dashboard after login
            } else {
                alert(data.error || "Login failed");
            }
        } catch {
            alert("Network error");
        }
    };

    // -----------------------------
    // Signup with Flask API
    // -----------------------------
    const handleSignup = async () => {
        if (!email || !username || !password) return alert("Enter all fields");

        try {
            const res = await fetch("http://127.0.0.1:5000/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, username, password }),
            });

            const data = await res.json();
            if (res.ok) {
                alert("Signup successful! Please log in.");
                setAuthMode("login");
                setShowAuthPopup(false);
                setEmail("");
                setUsername("");
                setPassword("");
                navigate("/dashboard");
            } else {
                alert(data.error || "Signup failed");
            }
        } catch {
            alert("Network error");
        }
    };

    // -----------------------------
    // Logout
    // -----------------------------
    const handleLogout = async () => {
        try {
            await fetch("http://127.0.0.1:5000/api/logout", {
                method: "POST",
                credentials: "include",
            });
            setUserContext(null); // ✅ clear context
        } catch {
            alert("Logout failed");
        }
    };

    return (
        <div className="App">
            <nav className="navbar">
                <h1>Pixelated</h1>
                {user ? (
                    <>
                        <Link to="/Leaderboards" style={{ color: "white", textDecoration: "none", fontWeight: "500", marginLeft: 20 }}>
                            Leaderboards
                        </Link>

                        <button onClick={handleLogout}>Log Out</button>
                    </>
                ) : (
                    <button onClick={() => setShowAuthPopup(true)}>Log In</button>
                )}
            </nav>



            {/* Slider */}
            <div className="slider">

                <div className="list">
                    {games.map((game, index) => (
                        <div key={index} className={`item ${index === activeIndex ? "active" : ""}`}>
                            <div className="content1">
                                <p>Play</p>
                                <h2>{game.title}</h2>
                                <p>{game.desc}</p>
                                {user ? (
                                    <Link to={game.link} className="play-button">
                                        Play Game &#8599;
                                    </Link>
                                ) : (
                                    <button onClick={() => setShowAuthPopup(true)} className="play-button">
                                        Log in to Play
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="arrows">
                    <button onClick={prevSlide}>←</button>
                    <button onClick={nextSlide}>→</button>
                </div>

                <div className="thumbnail">
                    {games.map((game, index) => (
                        <div key={index} className={`item ${index === activeIndex ? "active" : ""}`} onClick={() => setActiveIndex(index)}>
                            <img src={game.img} alt={game.title} />
                            <div className="cardname">{game.title}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Auth Popup */}
            {showAuthPopup && (
                <div className="popup-overlay" onClick={() => setShowAuthPopup(false)}>
                    <div className="popup-box" onClick={e => e.stopPropagation()}>
                        <h2>{authMode === "login" ? "Log In" : "Sign Up"}</h2>

                        {authMode === "signup" && (
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        )}
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />

                        {authMode === "login" ? (
                            <>
                                <button onClick={handleLogin}>Log In</button>
                                <p>
                                    Don’t have an account?{" "}
                                    <span className="auth-switch" onClick={() => setAuthMode("signup")}>Sign Up</span>
                                </p>
                            </>
                        ) : (
                            <>
                                <button onClick={handleSignup}>Sign Up</button>
                                <p>
                                    Already have an account?{" "}
                                    <span className="auth-switch" onClick={() => setAuthMode("login")}>Log In</span>
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
