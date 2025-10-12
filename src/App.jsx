import { BrowserRouter, Routes, Route } from "react-router-dom";
import Flappybird from "./games/Flappybird.jsx";
import Tictactoe from "./games/Tictactoe.jsx";
import Guessnumber from "./games/Guessnumber.jsx";
import Snake from "./games/Snake.jsx";
import SlidePuzzle from "./games/Slidepuzzle.jsx";
import Tetris from "./games/Tetris.jsx";  
import Home from "./Home"; 
import Leaderboards from "./Leaderboards";
import Dashboard from "./Dashboard.jsx";
import TwoPlayerTTT from "./games/twoplayerttt.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games/FlappyBird" element={<Flappybird />} />
        <Route path="/games/TicTacToe" element={<Tictactoe />} />
        <Route path="/games/Guessnumber" element={<Guessnumber />} />
        <Route path="/games/Slidepuzzle" element={<SlidePuzzle />} />
        <Route path="/games/Snake" element={<Snake/>} />
        <Route path="/games/Tetris" element={<Tetris />} />
        <Route path="/leaderboards" element={<Leaderboards />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/games/twoplayerttt" element={<TwoPlayerTTT />} />
       
      </Routes>
    </BrowserRouter>
  );
}

export default App;
