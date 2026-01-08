import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI, analyticsAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    fetchAnalytics();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getAll();
      setProjects(response.data);
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await analyticsAPI.getDashboardOverview();
      setAnalytics(response.data);
    } catch (err) {
      // Analytics endpoint might not exist yet, that's okay
      console.log('Analytics not available');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const projectData = {
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: {
          estimated: formData.budget ? parseFloat(formData.budget) : 0,
          actual: 0,
        },
        status: 'planning',
        progress: 0,
      };
      const newProject = await projectsAPI.create(projectData);
      setProjects([newProject.data, ...projects]);
      setFormData({ name: '', description: '', startDate: '', endDate: '', budget: '' });
      setShowNewProject(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  // Calculate metrics from projects
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const totalRevenue = projects.reduce((sum, p) => sum + (p.budget?.actual || 0), 0);
  const totalTimeSpent = projects.reduce((sum, p) => {
    // This would come from time logs, for now estimate
    return sum + (p.progress || 0) * 10; // Rough estimate
  }, 0);
  const totalResources = new Set(projects.flatMap(p => p.members?.map(m => m.user?._id || m.user) || [])).size;

  const getStatusColor = (status) => {
    const colors = {
      'completed': 'bg-green-100 text-green-800',
      'active': 'bg-blue-100 text-blue-800',
      'on-hold': 'bg-yellow-100 text-yellow-800',
      'planning': 'bg-gray-100 text-gray-800',
      'delayed': 'bg-yellow-100 text-yellow-800',
      'at risk': 'bg-red-100 text-red-800',
      'on-going': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors['planning'];
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const overallProgress = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
    : 0;

  if (loading) {
    return (
      <div className="flex">
        <Sidebar onCreateProject={() => setShowNewProject(true)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onCreateProject={() => setShowNewProject(true)} />
      
      <div className="flex-1 flex flex-col">
        <TopHeader title="Dashboard" />
        
        <div className="flex-1 p-6 bg-gray-50">
          {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

          {/* Create Project Modal */}
          {showNewProject && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full mx-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Create New Project</h3>
                  <button
                    onClick={() => setShowNewProject(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleCreateProject} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Project Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                    />
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <textarea
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                    rows="3"
                  />
                  <input
                    type="number"
                    placeholder="Budget (optional)"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowNewProject(false)}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Create Project
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-2">Total revenue</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">${totalRevenue.toLocaleString()}</p>
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <span>↑</span>
                <span>12% increase from last month</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💼</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-2">Projects</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{totalProjects} / 100</p>
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <span>↓</span>
                <span>10% decrease from last month</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⏰</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-2">Time spent</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{totalTimeSpent} / 1300 Hrs</p>
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <span>↑</span>
                <span>8% increase from last month</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-2">Resources</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{totalResources} / 120</p>
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <span>↑</span>
                <span>2% increase from last month</span>
              </div>
            </div>
          </div>

          {/* Project Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Project summary</h2>
              <div className="flex gap-4">
                <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                  <option>Project</option>
                </select>
                <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                  <option>Project manager</option>
                </select>
                <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                  <option>Status</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Project manager</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Due date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-gray-500">
                        No projects yet. Create one to get started!
                      </td>
                    </tr>
                  ) : (
                    projects.map((project) => {
                      const manager = project.owner?.name || 'N/A';
                      const dueDate = project.endDate
                        ? new Date(project.endDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A';
                      const status = project.status || 'planning';
                      const progress = project.progress || 0;

                      return (
                        <tr
                          key={project._id}
                          onClick={() => navigate(`/projects/${project._id}`)}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="py-4 px-4 font-semibold text-gray-900">{project.name}</td>
                          <td className="py-4 px-4 text-gray-600">{manager}</td>
                          <td className="py-4 px-4 text-gray-600">{dueDate}</td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white ${
                                  progress >= 100
                                    ? 'bg-green-500'
                                    : progress >= 70
                                    ? 'bg-blue-500'
                                    : progress >= 40
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                              >
                                {progress}%
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Overall Progress</h2>
              <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All</option>
              </select>
            </div>

            <div className="flex items-center justify-center py-8">
              <div className="relative" style={{ width: '320px', height: '160px' }}>
                <svg
                  width="320"
                  height="160"
                  viewBox="0 0 320 160"
                  style={{ position: 'absolute', top: 0, left: 0 }}
                >
                  <defs>
                    <path
                      id="arc"
                      d="M 20 140 A 140 140 0 0 1 300 140"
                      fill="none"
                    />
                  </defs>
                  {/* Background arc */}
                  <use href="#arc" stroke="#e5e7eb" strokeWidth="24" strokeLinecap="round" />
                  {/* Progress arc */}
                  <use
                    href="#arc"
                    stroke={overallProgress >= 70 ? '#10b981' : overallProgress >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="24"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.PI * 140}`}
                    strokeDashoffset={`${Math.PI * 140 * (1 - overallProgress / 100)}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: '30px' }}>
                  <p className="text-5xl font-bold text-gray-900">{overallProgress}%</p>
                  <p className="text-gray-600 text-sm mt-1">Completed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
