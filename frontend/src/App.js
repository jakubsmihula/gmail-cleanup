import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Mails from './Mails';

function Home() {
  return <h1>Hello, welcome to the app!</h1>;
}

function App() {
  return (
      <Router>
        <nav>
          <Link to="/">Home</Link> | <Link to="/mails">Mails</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mails" element={<Mails />} />
        </Routes>
      </Router>
  );
}

export default App;
