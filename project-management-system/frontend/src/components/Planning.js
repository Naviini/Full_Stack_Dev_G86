import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import '../styles/Planning.css';

const Planning = ({ projectId }) => {
  const [plans, setPlans] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    type: 'project-charter',
    description: '',
    status: 'draft',
    objectives: [],
    scope: { inclusions: [], exclusions: [], constraints: [], assumptions: [] },
    risks: [],
  });
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, [projectId, filterType]);

  const fetchPlans = async () => {
    try {
      const url = filterType === 'all'
        ? `/planning/project/${projectId}`
        : `/planning/project/${projectId}?type=${filterType}`;
      const response = await api.get(url);
      setPlans(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/planning/${editingId}`, { ...formData, project: projectId });
      } else {
        await api.post('/planning', { ...formData, project: projectId });
      }

      setFormData({
        name: '',
        type: 'project-charter',
        description: '',
        status: 'draft',
        objectives: [],
        scope: { inclusions: [], exclusions: [], constraints: [], assumptions: [] },
        risks: [],
      });
      setEditingId(null);
      setShowForm(false);
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };

  const handleEdit = (plan) => {
    setFormData({
      name: plan.name,
      type: plan.type,
      description: plan.description,
      status: plan.status,
      objectives: plan.objectives || [],
      scope: plan.scope || { inclusions: [], exclusions: [], constraints: [], assumptions: [] },
      risks: plan.risks || [],
    });
    setEditingId(plan._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await api.delete(`/planning/${id}`);
        fetchPlans();
      } catch (error) {
        console.error('Error deleting plan:', error);
      }
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/planning/${id}/approve`);
      fetchPlans();
    } catch (error) {
      console.error('Error approving plan:', error);
    }
  };

  const handleUpdateLifecycle = async (id, phase) => {
    try {
      await api.patch(`/planning/${id}/lifecycle/${phase}`, {
        notes: `${phase} phase completed`,
      });
      fetchPlans();
    } catch (error) {
      console.error('Error updating lifecycle:', error);
    }
  };

  if (loading) return <div>Loading planning documents...</div>;

  const planTypes = {
    'project-charter': 'Project Charter',
    'scope-statement': 'Scope Statement',
    'schedule-baseline': 'Schedule Baseline',
    'budget-baseline': 'Budget Baseline',
    'quality-plan': 'Quality Plan',
    'risk-register': 'Risk Register',
    'communication-plan': 'Communication Plan',
    'stakeholder-analysis': 'Stakeholder Analysis',
    'resource-plan': 'Resource Plan',
    'change-management-plan': 'Change Management Plan',
  };

  const lifecyclePhases = ['initiation', 'planning', 'execution', 'monitoring', 'closure'];

  return (
    <div className="planning">
      <div className="planning-header">
        <h2>📋 Planning & Organization</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Plan'}
        </button>
      </div>

      <div className="planning-filters">
        <button
          className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
        >
          All
        </button>
        {Object.entries(planTypes).map(([key]) => (
          <button
            key={key}
            className={`filter-btn ${filterType === key ? 'active' : ''}`}
            onClick={() => setFilterType(key)}
          >
            {planTypes[key]}
          </button>
        ))}
      </div>

      {showForm && (
        <form className="planning-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Plan Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter plan name"
              required
            />
          </div>

          <div className="form-group">
            <label>Plan Type</label>
            <select name="type" value={formData.type} onChange={handleInputChange}>
              {Object.entries(planTypes).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the plan"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange}>
              <option value="draft">Draft</option>
              <option value="in-review">In Review</option>
              <option value="approved">Approved</option>
              <option value="implemented">Implemented</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <button type="submit" className="btn-primary">
            {editingId ? 'Update Plan' : 'Create Plan'}
          </button>
        </form>
      )}

      <div className="plans-list">
        {plans.map(plan => (
          <div key={plan._id} className={`plan-card ${plan.status}`}>
            <div
              className="card-header-clickable"
              onClick={() => setExpandedId(expandedId === plan._id ? null : plan._id)}
            >
              <div className="plan-title">
                <h4>{plan.name}</h4>
                <span className="plan-type">{planTypes[plan.type]}</span>
                <span className={`status-badge ${plan.status}`}>{plan.status}</span>
              </div>
              <div className="expand-icon">
                {expandedId === plan._id ? '▼' : '▶'}
              </div>
            </div>

            {expandedId === plan._id && (
              <div className="card-content">
                {plan.description && (
                  <div className="section">
                    <h5>Description</h5>
                    <p>{plan.description}</p>
                  </div>
                )}

                <div className="section">
                  <h5>Project Lifecycle</h5>
                  <div className="lifecycle">
                    {lifecyclePhases.map(phase => (
                      <div key={phase} className="lifecycle-phase">
                        <button
                          className={`phase-btn ${plan.lifecycle?.[phase]?.completed ? 'completed' : ''}`}
                          onClick={() => handleUpdateLifecycle(plan._id, phase)}
                          title={`Mark ${phase} as complete`}
                        >
                          {plan.lifecycle?.[phase]?.completed ? '✓' : '○'}
                          <span>{phase}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {plan.objectives && plan.objectives.length > 0 && (
                  <div className="section">
                    <h5>Objectives</h5>
                    <ul>
                      {plan.objectives.map((obj, idx) => (
                        <li key={idx}>{obj.goal}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.scope && (
                  <div className="section">
                    <h5>Scope</h5>
                    {plan.scope.inclusions?.length > 0 && (
                      <div className="scope-item">
                        <strong>Inclusions:</strong>
                        <ul>
                          {plan.scope.inclusions.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {plan.scope.exclusions?.length > 0 && (
                      <div className="scope-item">
                        <strong>Exclusions:</strong>
                        <ul>
                          {plan.scope.exclusions.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {plan.risks && plan.risks.length > 0 && (
                  <div className="section">
                    <h5>Risks</h5>
                    <ul>
                      {plan.risks.map((risk, idx) => (
                        <li key={idx}>
                          <strong>{risk.description}</strong> - {risk.probability} probability, {risk.impact} impact
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="card-actions">
              {plan.status === 'draft' || plan.status === 'in-review' ? (
                <button
                  className="btn-sm btn-approve"
                  onClick={() => handleApprove(plan._id)}
                >
                  Approve
                </button>
              ) : null}
              <button
                className="btn-sm btn-edit"
                onClick={() => handleEdit(plan)}
              >
                Edit
              </button>
              <button
                className="btn-sm btn-delete"
                onClick={() => handleDelete(plan._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Planning;
