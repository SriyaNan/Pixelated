import "./App.css";
import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext";
import "./Slider.css";

// Game images
import snake from "./images/snake.jpg";
import number from "./images/guessnumber.png";
import flappy from "./images/flappy.jpg";
import slidepuzzle from "./images/puzzle.jpg";
import tetris from "./images/tetris.jpg";
import tictactoe from "./images/tictactoe.jpg";

function Dashboard() {
    const { user, setUserContext } = useContext(UserContext);
    const navigate = useNavigate();

    const [activeIndex, setActiveIndex] = useState(0);
    const [showAuthPopup, setShowAuthPopup] = useState(false);
    const intervalRef = useRef(null);

    const handleLogout = async () => {
        try {
            await fetch("http://127.0.0.1:5000/api/logout", {
                method: "POST",
                credentials: "include",
            });
            setUserContext(null);
            navigate("/"); 
        } catch {
            alert("Logout failed");
        }
    };

    const games = [
        { title: "Flappy Bird", link: "/games/Flappybird", img: flappy },
        { title: "Guess the Number", link: "/games/Guessnumber", img: number },
        { title: "Slide Puzzle", link: "/games/Slidepuzzle", img: slidepuzzle },
        { title: "Snake Game", link: "/games/Snake", img: snake },
        { title: "Tetris", link: "/games/Tetris", img: tetris },
        { title: "Tic-Tac-Toe", link: "/games/Tictactoe", img: tictactoe },
        { title: "2 player Tic-Tac-Toe", desc: "A game of strategy, where you play against a friend.", link: "/games/twoplayerttt", img: tictactoe },
        
    ];

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

    return (
        <div className="App">
            {/* ------------------ NAVBAR ------------------ */}
            <nav className="navbar">
                <h1>Pixelated</h1>
                <>
                    <Link
                        to="/Leaderboards"
                        style={{
                            color: "white",
                            textDecoration: "none",
                            fontWeight: "500",
                            marginLeft: 20,
                        }}
                    >
                        Leaderboards
                    </Link>

                    <button onClick={handleLogout}>Log Out</button>
                </>
            </nav>

            {/* ------------------ SLIDER ------------------ */}
            <div className="slider">
                <div className="list">
                    {games.map((game, index) => (
                        <div
                            key={index}
                            className={`item ${index === activeIndex ? "active" : ""}`}
                        >
                            <div className="content1">
                                <p>Play</p>
                                <h2>{game.title}</h2>
                                {user ? (
                                    <Link to={game.link} className="play-button">
                                        Play Game &#8599;
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => setShowAuthPopup(true)}
                                        className="play-button"
                                    >
                                        Log in to Play
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Arrows */}
                <div className="arrows">
                    <button onClick={prevSlide}>←</button>
                    <button onClick={nextSlide}>→</button>
                </div>

                {/* Thumbnails */}
                <div className="thumbnail">
                    {games.map((game, index) => (
                        <div
                            key={index}
                            className={`item ${index === activeIndex ? "active" : ""}`}
                            onClick={() => setActiveIndex(index)}
                        >
                            <img src={game.img} alt={game.title} />
                            <div className="cardname">{game.title}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ------------------ AUTH POPUP ------------------ */}
            {showAuthPopup && (
                <div
                    className="auth-popup"
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0,0,0,0.8)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 2000,
                    }}
                >
                    <div
                        className="popup-content"
                        style={{
                            background: "#111",
                            padding: "40px",
                            borderRadius: "16px",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                            color: "white",
                            textAlign: "center",
                            width: "350px",
                            border: "1px solid white",
                        }}
                    >
                        <button
                            onClick={() => setShowAuthPopup(false)}
                            style={{
                                background: "none",
                                color: "white",
                                border: "none",
                                fontSize: "1.2rem",
                                position: "absolute",
                                top: "20px",
                                right: "20px",
                                cursor: "pointer",
                            }}
                        >
                            ✖
                        </button>
                        <h3 style={{ marginBottom: "20px" }}>Login to Continue</h3>
                        <p style={{ fontSize: "0.95rem", marginBottom: "20px" }}>
                            You need to log in to play and save your scores.
                        </p>
                        <button
                            onClick={() => navigate("/login")}
                            style={{
                                background: "white",
                                color: "black",
                                padding: "10px 20px",
                                borderRadius: "10px",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: "600",
                                fontSize: "1rem",
                            }}
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
