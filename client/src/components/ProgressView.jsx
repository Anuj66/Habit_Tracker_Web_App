import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getHabits, getTracking, getSuggestions, addSuggestion } from '../api';

const HabitProgressCard = ({ habit, refreshData }) => {
  const [newSuggestion, setNewSuggestion] = useState('');

  // Process data for last 7 days
  const getLast7Days = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const trackingEntry = habit.tracking ? habit.tracking.find(t => t.date === dateStr) : null;
      
      data.push({
        date: dateStr,
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: trackingEntry && trackingEntry.completed ? 1 : 0
      });
    }
    return data;
  };

  const data = getLast7Days();

  const handleAddSuggestion = async (e) => {
    e.preventDefault();
    if (!newSuggestion.trim()) return;
    try {
      await addSuggestion(habit.id, newSuggestion);
      setNewSuggestion('');
      if (refreshData) refreshData(); 
    } catch (error) {
      console.error("Error adding suggestion:", error);
    }
  };

  return (
    <div className="chart-container">
      <h3>{habit.name}</h3>
      <div style={{ height: '200px', width: '100%', marginBottom: '20px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis allowDecimals={false} domain={[0, 1]} tickCount={2} />
            <Tooltip />
            <Bar dataKey="completed" fill="#8884d8" name="Completed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="suggestion-box">
        <h4>Improvement Suggestions</h4>
        <form onSubmit={handleAddSuggestion} style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
          <input 
            type="text" 
            value={newSuggestion} 
            onChange={(e) => setNewSuggestion(e.target.value)} 
            placeholder="Add a note/suggestion..."
            style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '8px 15px' }}>Add</button>
        </form>
        
        <ul className="suggestion-list">
          {habit.suggestions && habit.suggestions.length > 0 ? (
            habit.suggestions.map(s => (
              <li key={s.id} className="suggestion-item">
                <div style={{fontWeight: 500}}>{s.suggestion}</div>
                <div style={{fontSize: '0.7em', color: '#aaa'}}>{new Date(s.created_at).toLocaleDateString()}</div>
              </li>
            ))
          ) : (
            <li style={{ color: '#aaa', fontStyle: 'italic', padding: '5px' }}>No suggestions yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

const ProgressView = () => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const habitsRes = await getHabits();
      const habitsData = habitsRes.data;
      
      const enrichedHabits = await Promise.all(habitsData.map(async (habit) => {
        const trackingRes = await getTracking(habit.id);
        const suggestionsRes = await getSuggestions(habit.id);
        return {
          ...habit,
          tracking: trackingRes.data,
          suggestions: suggestionsRes.data
        };
      }));
      
      setHabits(enrichedHabits);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching progress data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div style={{padding: '20px'}}>Loading progress...</div>;

  return (
    <div className="progress-container">
      <h2>Progress & Improvements</h2>
      <div className="progress-grid">
        {habits.map(habit => (
          <HabitProgressCard key={habit.id} habit={habit} refreshData={fetchData} />
        ))}
      </div>
      {habits.length === 0 && <p>No habits to show progress for. Add some habits first!</p>}
    </div>
  );
};

export default ProgressView;
