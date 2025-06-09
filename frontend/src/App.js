import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Mails from './Mails';
import Bin from './Bin';

function Home() {
    return <h1>Hello, welcome to the app 2!</h1>;
}

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // On mount, check login status from backend
    useEffect(() => {
        fetch('http://localhost:4000/api/auth/status', {
            credentials: 'include',
        })
            .then((res) => res.json())
            .then((data) => {
                setIsLoggedIn(data.loggedIn);
            })
            .catch(() => setIsLoggedIn(false));
    }, []);

    const handleLogout = () => {
        window.location.href = 'http://localhost:4000/auth/logout';
    };

    const login = () => {
        window.location.href = 'http://localhost:4000/auth/google';
    };

    return (
        <Router>
            <nav>
                <Link to="/">Home</Link> | <Link to="/mails">Mails</Link> | <Link to="/bin">Bin</Link> |{' '}
                {isLoggedIn ? (
                    <button onClick={handleLogout} style={{ cursor: 'pointer' }}>
                        Logout
                    </button>
                ) : (
                    <button onClick={login} style={{ cursor: 'pointer' }}>
                        Login with Google
                    </button>
                )}
            </nav>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/mails" element={<Mails />} />
                <Route path="/bin" element={<Bin />} />
            </Routes>
        </Router>
    );
}

export default App;
