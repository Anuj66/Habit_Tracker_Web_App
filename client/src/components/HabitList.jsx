import React, { useState, useEffect } from 'react';
import { getHabits, createHabit, deleteHabit, getTracking, updateTracking } from '../api';
import { Plus, Trash2, CheckCircle, Circle } from 'lucide-react';

const HabitList = () => {
  const [habits, setHabits] = useState([]);
  const [completedHabits, setCompletedHabits] = useState({});
  const [newHabit, setNewHabit] = useState({ name: '', description: '', frequency: 'daily' });

  const today = new Date().toISOString().split('T')[0];

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

  useEffect(() => {
    fetchHabits();
  }, []);

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
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Today's Habits</h2>
        <p className="text-slate-500 dark:text-slate-400">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Add New Habit</h3>
        <form onSubmit={handleAddHabit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
              <input 
                type="text" 
                value={newHabit.name} 
                onChange={e => setNewHabit({...newHabit, name: e.target.value})}
                placeholder="e.g., Drink Water"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <input 
                type="text" 
                value={newHabit.description} 
                onChange={e => setNewHabit({...newHabit, description: e.target.value})}
                placeholder="Optional description"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              />
            </div>
          </div>
          <button 
            type="submit" 
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors ml-auto"
          >
            <Plus size={20} />
            Add Habit
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {habits.map(habit => (
          <div 
            key={habit.id} 
            className={`group p-4 rounded-xl border transition-all duration-200 ${
              completedHabits[habit.id]
                ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleHabit(habit.id)}
                    className={`flex-shrink-0 transition-colors ${
                      completedHabits[habit.id] 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400'
                    }`}
                  >
                    {completedHabits[habit.id] ? (
                      <CheckCircle size={28} className="fill-current" />
                    ) : (
                      <Circle size={28} />
                    )}
                  </button>
                  <div>
                    <h3 className={`font-semibold text-lg truncate ${
                      completedHabits[habit.id]
                        ? 'text-slate-500 dark:text-slate-500 line-through'
                        : 'text-slate-800 dark:text-white'
                    }`}>
                      {habit.name}
                    </h3>
                    {habit.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {habit.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize">
                  {habit.frequency}
                </span>
                <button 
                  onClick={() => handleDeleteHabit(habit.id)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Delete habit"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {habits.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">No habits yet. Add one above to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitList;
