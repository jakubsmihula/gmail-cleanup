import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Mails from './Mails';
import Bin from './Bin';


function Home() {
  return <h1>Hello, welcome to the app 2!</h1>;
}

function App() {
  return (
      <Router>
        <nav>
          <Link to="/">Home</Link> | <Link to="/mails">Mails</Link> | <Link to="/bin">Bin</Link>
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
