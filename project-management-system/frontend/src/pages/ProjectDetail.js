import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, tasksAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
// eslint-disable-next-line no-unused-vars
import TimeTracker from '../components/TimeTracker';
// eslint-disable-next-line no-unused-vars
import SubtaskManager from '../components/SubtaskManager';
import GanttChart from '../components/GanttChart';
import GoalManager from '../components/GoalManager';
import ScopeManager from '../components/ScopeManager';
import ResourceManager from '../components/ResourceManager';
import InviteMembersModal from '../components/InviteMembersModal';
import Collaboration from '../components/Collaboration';
import OverallProgressChart from '../components/OverallProgressChart';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
  });

  useEffect(() => {
    fetchProjectAndTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProjectAndTasks = async () => {
    try {
      setLoading(true);
      const projectRes = await projectsAPI.getOne(id);
      setProject(projectRes.data);
      const tasksRes = await tasksAPI.getByProject(id);
      setTasks(tasksRes.data);
    } catch (err) {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const newTask = await tasksAPI.create({
        ...formData,
        project: id,
      });
      setTasks([newTask.data, ...tasks]);
      setFormData({ title: '', description: '', priority: 'medium', dueDate: '' });
      setShowNewTask(false);
    } catch (err) {
      setError('Failed to create task');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await tasksAPI.update(taskId, { status: newStatus });
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleUpdateProjectName = async (e) => {
    e.preventDefault();
    if (!editingName.trim()) {
      setError('Project name cannot be empty');
      return;
    }
    
    try {
      const updatedProject = await projectsAPI.update(id, { name: editingName.trim() });
      setProject(updatedProject.data);
      setShowEditName(false);
      setError('');
    } catch (err) {
      setError('Failed to update project name');
    }
  };

  const isAdmin = project && (
    currentUser?._id === project.owner._id || 
    currentUser?.id === project.owner._id ||
    project.members?.some(m => (m.user._id === currentUser?._id || m.user === currentUser?.id) && m.role === 'admin')
  );

  if (loading) return <div className="loading">Loading...</div>;
  if (!project) return <div className="error">Project not found</div>;

  const tasksByStatus = {
    'todo': tasks.filter(t => t.status === 'todo'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    'review': tasks.filter(t => t.status === 'review'),
    'completed': tasks.filter(t => t.status === 'completed'),
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800',
      'critical': 'bg-purple-100 text-purple-800',
    };
    return colors[priority] || colors['medium'];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 inline-flex items-center text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="mb-6 flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-gray-900">{project.name}</h1>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditingName(project.name);
                      setShowEditName(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-700 transition-colors"
                    title="Edit project name"
                  >
                    ✏️
                  </button>
                )}
              </div>
              <p className="text-gray-600 text-lg">{project.description}</p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
            >
              👥 Invite Members
            </button>
          </div>

          {/* Edit Project Name Modal */}
          {showEditName && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Project Name</h2>
                <form onSubmit={handleUpdateProjectName} className="space-y-4">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    placeholder="Enter new project name"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition-colors"
                    autoFocus
                  />
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowEditName(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4">
              <p className="text-gray-600 text-sm font-medium">Status</p>
              <p className="text-xl font-bold text-indigo-600 capitalize">{project.status}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <p className="text-gray-600 text-sm font-medium">Progress</p>
              <p className="text-xl font-bold text-purple-600">{project.progress}%</p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4">
              <p className="text-gray-600 text-sm font-medium">Budget (Estimated)</p>
              <p className="text-xl font-bold text-pink-600">
                ${project.budget?.estimated ?? 0}
              </p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
              <p className="text-gray-600 text-sm font-medium">Tasks</p>
              <p className="text-xl font-bold text-yellow-600">{tasks.length}</p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-indigo-600 to-pink-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {error && <div className="error-message mb-6">{error}</div>}

        {/* Tab Navigation */}
        <div className="bg-white rounded-t-2xl shadow-lg mb-0 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-2 py-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📋 Overview
              </button>
              <button
                onClick={() => setActiveTab('goals')}
                className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
                  activeTab === 'goals'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🎯 Goals
              </button>
              <button
                onClick={() => setActiveTab('scope')}
                className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
                  activeTab === 'scope'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📄 Scope
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
                  activeTab === 'timeline'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📊 Timeline
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
                  activeTab === 'progress'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📈 Overall Progress
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
                  activeTab === 'resources'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                👥 Resources
              </button>
              <button
                onClick={() => setActiveTab('collaboration')}
                className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
                  activeTab === 'collaboration'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                💬 Collaboration
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-2xl shadow-lg p-8 mb-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Tasks</h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate(`/projects/${id}/analytics`)}
                    className="btn-secondary"
                  >
                    📊 Analytics
                  </button>
                  <button
                    onClick={() => setShowNewTask(!showNewTask)}
                    className="btn-primary"
                  >
                    {showNewTask ? '✕ Cancel' : '+ New Task'}
                  </button>
                </div>
              </div>

              {showNewTask && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6 border-2 border-indigo-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Task</h3>
                  <form onSubmit={handleCreateTask} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Task Title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition-colors"
                    />
                    <textarea
                      placeholder="Description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition-colors"
                      rows="3"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition-colors"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                        <option value="critical">Critical</option>
                      </select>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition-colors"
                      />
                    </div>
                    <button type="submit" className="btn-primary w-full">
                      Create Task
                    </button>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
                  <div key={status} className="bg-gray-100 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 capitalize">
                      {status.replace('-', ' ')} ({statusTasks.length})
                    </h3>
                    <div className="space-y-3">
                      {statusTasks.map((task) => (
                        <div key={task._id} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                          <h4 className="font-semibold text-gray-900 mb-2">{task.title}</h4>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs font-bold px-2 py-1 rounded ${getPriorityColor(task.priority)} capitalize`}>
                                {task.priority}
                              </span>
                              {task.dueDate && (
                                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <select
                              value={task.status}
                              onChange={(e) => handleUpdateTaskStatus(task._id, e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-indigo-600"
                            >
                              <option value="todo">To Do</option>
                              <option value="in-progress">In Progress</option>
                              <option value="review">Review</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        </div>
                      ))}
                      {statusTasks.length === 0 && (
                        <p className="text-gray-400 text-center py-8">No tasks</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals Tab */}
          {activeTab === 'goals' && (
            <GoalManager projectId={id} />
          )}

          {/* Scope Tab */}
          {activeTab === 'scope' && (
            <ScopeManager projectId={id} />
          )}

          {/* Timeline (Gantt Chart) Tab */}
          {activeTab === 'timeline' && (
            <GanttChart 
              tasks={tasks} 
              startDate={project?.startDate || new Date()} 
              endDate={project?.endDate || new Date(Date.now() + 30*24*60*60*1000)} 
            />
          )}

          {/* Overall Progress Tab */}
          {activeTab === 'progress' && (
            <OverallProgressChart projectId={id} />
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <ResourceManager projectId={id} />
          )}

          {/* Collaboration Tab */}
          {activeTab === 'collaboration' && (
            <Collaboration projectId={id} />
          )}
        </div>

        {/* Invite Members Modal */}
        <InviteMembersModal
          projectId={id}
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onMemberAdded={() => {
            fetchProjectAndTasks();
            setShowInviteModal(false);
          }}
        />
      </div>
    </div>
  );
}
