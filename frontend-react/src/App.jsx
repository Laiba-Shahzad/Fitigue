import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import './index.css';
import './App.css';
import ClothingRequests from './pages/ClothingRequests';
import TradeHistory from './pages/TradeHistory';
import Notifications from './pages/Notifications';
import Ratings from './pages/Ratings';
import { getUnreadCount } from './api';

function Nav() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    getUnreadCount()
      .then(d => setUnread(d.unread_count || 0))
      .catch(() => {});
    const id = setInterval(() => {
      getUnreadCount().then(d => setUnread(d.unread_count || 0)).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <nav className="nav">
      <NavLink to="/" className="nav-logo">Fitigue</NavLink>
      <div className="nav-tabs">
        <NavLink to="/"             end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Requests</NavLink>
        <NavLink to="/history"          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>History</NavLink>
        <NavLink to="/notifications"    className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          NOtifications {unread > 0 && <span className="badge">{unread}</span>}
        </NavLink>
        <NavLink to="/ratings"          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Rate</NavLink>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/"             element={<ClothingRequests />} />
        <Route path="/history"      element={<TradeHistory />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/ratings"      element={<Ratings />} />
      </Routes>
    </BrowserRouter>
  );
}