import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="app-container">
      <div className="sidebar">
        <h1>Habit Tracker</h1>
        <nav>
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            end
          >
            Daily Tracker
          </NavLink>
          <NavLink 
            to="/progress" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            Progress & Suggestions
          </NavLink>
        </nav>
      </div>
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
