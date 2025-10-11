import "./App.css";
import React, { useState, useEffect, useRef } from "react";
import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext";
import "./Slider.css";
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
    const intervalRef = useRef(null);

    const handleLogout = async () => {
        try {
            await fetch("http://127.0.0.1:5000/api/logout", {
                method: "POST",
                credentials: "include",
            });
            setUserContext(null);
            navigate("/"); // ✅ Redirect to Home.jsx
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
            <nav className="navbar">
                <h1>Pixelated</h1>
                    <>
                        <Link to="/Leaderboards" style={{ color: "white", textDecoration: "none", fontWeight: "500", marginLeft: 20 }}>
                            Leaderboards
                        </Link>

                        <button onClick={handleLogout}>Log Out</button>
                    </>
                
            </nav>

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
        </div>
    );
}

export default Dashboard;
