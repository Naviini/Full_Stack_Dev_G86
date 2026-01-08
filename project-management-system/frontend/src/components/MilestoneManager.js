import React, { useState } from 'react';
import axios from 'axios';

export default function MilestoneManager({ projectId, milestones = [], onMilestoneAdded, onMilestoneUpdated }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
  });
  const [loading, setLoading] = useState(false);

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/milestones/${projectId}/milestones`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFormData({ title: '', description: '', dueDate: '' });
      setShowForm(false);
      if (onMilestoneAdded) onMilestoneAdded();
    } catch (err) {
      console.error('Failed to add milestone:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMilestone = async (milestoneId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/milestones/${projectId}/milestones/${milestoneId}`, {
        completed: !currentStatus,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (onMilestoneUpdated) onMilestoneUpdated();
    } catch (err) {
      console.error('Failed to update milestone:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Milestones</h3>
      
      {milestones && milestones.length > 0 ? (
        <div className="space-y-3 mb-4">
          {milestones.map((milestone) => (
            <div key={milestone._id} className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <input
                type="checkbox"
                checked={milestone.completed}
                onChange={() => handleToggleMilestone(milestone._id, milestone.completed)}
                className="w-5 h-5 text-indigo-600 rounded cursor-pointer mt-1"
              />
              <div className="ml-4 flex-1">
                <h4 className={`font-semibold ${milestone.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {milestone.title}
                </h4>
                {milestone.description && (
                  <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                )}
                {milestone.dueDate && (
                  <p className="text-xs text-gray-500 mt-2">
                    Due: {new Date(milestone.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              {milestone.completed && (
                <span className="ml-2 text-green-600 font-semibold">✓</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm mb-4">No milestones yet</p>
      )}

      {showForm ? (
        <form onSubmit={handleAddMilestone} className="space-y-3 bg-gray-50 p-4 rounded-lg">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Milestone title"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            rows="2"
          />
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 text-sm"
            >
              {loading ? 'Adding...' : 'Add Milestone'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-600 hover:text-indigo-600 transition font-semibold text-sm"
        >
          + Add Milestone
        </button>
      )}
    </div>
  );
}
