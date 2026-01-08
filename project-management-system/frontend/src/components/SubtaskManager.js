import React, { useState } from 'react';
import axios from 'axios';

export default function SubtaskManager({ taskId, subtasks = [], onSubtaskAdded, onSubtaskUpdated }) {
  const [showForm, setShowForm] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/tasks/${taskId}/subtasks`, {
        title: newSubtask,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewSubtask('');
      setShowForm(false);
      if (onSubtaskAdded) onSubtaskAdded();
    } catch (err) {
      console.error('Failed to add subtask:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubtask = async (subtaskId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        completed: !currentStatus,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (onSubtaskUpdated) onSubtaskUpdated();
    } catch (err) {
      console.error('Failed to update subtask:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Subtasks</h3>
      
      {subtasks && subtasks.length > 0 ? (
        <div className="space-y-2 mb-4">
          {subtasks.map((subtask) => (
            <div key={subtask._id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <input
                type="checkbox"
                checked={subtask.completed}
                onChange={() => handleToggleSubtask(subtask._id, subtask.completed)}
                className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
              />
              <span className={`ml-3 flex-1 ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {subtask.title}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(subtask.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm mb-4">No subtasks yet</p>
      )}

      {showForm ? (
        <form onSubmit={handleAddSubtask} className="flex gap-2">
          <input
            type="text"
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            placeholder="Add a new subtask..."
            required
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-600 hover:text-indigo-600 transition font-semibold"
        >
          + Add Subtask
        </button>
      )}
    </div>
  );
}
