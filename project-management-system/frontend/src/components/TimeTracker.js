import React, { useState } from 'react';
import axios from 'axios';

export default function TimeTracker({ taskId, onLogAdded }) {
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/tasks/${taskId}/time-logs`, {
        hours: parseFloat(hours),
        description,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHours('');
      setDescription('');
      if (onLogAdded) onLogAdded();
    } catch (err) {
      console.error('Failed to log hours:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Log Time</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hours</label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., 2.5"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="What did you work on?"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-semibold py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? 'Logging...' : 'Log Hours'}
      </button>
    </form>
  );
}
