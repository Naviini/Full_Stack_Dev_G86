import React, { useState, useEffect } from 'react';
import '../styles/ScopeManager.css';

const ScopeManager = ({ projectId }) => {
  const [scope, setScope] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [formData, setFormData] = useState({
    scopeStatement: '',
  });

  useEffect(() => {
    fetchScope();
  }, [projectId]);

  const fetchScope = async () => {
    try {
      const response = await fetch(`/api/scope/project/${projectId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.status === 404) {
        // Create initial scope if it doesn't exist
        createScope();
      } else {
        const data = await response.json();
        setScope(data);
        setFormData({ scopeStatement: data.scopeStatement });
      }
    } catch (error) {
      console.error('Error fetching scope:', error);
    }
  };

  const createScope = async () => {
    try {
      const response = await fetch('/api/scope', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ project: projectId }),
      });

      const data = await response.json();
      setScope(data);
      setFormData({ scopeStatement: data.scopeStatement });
    } catch (error) {
      console.error('Error creating scope:', error);
    }
  };

  const handleScopeUpdate = async () => {
    try {
      const response = await fetch(`/api/scope/${scope._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setScope(data);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating scope:', error);
    }
  };

  const addDeliverable = async (e) => {
    e.preventDefault();
    const form = e.target;
    const title = form.title.value;
    const description = form.description.value;
    const dueDate = form.dueDate.value;

    try {
      const response = await fetch(`/api/scope/${scope._id}/deliverables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ title, description, dueDate }),
      });

      const data = await response.json();
      setScope(data);
      form.reset();
    } catch (error) {
      console.error('Error adding deliverable:', error);
    }
  };

  const addRequirement = async (e) => {
    e.preventDefault();
    const form = e.target;

    try {
      const response = await fetch(`/api/scope/${scope._id}/requirements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: form.title.value,
          description: form.description.value,
          type: form.type.value,
          priority: form.priority.value,
        }),
      });

      const data = await response.json();
      setScope(data);
      form.reset();
    } catch (error) {
      console.error('Error adding requirement:', error);
    }
  };

  const addConstraint = async (e) => {
    e.preventDefault();
    const form = e.target;

    try {
      const response = await fetch(`/api/scope/${scope._id}/constraints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: form.title.value,
          description: form.description.value,
          type: form.type.value,
          impact: form.impact.value,
          mitigation: form.mitigation.value,
        }),
      });

      const data = await response.json();
      setScope(data);
      form.reset();
    } catch (error) {
      console.error('Error adding constraint:', error);
    }
  };

  const addAssumption = async (e) => {
    e.preventDefault();
    const form = e.target;

    try {
      const response = await fetch(`/api/scope/${scope._id}/assumptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ statement: form.statement.value }),
      });

      const data = await response.json();
      setScope(data);
      form.reset();
    } catch (error) {
      console.error('Error adding assumption:', error);
    }
  };

  if (!scope) {
    return <div className="loading">Loading scope...</div>;
  }

  return (
    <div className="scope-manager">
      <div className="scope-header">
        <h2>Project Scope Management</h2>
        {!editMode && (
          <button className="btn-primary" onClick={() => setEditMode(true)}>
            Edit Scope
          </button>
        )}
      </div>

      {/* Scope Statement */}
      <div className="scope-statement-section">
        {editMode ? (
          <div className="scope-form">
            <label>Scope Statement</label>
            <textarea
              value={formData.scopeStatement}
              onChange={(e) =>
                setFormData({ ...formData, scopeStatement: e.target.value })
              }
              rows="5"
              placeholder="Define the overall scope and objectives..."
            />
            <div className="form-actions">
              <button className="btn-success" onClick={handleScopeUpdate}>
                Save
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setEditMode(false);
                  setFormData({ scopeStatement: scope.scopeStatement });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="scope-statement">
            {scope.scopeStatement ? (
              <p>{scope.scopeStatement}</p>
            ) : (
              <p className="empty">No scope statement defined. Click Edit to add one.</p>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="scope-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'deliverables' ? 'active' : ''}`}
          onClick={() => setActiveTab('deliverables')}
        >
          Deliverables ({scope.deliverables?.length || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'requirements' ? 'active' : ''}`}
          onClick={() => setActiveTab('requirements')}
        >
          Requirements ({scope.requirements?.length || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'constraints' ? 'active' : ''}`}
          onClick={() => setActiveTab('constraints')}
        >
          Constraints ({scope.constraints?.length || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'assumptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('assumptions')}
        >
          Assumptions ({scope.assumptions?.length || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'inclusions' ? 'active' : ''}`}
          onClick={() => setActiveTab('inclusions')}
        >
          Inclusions & Exclusions
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="info-grid">
              <div className="info-card">
                <h4>Total Deliverables</h4>
                <p className="big-number">{scope.deliverables?.length || 0}</p>
              </div>
              <div className="info-card">
                <h4>Requirements</h4>
                <p className="big-number">{scope.requirements?.length || 0}</p>
              </div>
              <div className="info-card">
                <h4>Constraints</h4>
                <p className="big-number">{scope.constraints?.length || 0}</p>
              </div>
              <div className="info-card">
                <h4>Assumptions</h4>
                <p className="big-number">{scope.assumptions?.length || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Deliverables Tab */}
        {activeTab === 'deliverables' && (
          <div className="deliverables-content">
            <form onSubmit={addDeliverable} className="add-form">
              <h4>Add Deliverable</h4>
              <div className="form-row">
                <input
                  type="text"
                  name="title"
                  placeholder="Deliverable title"
                  required
                />
                <input type="date" name="dueDate" />
              </div>
              <textarea
                name="description"
                placeholder="Description"
                rows="3"
              />
              <button type="submit" className="btn-small">
                Add Deliverable
              </button>
            </form>

            <div className="items-list">
              {scope.deliverables?.map((item) => (
                <div key={item._id} className="item-card">
                  <div className="item-header">
                    <h5>{item.title}</h5>
                    <span className="status-badge">{item.status}</span>
                  </div>
                  <p>{item.description}</p>
                  {item.dueDate && (
                    <small>Due: {new Date(item.dueDate).toLocaleDateString()}</small>
                  )}
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${item.completionPercentage}%` }}
                    />
                  </div>
                  <p className="progress-text">{item.completionPercentage}% complete</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requirements Tab */}
        {activeTab === 'requirements' && (
          <div className="requirements-content">
            <form onSubmit={addRequirement} className="add-form">
              <h4>Add Requirement</h4>
              <input
                type="text"
                name="title"
                placeholder="Requirement title"
                required
              />
              <textarea
                name="description"
                placeholder="Description"
                rows="3"
              />
              <div className="form-row">
                <select name="type">
                  <option value="functional">Functional</option>
                  <option value="non-functional">Non-functional</option>
                  <option value="technical">Technical</option>
                  <option value="business">Business</option>
                </select>
                <select name="priority">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <button type="submit" className="btn-small">
                Add Requirement
              </button>
            </form>

            <div className="items-list">
              {scope.requirements?.map((item) => (
                <div key={item._id} className="item-card">
                  <div className="item-header">
                    <h5>{item.title}</h5>
                    <div>
                      <span className="type-badge">{item.type}</span>
                      <span className="priority-badge">{item.priority}</span>
                    </div>
                  </div>
                  <p>{item.description}</p>
                  <span className="status-badge">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Constraints Tab */}
        {activeTab === 'constraints' && (
          <div className="constraints-content">
            <form onSubmit={addConstraint} className="add-form">
              <h4>Add Constraint</h4>
              <input
                type="text"
                name="title"
                placeholder="Constraint title"
                required
              />
              <textarea
                name="description"
                placeholder="Description"
                rows="3"
              />
              <div className="form-row">
                <select name="type">
                  <option value="schedule">Schedule</option>
                  <option value="budget">Budget</option>
                  <option value="resource">Resource</option>
                  <option value="technical">Technical</option>
                  <option value="organizational">Organizational</option>
                </select>
                <select name="impact">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <textarea
                name="mitigation"
                placeholder="Mitigation strategy"
                rows="3"
              />
              <button type="submit" className="btn-small">
                Add Constraint
              </button>
            </form>

            <div className="items-list">
              {scope.constraints?.map((item) => (
                <div key={item._id} className="item-card">
                  <div className="item-header">
                    <h5>{item.title}</h5>
                    <span className="impact-badge">{item.impact} Impact</span>
                  </div>
                  <p>{item.description}</p>
                  {item.mitigation && (
                    <div className="mitigation">
                      <strong>Mitigation:</strong> {item.mitigation}
                    </div>
                  )}
                  <small>Type: {item.type}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assumptions Tab */}
        {activeTab === 'assumptions' && (
          <div className="assumptions-content">
            <form onSubmit={addAssumption} className="add-form">
              <h4>Add Assumption</h4>
              <textarea
                name="statement"
                placeholder="State your assumption..."
                rows="3"
                required
              />
              <button type="submit" className="btn-small">
                Add Assumption
              </button>
            </form>

            <div className="items-list">
              {scope.assumptions?.map((item) => (
                <div key={item._id} className="item-card">
                  <p>{item.statement}</p>
                  <div className="assumption-footer">
                    <span className={`verified-badge ${item.verified ? 'verified' : ''}`}>
                      {item.verified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inclusions & Exclusions Tab */}
        {activeTab === 'inclusions' && (
          <div className="inclusions-content">
            <div className="two-column">
              <div className="column">
                <h4>Inclusions</h4>
                <div className="items-list">
                  {scope.inclusions?.map((item) => (
                    <div key={item._id} className="item-card">
                      <p>{item.item}</p>
                      <small>Priority: {item.priority}</small>
                    </div>
                  ))}
                </div>
              </div>
              <div className="column">
                <h4>Exclusions</h4>
                <div className="items-list">
                  {scope.exclusions?.map((item) => (
                    <div key={item._id} className="item-card">
                      <p>{item.item}</p>
                      {item.reason && <small>Reason: {item.reason}</small>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScopeManager;
