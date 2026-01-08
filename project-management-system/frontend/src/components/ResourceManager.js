import React, { useState, useEffect } from 'react';
import '../styles/ResourceManager.css';

const ResourceManager = ({ projectId }) => {
  const [resources, setResources] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [utilization, setUtilization] = useState(null);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    type: 'human',
    category: '',
    quantity: 1,
    unit: 'units',
    costPerUnit: 0,
    role: '',
    skills: [],
    hoursPerWeek: 40,
  });

  useEffect(() => {
    fetchResources();
    fetchUtilization();
  }, [projectId, filter]);

  const fetchResources = async () => {
    try {
      let url = `/api/resources/project/${projectId}`;
      if (filter !== 'all') {
        url += `?type=${filter}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      setResources(data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const fetchUtilization = async () => {
    try {
      const response = await fetch(`/api/resources/project/${projectId}/utilization`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      setUtilization(data);
    } catch (error) {
      console.error('Error fetching utilization:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = selectedResource ? `/api/resources/${selectedResource._id}` : '/api/resources';
      const method = selectedResource ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ project: projectId, ...formData }),
      });

      if (response.ok) {
        fetchResources();
        fetchUtilization();
        setShowForm(false);
        setSelectedResource(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving resource:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'human',
      category: '',
      quantity: 1,
      unit: 'units',
      costPerUnit: 0,
      role: '',
      skills: [],
      hoursPerWeek: 40,
    });
  };

  const handleEdit = (resource) => {
    setSelectedResource(resource);
    setFormData({
      name: resource.name,
      type: resource.type,
      category: resource.category,
      quantity: resource.quantity,
      unit: resource.unit,
      costPerUnit: resource.costPerUnit,
      role: resource.role,
      skills: resource.skills,
      hoursPerWeek: resource.hoursPerWeek,
    });
    setShowForm(true);
  };

  const handleDelete = async (resourceId) => {
    if (window.confirm('Are you sure?')) {
      try {
        const response = await fetch(`/api/resources/${resourceId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (response.ok) {
          fetchResources();
          fetchUtilization();
        }
      } catch (error) {
        console.error('Error deleting resource:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: '#4CAF50',
      allocated: '#2196F3',
      'in-use': '#FF9800',
      unavailable: '#D32F2F',
      retired: '#999',
    };
    return colors[status] || '#999';
  };

  return (
    <div className="resource-manager">
      <div className="resource-header">
        <h2>Resource Management</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Add Resource
        </button>
      </div>

      {/* Utilization Overview */}
      {utilization && (
        <div className="utilization-overview">
          <div className="util-card">
            <h4>Total Resources</h4>
            <p className="util-value">{utilization.total}</p>
          </div>
          <div className="util-card">
            <h4>Utilization Rate</h4>
            <p className="util-value">{utilization.utilizationRate}%</p>
          </div>
          <div className="util-card">
            <h4>Total Cost</h4>
            <p className="util-value">${utilization.totalCost.toLocaleString()}</p>
          </div>
          <div className="util-card">
            <h4>Allocated Cost</h4>
            <p className="util-value">${utilization.allocatedCost.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="resource-filter">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Resources</option>
          <option value="human">Human Resources</option>
          <option value="equipment">Equipment</option>
          <option value="material">Materials</option>
          <option value="software">Software</option>
          <option value="facility">Facilities</option>
          <option value="budget">Budget</option>
        </select>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="resource-form">
          <h3>{selectedResource ? 'Edit Resource' : 'Add New Resource'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Resource Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="human">Human</option>
                  <option value="equipment">Equipment</option>
                  <option value="material">Material</option>
                  <option value="software">Software</option>
                  <option value="facility">Facility</option>
                  <option value="budget">Budget</option>
                </select>
              </div>

              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>

            {formData.type === 'human' && (
              <>
                <div className="form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.skills.join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        skills: e.target.value.split(',').map((s) => s.trim()),
                      })
                    }
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Hours Per Week</label>
                    <input
                      type="number"
                      value={formData.hoursPerWeek}
                      onChange={(e) =>
                        setFormData({ ...formData, hoursPerWeek: parseInt(e.target.value) })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Cost Per Hour</label>
                    <input
                      type="number"
                      value={formData.costPerUnit}
                      onChange={(e) =>
                        setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {formData.type !== 'human' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: parseInt(e.target.value) })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Unit</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Cost Per Unit</label>
                  <input
                    type="number"
                    value={formData.costPerUnit}
                    onChange={(e) =>
                      setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-success">
                {selectedResource ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setSelectedResource(null);
                  resetForm();
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resources List */}
      <div className="resources-list">
        {resources.length === 0 ? (
          <p className="empty-state">No resources found.</p>
        ) : (
          <table className="resources-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Allocation</th>
                <th>Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource._id}>
                  <td>{resource.name}</td>
                  <td>{resource.type}</td>
                  <td>
                    {resource.quantity} {resource.unit}
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(resource.status) }}
                    >
                      {resource.status}
                    </span>
                  </td>
                  <td>
                    <div className="allocation-bar">
                      <div
                        className="allocation-fill"
                        style={{ width: `${resource.allocationPercentage}%` }}
                      />
                    </div>
                    {resource.allocationPercentage}%
                  </td>
                  <td>${resource.totalCost.toLocaleString()}</td>
                  <td>
                    <button
                      className="btn-small"
                      onClick={() => handleEdit(resource)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-small btn-danger"
                      onClick={() => handleDelete(resource._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ResourceManager;
