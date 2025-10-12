import express from "express";
import session from "express-session";
import cors from "cors";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    }),
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            sameSite: "lax", // 'none' only if using HTTPS
            secure: false,    // true if using HTTPS
            httpOnly: true,
        },
    })
);


app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            sameSite: "none",
            secure: false, // true if using HTTPS
            httpOnly: true,
        },
    })
);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);



// LOGIN
app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: "Missing fields" });

        const { data, error } = await supabase
            .from("user1")
            .select("*")
            .eq("username", username);

        if (!data || data.length === 0) return res.status(401).json({ error: "Invalid credentials" });

        const user = data[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: "Invalid credentials" });

        req.session.user_id = user.id;
        req.session.username = user.username;

        res.json({ message: "Login successful", user: { id: user.id, username: user.username } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// SIGNUP (auto-login after signup)
app.post("/api/signup", async (req, res) => {
    try {
        const { email, username, password } = req.body;
        if (!email || !username || !password) return res.status(400).json({ error: "Missing fields" });

        const { data: existing } = await supabase
            .from("user1")
            .select("*")
            .or(`email.eq.${email},username.eq.${username}`);

        if (existing?.length > 0) return res.status(400).json({ error: "User/email already exists" });

        const password_hash = await bcrypt.hash(password, 10);

        const { data, error } = await supabase.from("user1").insert([{
            email,
            username,
            password: password_hash,
            Tetris: 0,
            Slide: 0,
            Snake: 0,
            guessnum: 0,
            TTT: 0,
            Flappy: 0,
        }]);

        if (error) throw error;

        // Auto-login after signup
        const newUser = data[0];
        req.session.user_id = newUser.id;
        req.session.username = newUser.username;

        res.status(201).json({ message: "Signup successful", user: { id: newUser.id, username: newUser.username } });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// UPDATE SCORE (Flappy)
app.post("/api/update_score", async (req, res) => {
    try {
        const { score } = req.body;
        const user_id = req.session.user_id;

        if (!user_id) return res.status(401).json({ error: "Not logged in" });
        if (score == null) return res.status(400).json({ error: "Missing score" });

        // fetch current score first
        const { data, error: fetchError } = await supabase
            .from("user1")
            .select("Flappy")
            .eq("id", user_id)
            .single();

        if (fetchError) throw fetchError;

        const currentBest = data?.Flappy || 0;
        if (score > currentBest) {
            const { error } = await supabase
                .from("user1")
                .update({ Flappy: score })
                .eq("id", user_id);

            if (error) throw error;
        }

        res.json({ message: "Score updated!" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET CURRENT USER
app.get("/api/current_user", (req, res) => {
    if (req.session.user_id && req.session.username) {
        res.json({ user: { id: req.session.user_id, username: req.session.username } });
    } else {
        res.json({ user: null });
    }
});

// -----------------------------
// LOGOUT
// -----------------------------
app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ message: "Logged out" });
    });
});

// -----------------------------
// GUESS NUMBER SCORE
// -----------------------------
const user_scores = {};

app.post("/api/guessnumber_score", (req, res) => {
    const { username, score } = req.body;
    if (!username || score == null)
        return res.status(400).json({ error: "Invalid data" });

    const prev_score = user_scores[username] || 0;
    user_scores[username] = Math.max(prev_score, score);

    res.json({ message: "Score saved", score: user_scores[username] });
});

// -----------------------------
// LEADERBOARD
// -----------------------------
app.get("/api/leaderboards", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("user1")
            .select("username, Flappy, guessnum, Slide, Snake, Tetris, TTT");

        if (error) throw error;

        const leaderboard = data.map((u) => ({
            username: u.username,
            total_score:
                (u.Flappy || 0) +
                (u.guessnum || 0) +
                (u.Slide || 0) +
                (u.Snake || 0) +
                (u.Tetris || 0) +
                (u.TTT || 0),
        }));

        leaderboard.sort((a, b) => b.total_score - a.total_score);

        res.json({ users: leaderboard });
    } catch (e) {
        console.error("Leaderboard error:", e);
        res.status(500).json({ error: e.message });
    }
});

// -----------------------------
// UPDATE GUESSNUMBER SCORE
// -----------------------------
app.post("/api/update_guessnumber_score", async (req, res) => {
    try {
        const { username, attempts } = req.body;
        if (!username || attempts == null)
            return res.status(400).json({ error: "Missing data" });

        const { data, error } = await supabase
            .from("user1")
            .select("guessnum")
            .eq("username", username);

        if (!data || data.length === 0)
            return res.status(404).json({ error: "User not found" });

        const current_best = data[0].guessnum;
        if (current_best == null || attempts < current_best) {
            await supabase
                .from("user1")
                .update({ guessnum: attempts })
                .eq("username", username);
        }

        res.json({ message: "Guess Number score updated!" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// -----------------------------
// GET MAX SCORE
// -----------------------------
app.post("/api/get_maxscore", async (req, res) => {
    try {
        const user_id = req.session.user_id;
        if (!user_id) return res.status(401).json({ error: "Not logged in" });

        const { data, error } = await supabase
            .from("user1")
            .select("Flappy")
            .eq("id", user_id);

        if (error) throw error;

        const maxscore = data?.[0]?.Flappy || 0;
        res.json({ maxscore });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});



// -----------------------------
app.listen(5000, () => console.log("✅ Server running on http://localhost:5000"));
