import React, { useState, useEffect } from 'react';
import '../styles/GoalManager.css';

const GoalManager = ({ projectId, onGoalsUpdate }) => {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'strategic',
    priority: 'medium',
    startDate: '',
    dueDate: '',
    targetValue: '',
    unit: '',
  });

  useEffect(() => {
    fetchGoals();
  }, [projectId]);

  const fetchGoals = async () => {
    try {
      const response = await fetch(`/api/goals/project/${projectId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      setGoals(data);
      if (onGoalsUpdate) onGoalsUpdate(data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = selectedGoal ? `/api/goals/${selectedGoal._id}` : '/api/goals';
      const method = selectedGoal ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ project: projectId, ...formData }),
      });

      if (response.ok) {
        fetchGoals();
        setShowForm(false);
        setSelectedGoal(null);
        setFormData({
          title: '',
          description: '',
          type: 'strategic',
          priority: 'medium',
          startDate: '',
          dueDate: '',
          targetValue: '',
          unit: '',
        });
      }
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleDelete = async (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        const response = await fetch(`/api/goals/${goalId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (response.ok) {
          fetchGoals();
        }
      } catch (error) {
        console.error('Error deleting goal:', error);
      }
    }
  };

  const handleEdit = (goal) => {
    setSelectedGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description,
      type: goal.type,
      priority: goal.priority,
      startDate: goal.startDate?.split('T')[0] || '',
      dueDate: goal.dueDate?.split('T')[0] || '',
      targetValue: goal.targetValue,
      unit: goal.unit,
    });
    setShowForm(true);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#4CAF50',
      medium: '#FFC107',
      high: '#FF5722',
      critical: '#D32F2F',
    };
    return colors[priority] || '#999';
  };

  const getStatusBadge = (status) => {
    const colors = {
      'not-started': '#e0e0e0',
      'in-progress': '#2196F3',
      'completed': '#4CAF50',
      'on-hold': '#FF9800',
      'cancelled': '#D32F2F',
    };
    return colors[status] || '#999';
  };

  return (
    <div className="goal-manager">
      <div className="goal-header">
        <h2>Project Goals</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Add Goal
        </button>
      </div>

      {showForm && (
        <div className="goal-form">
          <h3>{selectedGoal ? 'Edit Goal' : 'Create New Goal'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Goal Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="strategic">Strategic</option>
                  <option value="operational">Operational</option>
                  <option value="milestone-based">Milestone-based</option>
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Due Date *</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Target Value</label>
                <input
                  type="text"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  placeholder="e.g., 95% customer satisfaction"
                />
              </div>

              <div className="form-group">
                <label>Unit</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., %, Users, Days"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-success">
                {selectedGoal ? 'Update Goal' : 'Create Goal'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setSelectedGoal(null);
                  setFormData({
                    title: '',
                    description: '',
                    type: 'strategic',
                    priority: 'medium',
                    startDate: '',
                    dueDate: '',
                    targetValue: '',
                    unit: '',
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="goals-list">
        {goals.length === 0 ? (
          <p className="empty-state">No goals defined yet. Create one to get started.</p>
        ) : (
          goals.map((goal) => (
            <div key={goal._id} className="goal-card">
              <div className="goal-card-header">
                <h4>{goal.title}</h4>
                <span
                  className="priority-badge"
                  style={{ backgroundColor: getPriorityColor(goal.priority) }}
                >
                  {goal.priority}
                </span>
              </div>

              <p className="goal-description">{goal.description}</p>

              <div className="goal-meta">
                <div className="meta-item">
                  <span className="label">Type:</span>
                  <span className="value">{goal.type}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Target:</span>
                  <span className="value">
                    {goal.targetValue} {goal.unit}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="label">Status:</span>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusBadge(goal.status) } }
                  >
                    {goal.status}
                  </span>
                </div>
              </div>

              <div className="goal-dates">
                <small>
                  {new Date(goal.startDate).toLocaleDateString()} -
                  {new Date(goal.dueDate).toLocaleDateString()}
                </small>
              </div>

              <div className="goal-actions">
                <button className="btn-small" onClick={() => handleEdit(goal)}>
                  Edit
                </button>
                <button
                  className="btn-small btn-danger"
                  onClick={() => handleDelete(goal._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GoalManager;
