import { createContext, useState } from "react";

export const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUserContext] = useState(null); // will hold { username, id, etc. }

    return (
        <UserContext.Provider value={{ user, setUserContext }}>
            {children}
        </UserContext.Provider>
    );
}
