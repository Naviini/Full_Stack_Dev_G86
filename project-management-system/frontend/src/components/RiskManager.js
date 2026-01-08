import React, { useState } from 'react';
import axios from 'axios';

export default function RiskManager({ projectId, risks = [], onRiskAdded, onRiskUpdated }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    probability: 'medium',
    impact: 'medium',
    mitigation: '',
  });
  const [loading, setLoading] = useState(false);

  const handleAddRisk = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/milestones/${projectId}/risks`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFormData({
        title: '',
        description: '',
        probability: 'medium',
        impact: 'medium',
        mitigation: '',
      });
      setShowForm(false);
      if (onRiskAdded) onRiskAdded();
    } catch (err) {
      console.error('Failed to add risk:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRisk = async (riskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/milestones/${projectId}/risks/${riskId}`, {
        status: newStatus,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (onRiskUpdated) onRiskUpdated();
    } catch (err) {
      console.error('Failed to update risk:', err);
    }
  };

  const getRiskColor = (probability, impact) => {
    const scoreMap = { low: 1, medium: 2, high: 3 };
    const score = scoreMap[probability] * scoreMap[impact];
    if (score >= 6) return 'bg-red-50 border-red-200';
    if (score >= 3) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Register</h3>
      
      {risks && risks.length > 0 ? (
        <div className="space-y-3 mb-4">
          {risks.map((risk) => (
            <div key={risk._id} className={`p-4 rounded-lg border-2 ${getRiskColor(risk.probability, risk.impact)}`}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900">{risk.title}</h4>
                <select
                  value={risk.status}
                  onChange={(e) => handleUpdateRisk(risk._id, e.target.value)}
                  className="text-xs px-2 py-1 border border-gray-300 rounded"
                >
                  <option value="open">Open</option>
                  <option value="mitigated">Mitigated</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              {risk.description && (
                <p className="text-sm text-gray-700 mb-2">{risk.description}</p>
              )}
              <div className="flex gap-4 text-xs text-gray-600 mb-2">
                <span className="capitalize">Probability: <strong>{risk.probability}</strong></span>
                <span className="capitalize">Impact: <strong>{risk.impact}</strong></span>
              </div>
              {risk.mitigation && (
                <p className="text-sm text-gray-700 bg-white bg-opacity-50 p-2 rounded">
                  <strong>Mitigation:</strong> {risk.mitigation}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm mb-4">No risks identified</p>
      )}

      {showForm ? (
        <form onSubmit={handleAddRisk} className="space-y-3 bg-gray-50 p-4 rounded-lg">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Risk title"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Risk description"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            rows="2"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={formData.probability}
              onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="low">Low Probability</option>
              <option value="medium">Medium Probability</option>
              <option value="high">High Probability</option>
            </select>
            <select
              value={formData.impact}
              onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="low">Low Impact</option>
              <option value="medium">Medium Impact</option>
              <option value="high">High Impact</option>
            </select>
          </div>
          <textarea
            value={formData.mitigation}
            onChange={(e) => setFormData({ ...formData, mitigation: e.target.value })}
            placeholder="Mitigation strategy"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            rows="2"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 text-sm"
            >
              {loading ? 'Adding...' : 'Add Risk'}
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
          + Identify Risk
        </button>
      )}
    </div>
  );
}
