import React from 'react';
import './scss/app.scss';
import Navbar from './components/Navbar';
import Home from './components/Main/Home';
import Developer from './components/Main/Developer';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

function App() {
  return (
    <Router>
      <div className="app">
        <div className="app__navbar">
          <Navbar />
        </div>
        <ToastContainer />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/developer" element={<Developer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
