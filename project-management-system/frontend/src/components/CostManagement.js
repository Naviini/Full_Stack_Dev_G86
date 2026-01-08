import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import '../styles/CostManagement.css';

const CostManagement = ({ projectId }) => {
  const [costs, setCosts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    budgetCategory: 'personnel',
    description: '',
    estimatedCost: '',
    actualCost: '',
    status: 'planned',
    notes: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCosts();
  }, [projectId]);

  const fetchCosts = async () => {
    try {
      const response = await api.get(`/cost/project/${projectId}`);
      setCosts(response.data.costs);
      setSummary(response.data.summary);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching costs:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Cost') ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/cost/${editingId}`, { ...formData, project: projectId });
      } else {
        await api.post('/cost', { ...formData, project: projectId });
      }
      setFormData({
        budgetCategory: 'personnel',
        description: '',
        estimatedCost: '',
        actualCost: '',
        status: 'planned',
        notes: '',
      });
      setEditingId(null);
      setShowForm(false);
      fetchCosts();
    } catch (error) {
      console.error('Error saving cost:', error);
    }
  };

  const handleEdit = (cost) => {
    setFormData({
      budgetCategory: cost.budgetCategory,
      description: cost.description,
      estimatedCost: cost.estimatedCost,
      actualCost: cost.actualCost,
      status: cost.status,
      notes: cost.notes,
    });
    setEditingId(cost._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this cost item?')) {
      try {
        await api.delete(`/cost/${id}`);
        fetchCosts();
      } catch (error) {
        console.error('Error deleting cost:', error);
      }
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/cost/${id}/approve`);
      fetchCosts();
    } catch (error) {
      console.error('Error approving cost:', error);
    }
  };

  if (loading) return <div>Loading cost management...</div>;

  const getVarianceClass = (variance) => {
    if (variance < 0) return 'favorable';
    if (variance > 0) return 'unfavorable';
    return 'neutral';
  };

  return (
    <div className="cost-management">
      <div className="cost-header">
        <h2>💰 Cost Management</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Cost Item'}
        </button>
      </div>

      {summary && (
        <div className="cost-summary">
          <div className="summary-card">
            <h4>Estimated Budget</h4>
            <p className="amount">${summary.estimatedTotal.toFixed(2)}</p>
          </div>
          <div className="summary-card">
            <h4>Actual Spending</h4>
            <p className="amount">${summary.actualTotal.toFixed(2)}</p>
          </div>
          <div className={`summary-card ${getVarianceClass(summary.varianceTotal)}`}>
            <h4>Variance</h4>
            <p className="amount">${summary.varianceTotal.toFixed(2)}</p>
            <p className="percentage">{summary.variancePercentage}%</p>
          </div>
        </div>
      )}

      {showForm && (
        <form className="cost-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category</label>
            <select name="budgetCategory" value={formData.budgetCategory} onChange={handleInputChange}>
              <option value="personnel">Personnel</option>
              <option value="equipment">Equipment</option>
              <option value="materials">Materials</option>
              <option value="software">Software</option>
              <option value="services">Services</option>
              <option value="contingency">Contingency</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter cost description"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Estimated Cost ($)</label>
              <input
                type="number"
                name="estimatedCost"
                value={formData.estimatedCost}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label>Actual Cost ($)</label>
              <input
                type="number"
                name="actualCost"
                value={formData.actualCost}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange}>
              <option value="planned">Planned</option>
              <option value="approved">Approved</option>
              <option value="committed">Committed</option>
              <option value="spent">Spent</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Additional notes"
              rows="3"
            />
          </div>

          <button type="submit" className="btn-primary">
            {editingId ? 'Update Cost Item' : 'Add Cost Item'}
          </button>
        </form>
      )}

      <div className="costs-list">
        <table className="costs-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
              <th>Estimated</th>
              <th>Actual</th>
              <th>Variance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {costs.map(cost => (
              <tr key={cost._id}>
                <td><span className="category-badge">{cost.budgetCategory}</span></td>
                <td>{cost.description}</td>
                <td>${cost.estimatedCost.toFixed(2)}</td>
                <td>${cost.actualCost.toFixed(2)}</td>
                <td className={getVarianceClass(cost.variance)}>
                  ${cost.variance.toFixed(2)}
                </td>
                <td><span className={`status-badge ${cost.status}`}>{cost.status}</span></td>
                <td className="actions">
                  {cost.status === 'planned' && (
                    <button
                      className="btn-sm btn-approve"
                      onClick={() => handleApprove(cost._id)}
                      title="Approve"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    className="btn-sm btn-edit"
                    onClick={() => handleEdit(cost)}
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    className="btn-sm btn-delete"
                    onClick={() => handleDelete(cost._id)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CostManagement;
