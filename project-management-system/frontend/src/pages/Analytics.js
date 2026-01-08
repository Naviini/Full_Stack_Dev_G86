import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function Analytics() {
  const { projectId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/analytics/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(response.data);
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!analytics) return <div>No data available</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Project Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-medium">Total Tasks</p>
            <p className="text-3xl font-bold text-indigo-600">{analytics.totalTasks}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-medium">Completed</p>
            <p className="text-3xl font-bold text-green-600">{analytics.completedTasks}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-medium">Completion %</p>
            <p className="text-3xl font-bold text-purple-600">{analytics.completionPercentage}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-medium">Overdue Tasks</p>
            <p className="text-3xl font-bold text-red-600">{analytics.riskMetrics.overdueTasks}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Tasks by Status</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700">To Do</span>
                  <span className="font-semibold">{analytics.byStatus.todo}</span>
                </div>
                <div className="w-full bg-gray-200 rounded h-2">
                  <div className="bg-yellow-500 h-2 rounded" style={{ width: `${analytics.byStatus.todo / analytics.totalTasks * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700">In Progress</span>
                  <span className="font-semibold">{analytics.byStatus.inProgress}</span>
                </div>
                <div className="w-full bg-gray-200 rounded h-2">
                  <div className="bg-blue-500 h-2 rounded" style={{ width: `${analytics.byStatus.inProgress / analytics.totalTasks * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700">Review</span>
                  <span className="font-semibold">{analytics.byStatus.review}</span>
                </div>
                <div className="w-full bg-gray-200 rounded h-2">
                  <div className="bg-purple-500 h-2 rounded" style={{ width: `${analytics.byStatus.review / analytics.totalTasks * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700">Completed</span>
                  <span className="font-semibold">{analytics.byStatus.completed}</span>
                </div>
                <div className="w-full bg-gray-200 rounded h-2">
                  <div className="bg-green-500 h-2 rounded" style={{ width: `${analytics.byStatus.completed / analytics.totalTasks * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Tasks by Priority</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <span className="text-gray-700">Low Priority</span>
                <span className="font-semibold text-green-600">{analytics.byPriority.low}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                <span className="text-gray-700">Medium Priority</span>
                <span className="font-semibold text-yellow-600">{analytics.byPriority.medium}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                <span className="text-gray-700">High Priority</span>
                <span className="font-semibold text-red-600">{analytics.byPriority.high}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                <span className="text-gray-700">Critical</span>
                <span className="font-semibold text-purple-600">{analytics.byPriority.critical}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Time Tracking</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Estimated Hours</span>
                  <span className="font-semibold text-indigo-600">{analytics.timeTracking.estimated}h</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Actual Hours</span>
                  <span className="font-semibold text-indigo-600">{analytics.timeTracking.actual}h</span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-700 font-semibold">Variance</span>
                  <span className={`font-semibold ${analytics.timeTracking.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {analytics.timeTracking.variance > 0 ? '+' : ''}{analytics.timeTracking.variance}h
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Budget Usage</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Estimated Budget</span>
                  <span className="font-semibold text-indigo-600">${analytics.budgetUsage.estimated}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Actual Spend</span>
                  <span className="font-semibold text-indigo-600">${analytics.budgetUsage.actual}</span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="w-full bg-gray-200 rounded h-3">
                  <div className="bg-gradient-to-r from-indigo-600 to-pink-600 h-3 rounded" style={{ width: `${Math.min(analytics.budgetUsage.percentage, 100)}%` }} />
                </div>
                <p className="text-center mt-2 text-sm text-gray-600">{analytics.budgetUsage.percentage}% used</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
