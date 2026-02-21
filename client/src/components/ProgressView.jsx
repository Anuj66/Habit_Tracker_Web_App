import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getHabits, getTracking, getSuggestions, addSuggestion } from '../api';
import { Send, TrendingUp } from 'lucide-react';

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
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="text-blue-600 dark:text-blue-400" size={20} />
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white truncate">{habit.name}</h3>
      </div>

      <div className="h-48 w-full mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              allowDecimals={false} 
              domain={[0, 1]} 
              tickCount={2}
              hide
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: 'none', 
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px'
              }}
            />
            <Bar 
              dataKey="completed" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex-1 flex flex-col pt-6 border-t border-slate-100 dark:border-slate-700">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Improvement Suggestions</h4>
        
        <ul className="flex-1 space-y-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar">
          {habit.suggestions && habit.suggestions.length > 0 ? (
            habit.suggestions.map(s => (
              <li key={s.id} className="text-sm p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-slate-600 dark:text-slate-300">
                <div className="font-medium">{s.suggestion}</div>
                <div className="text-xs text-slate-400 mt-1">{new Date(s.created_at).toLocaleDateString()}</div>
              </li>
            ))
          ) : (
            <li className="text-sm text-slate-400 italic text-center py-2">No suggestions yet.</li>
          )}
        </ul>

        <form onSubmit={handleAddSuggestion} className="flex gap-2 mt-auto">
          <input 
            type="text" 
            value={newSuggestion} 
            onChange={(e) => setNewSuggestion(e.target.value)} 
            placeholder="Add a note..."
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
          />
          <button 
            type="submit" 
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            aria-label="Add suggestion"
          >
            <Send size={16} />
          </button>
        </form>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Progress & Improvements</h2>
        <p className="text-slate-500 dark:text-slate-400">Track your completion rates and notes over time</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.map(habit => (
          <HabitProgressCard key={habit.id} habit={habit} refreshData={fetchData} />
        ))}
      </div>
      
      {habits.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">No habits to show progress for. Add some habits first!</p>
        </div>
      )}
    </div>
  );
};

export default ProgressView;
