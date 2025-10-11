import React, { useEffect, useState } from "react";

export default function Leaderboards() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUsers() {
            try {
                const res = await fetch("http://localhost:5000/api/leaderboards", {
                    credentials: "include",
                });
                const data = await res.json();

                console.log("Leaderboard API response:", data); // ✅ debug log

                // Ensure we actually got a valid array
                if (!data.users || !Array.isArray(data.users)) {
                    console.error("Unexpected API format:", data);
                    setUsers([]);
                    setLoading(false);
                    return;
                }

                const rankedUsers = data.users.map((user, index) => ({
                    ...user,
                    rank: index + 1,
                }));

                setUsers(rankedUsers);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching leaderboards:", err);
                setLoading(false);
            }
        }
        fetchUsers();
    }, []);

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
                    justifyContent: "space-between",
                }}
            >
                <h1 style={{ margin: 0 }}>Pixelated</h1>
                <a href="/" style={{ color: "white", textDecoration: "none" }}>
                    Home
                </a>
            </nav>

            <div
                style={{
                    padding: "20px",
                    minHeight: "calc(100vh - 50px)",
                    background: "#000",
                    color: "white",
                }}
            >
                <h2>Leaderboards</h2>

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            marginTop: "20px",
                        }}
                    >
                        <thead>
                            <tr>
                                <th style={{ borderBottom: "1px solid white", padding: "8px" }}>
                                    Rank
                                </th>
                                <th style={{ borderBottom: "1px solid white", padding: "8px" }}>
                                    Username
                                </th>
                                <th style={{ borderBottom: "1px solid white", padding: "8px" }}>
                                    Total Score
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, idx) => (
                                <tr key={idx}>
                                    <td
                                        style={{
                                            borderBottom: "1px solid #ffffffff",
                                            padding: "8px",
                                            textAlign: "center",
                                        }}
                                    >
                                        {user.rank}
                                    </td>
                                    <td
                                        style={{
                                            borderBottom: "1px solid #ffffffff",
                                            padding: "8px",
                                        }}
                                    >
                                        {user.username}
                                    </td>
                                    <td
                                        style={{
                                            borderBottom: "1px solid #ffffffff",
                                            padding: "8px",
                                            textAlign: "center",
                                        }}
                                    >
                                        {user.total_score}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}
