import React, { useState, useEffect } from 'react';
import { getHabits, createHabit, deleteHabit, getTracking, updateTracking } from '../api';

const HabitList = () => {
  const [habits, setHabits] = useState([]);
  const [completedHabits, setCompletedHabits] = useState({});
  const [newHabit, setNewHabit] = useState({ name: '', description: '', frequency: 'daily' });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const response = await getHabits();
      setHabits(response.data);
      // Fetch tracking for each habit for today
      const trackingStatus = {};
      for (const habit of response.data) {
        const trackRes = await getTracking(habit.id);
        const todayEntry = trackRes.data.find(t => t.date === today);
        if (todayEntry && todayEntry.completed) {
          trackingStatus[habit.id] = true;
        }
      }
      setCompletedHabits(trackingStatus);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabit.name) return;
    try {
      await createHabit(newHabit);
      setNewHabit({ name: '', description: '', frequency: 'daily' });
      fetchHabits();
    } catch (error) {
      console.error('Error adding habit:', error);
    }
  };

  const handleDeleteHabit = async (id) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      try {
        await deleteHabit(id);
        fetchHabits();
      } catch (error) {
        console.error('Error deleting habit:', error);
      }
    }
  };

  const toggleHabit = async (id) => {
    const isCompleted = !completedHabits[id];
    try {
      await updateTracking(id, today, isCompleted);
      setCompletedHabits(prev => ({ ...prev, [id]: isCompleted }));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div>
      <h2>Today's Habits ({today})</h2>
      
      <div className="add-habit-form">
        <h3>Add New Habit</h3>
        <form onSubmit={handleAddHabit}>
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              value={newHabit.name} 
              onChange={e => setNewHabit({...newHabit, name: e.target.value})}
              placeholder="e.g., Drink Water"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input 
              type="text" 
              value={newHabit.description} 
              onChange={e => setNewHabit({...newHabit, description: e.target.value})}
              placeholder="Optional description"
            />
          </div>
          <button type="submit" className="btn btn-primary">Add Habit</button>
        </form>
      </div>

      <div className="habit-list">
        {habits.map(habit => (
          <div key={habit.id} className="habit-card">
            <div className="habit-info">
              <h3>{habit.name}</h3>
              <p>{habit.description}</p>
              <span style={{fontSize: '0.8rem', color: '#888'}}>{habit.frequency}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <input 
                type="checkbox" 
                className="tracking-checkbox"
                checked={!!completedHabits[habit.id]}
                onChange={() => toggleHabit(habit.id)}
              />
              <button 
                className="btn btn-danger" 
                style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                onClick={() => handleDeleteHabit(habit.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {habits.length === 0 && <p>No habits yet. Add one above!</p>}
      </div>
    </div>
  );
};

export default HabitList;
