import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HabitList from './components/HabitList';
import ProgressView from './components/ProgressView';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HabitList />} />
          <Route path="progress" element={<ProgressView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
