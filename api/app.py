from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from supabase import create_client, Client

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])


# Flask secret key (used for session)
app.config['SECRET_KEY'] = "9f2b8f4c3a2d1e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f"

app.config.update(
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_SECURE=False,  # True if using HTTPS
    SESSION_COOKIE_HTTPONLY=True
)


# Supabase setup
SUPABASE_URL = "https://zgnkqgnznkdggtympkdr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbmtxZ256bmtkZ2d0eW1wa2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDM3NzQsImV4cCI6MjA3NDkxOTc3NH0.owJGzsJ8y5IhPHopdEsjy4McGgfG2o12hsJ42v4FwtA"   # ⚠️ use service_role key for backend only (never expose to frontend)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route('/api/current_user', methods=['GET'])
def current_user():
    user_id = session.get("user_id")
    username = session.get("username")
    if user_id and username:
        return jsonify({"user": {"id": user_id, "username": username}})
    else:
        return jsonify({"user": None})


# -----------------------------
# SIGNUP
# -----------------------------
@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        email = data.get("email")
        username = data.get("username")
        password = data.get("password")

        if not email or not username or not password:
            return jsonify({"error": "Missing fields"}), 400

        existing = supabase.table("user1").select("*").or_(f"email.eq.{email},username.eq.{username}").execute()
        if existing.data:
            return jsonify({"error": "User/email already exists"}), 400

        password_hash = generate_password_hash(password)

        response = supabase.table("user1").insert({
            "email": email,
            "username": username,
            "password": password_hash,
            "Tetris": 0,
            "Slide": 0,
            "Snake": 0,
            "guessnum": 0,
            "TTT": 0,
            "Flappy": 0
        }).execute()

        return jsonify({"message": "Signup successful", "user": response.data}), 201
    except Exception as e:
        print("Signup error:", e)
        return jsonify({"error": str(e)}), 500

# -----------------------------
# LOGIN
# -----------------------------
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Missing fields"}), 400

    # Find user
    response = supabase.table("user1").select("*").eq("username", username).execute()
    if not response.data:
        return jsonify({"error": "Invalid credentials"}), 401

    user = response.data[0]

    if not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    # ✅ Only set session after successful login
    session["user_id"] = user["id"]
    session["username"] = user["username"]

    return jsonify({"message": "Login successful", "username": user["username"]})

# -----------------------------
# LOGOUT
# -----------------------------
@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop("user_id", None)
    session.pop("username", None)
    return jsonify({"message": "Logged out"})

# -----------------------------
# TEST GET USERS
# -----------------------------
@app.route('/api/users', methods=['GET'])
def get_users():
    response = supabase.table("user1").select("*").execute()

    return jsonify({"users": response.data, "name": session.get("username")})


#-----------------------------
# UPDATE SCORE
#-----------------------------
# @app.route('/api/update_score', methods=['POST'])
# def update_score():
#     user_id = session.get("user_id")

#     data = request.json
#     score = data.get("score")

#     if score is None:
#         return jsonify({"error": "Missing score"}), 400

#     if user_id:
#         result = supabase.table("user1") \
#             .update({"Flappy": score * 10}) \
#             .eq("id", user_id) \
#             .execute()
#     else:
#         username = data.get("username")
#         if not username:
#             return jsonify({"error": "Not logged in"}), 401
#         result = supabase.table("user1") \
#             .update({"Flappy": score * 10}) \
#             .eq("username", username) \
#             .execute()

#     if result.error:
#         return jsonify({"error": str(result.error)}), 500

#     return jsonify({"message": "Score updated!"})

# -----------------------------
# GUESS NUMBER SCORE (example of another game score endpoint)
# -----------------------------

user_scores = {}

@app.route("/api/guessnumber_score", methods=["POST"])
def guessnumber_score():
    data = request.get_json()
    username = data.get("username")
    score = data.get("score")

    if not username or score is None:
        return jsonify({"error": "Invalid data"}), 400

    # Save or update score
    prev_score = user_scores.get(username, 0)
    user_scores[username] = max(prev_score, score)

    return jsonify({"message": "Score saved", "score": user_scores[username]})

@app.route("/api/leaderboards", methods=["GET"])
def leaderboards():
    try:
        # Fetch all users and their scores from Supabase
        response = supabase.table("user1").select(
            "username, Flappy, guessnum, Slide, Snake, Tetris, TTT"
        ).execute()

        # ✅ Use the correct response parsing
        users = response.data
        if users is None:
            return jsonify({"error": "No data returned from Supabase"}), 500

        # Compute total score for each user
        leaderboard = []
        for u in users:
            total_score = sum([
                u.get("Flappy") or 0,
                u.get("guessnum") or 0,
                u.get("Slide") or 0,
                u.get("Snake") or 0,
                u.get("Tetris") or 0,
                u.get("TTT") or 0
            ])
            leaderboard.append({
                "username": u["username"],
                "total_score": total_score
            })

        # ✅ Sort by total score ascending
        leaderboard.sort(key=lambda x: x["total_score"])

        return jsonify({"users": leaderboard}), 200

    except Exception as e:
        print("❌ Leaderboard error:", e)
        return jsonify({"error": str(e)}), 500




# -----------------------------
# GET MAX SCORE
# -----------------------------

@app.route("/api/get_maxscore", methods=["POST"])
def get_maxscore():
    try:
        data = request.get_json()
        username = data.get("username")
        game = data.get("game", "Flappy")  # default to Flappy

        if not username:
            return jsonify({"error": "Missing username"}), 400

        response = supabase.table("user1").select(game).eq("username", username).execute()

        # Supabase Python client returns result.data as a list
        if not response.data:
            return jsonify({"maxscore": 0})

        maxscore = response.data[0].get(game, 0)
        return jsonify({"maxscore": maxscore})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -----------------------------
# UPDATE SCORE (revised to handle both logged-in and guest users)
# -----------------------------

@app.route('/api/update_score', methods=['POST'])
def update_score():
    try:
        user_id = session.get("user_id")
        data = request.get_json()
        score = data.get("score")
        if score is None:
            return jsonify({"error": "Missing score"}), 400

        if user_id:
            result = supabase.table("user1").update({"Flappy": score}).eq("id", user_id).execute()
        else:
            username = data.get("username")
            if not username:
                return jsonify({"error": "Not logged in"}), 401
            result = supabase.table("user1").update({"Flappy": score}).eq("username", username).execute()

        if getattr(result, "error", None):
            return jsonify({"error": str(result.error)}), 500

        return jsonify({"message": "Score updated!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == "__main__":
    app.run(debug=True)
