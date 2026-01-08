import React, { useState, useEffect, useContext } from 'react';
import { DarkModeContext } from '../context/DarkModeContext';
import { AuthContext } from '../context/AuthContext';
import { tasksAPI } from '../services/api';

export default function Tasks() {
  const { isDarkMode } = useContext(DarkModeContext);
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: '',
    assignee: '',
    subtasks: [],
    comments: [],
  });

  useEffect(() => {
    loadTasks();
    if (user?.role === 'admin') {
      loadAdminStats();
    }
  }, [user]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await tasksAPI.getAll();
      setTasks(res.data || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminStats = async () => {
    if (user?.role !== 'admin') return;
    try {
      const res = await tasksAPI.adminGetStats();
      setAdminStats(res.data.stats);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      if (editingTask) {
        // Use admin endpoint if user is admin, otherwise use regular endpoint
        if (user?.role === 'admin') {
          await tasksAPI.adminUpdate(editingTask._id, newTask);
        } else {
          await tasksAPI.update(editingTask._id, newTask);
        }
      } else {
        await tasksAPI.create(newTask);
      }
      loadTasks();
      if (user?.role === 'admin') {
        loadAdminStats();
      }
      setNewTask({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        dueDate: '',
        assignee: '',
        subtasks: [],
        comments: [],
      });
      setEditingTask(null);
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        if (user?.role === 'admin') {
          await tasksAPI.adminDelete(taskId);
        } else {
          await tasksAPI.delete(taskId);
        }
        loadTasks();
        if (user?.role === 'admin') {
          loadAdminStats();
        }
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setNewTask(task);
    setShowModal(true);
  };

  const handleAddSubtask = () => {
    setNewTask({
      ...newTask,
      subtasks: [...(newTask.subtasks || []), { title: '', completed: false }],
    });
  };

  const handleUpdateSubtask = (index, updatedSubtask) => {
    const updatedSubtasks = [...(newTask.subtasks || [])];
    updatedSubtasks[index] = updatedSubtask;
    setNewTask({ ...newTask, subtasks: updatedSubtasks });
  };

  const handleRemoveSubtask = (index) => {
    setNewTask({
      ...newTask,
      subtasks: (newTask.subtasks || []).filter((_, i) => i !== index),
    });
  };

  const handleAddComment = (taskId, comment) => {
    const task = tasks.find(t => t._id === taskId);
    if (task) {
      handleEditTask({
        ...task,
        comments: [...(task.comments || []), { text: comment, timestamp: new Date() }],
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'my-tasks') return task.assignee === 'current-user';
    if (filter === 'overdue') return task.status === 'overdue';
    if (filter === 'in-progress') return task.status === 'in-progress';
    if (filter === 'completed') return task.status === 'completed';
    return true;
  });

  const completionPercentage = Math.round(
    (tasks.filter(t => t.status === 'completed').length / Math.max(tasks.length, 1)) * 100
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`} style={{ fontFamily: 'Urbanist, sans-serif' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              ✓ Task Management {user?.role === 'admin' && <span className="text-sm bg-red-500 text-white px-2 py-1 rounded">Admin</span>}
            </h1>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Organize and track your project tasks efficiently
            </p>
          </div>
          <div className="flex gap-3">
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all"
              >
                ⚙️ Admin Panel
              </button>
            )}
            <button
              onClick={() => {
                setEditingTask(null);
                setNewTask({
                  title: '',
                  description: '',
                  status: 'pending',
                  priority: 'medium',
                  dueDate: '',
                  assignee: '',
                  subtasks: [],
                  comments: [],
                });
                setShowModal(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-[#FF6523] to-[#9C4CE0] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              + Create Task
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#FF6523]/20'} border rounded-xl p-6`}>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Total Tasks</p>
            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{tasks.length}</p>
          </div>
          <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#FF6523]/20'} border rounded-xl p-6`}>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>In Progress</p>
            <p className={`text-3xl font-bold text-blue-600`}>{tasks.filter(t => t.status === 'in-progress').length}</p>
          </div>
          <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#FF6523]/20'} border rounded-xl p-6`}>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Completed</p>
            <p className={`text-3xl font-bold text-green-600`}>{tasks.filter(t => t.status === 'completed').length}</p>
          </div>
          <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#FF6523]/20'} border rounded-xl p-6`}>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Completion</p>
            <p className={`text-3xl font-bold text-[#FF6523]`}>{completionPercentage}%</p>
          </div>
        </div>

        {/* Admin Panel */}
        {user?.role === 'admin' && showAdminPanel && adminStats && (
          <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-red-200'} border-2 rounded-2xl p-6 mb-6`}>
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              📊 Admin Control Panel
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-red-50'} p-4 rounded-lg`}>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Tasks by Status</p>
                <div className="mt-2 space-y-1 text-sm">
                  {adminStats.byStatus?.map((item) => (
                    <p key={item._id} className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {item._id}: <span className="font-bold">{item.count}</span>
                    </p>
                  ))}
                </div>
              </div>
              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-red-50'} p-4 rounded-lg`}>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Tasks by Priority</p>
                <div className="mt-2 space-y-1 text-sm">
                  {adminStats.byPriority?.map((item) => (
                    <p key={item._id} className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {item._id}: <span className="font-bold">{item.count}</span>
                    </p>
                  ))}
                </div>
              </div>
              {adminStats.overdueTasks > 0 && (
                <div className={`col-span-2 ${isDarkMode ? 'bg-red-900/30' : 'bg-red-50'} p-4 rounded-lg border-l-4 border-red-500`}>
                  <p className={`${isDarkMode ? 'text-red-400' : 'text-red-600'} font-bold`}>
                    ⚠️ {adminStats.overdueTasks} Overdue Tasks
                  </p>
                  {adminStats.overdueTasksList?.slice(0, 3).map((task) => (
                    <p key={task._id} className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      • {task.title} (Assigned to: {task.assignee?.name || 'Unassigned'})
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#FF6523]/20'} border rounded-2xl p-6 mb-6`}>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all', label: 'All Tasks', icon: '📋' },
              { id: 'my-tasks', label: 'My Tasks', icon: '👤' },
              { id: 'in-progress', label: 'In Progress', icon: '⏳' },
              { id: 'completed', label: 'Completed', icon: '✅' },
              { id: 'overdue', label: 'Overdue', icon: '⚠️' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === f.id
                    ? 'bg-gradient-to-r from-[#FF6523] to-[#9C4CE0] text-white'
                    : isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6523]"></div>
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="space-y-4">
            {filteredTasks.map(task => (
              <div
                key={task._id}
                className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl transition-all`}
              >
                <div
                  className="p-6 cursor-pointer hover:opacity-75"
                  onClick={() => setExpandedTaskId(expandedTaskId === task._id ? null : task._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(task.priority)}`}>
                          {getPriorityIcon(task.priority)} {task.priority}
                        </span>
                      </div>
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {task.description}
                        </p>
                      )}
                      {task.dueDate && (
                        <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          📅 Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Subtasks: {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4 flex-wrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTask(task);
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        ✏️ Edit
                      </button>
                      {user?.role === 'admin' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Show admin edit modal with all fields
                            setEditingTask(task);
                            setNewTask({
                              ...task,
                              dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                            });
                            setShowModal(true);
                          }}
                          className="px-4 py-2 rounded-lg font-medium transition-all bg-red-600 hover:bg-red-700 text-white"
                        >
                          🔧 Admin Edit
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task._id);
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${isDarkMode ? 'bg-red-900/20 hover:bg-red-900/30 text-red-400' : 'bg-red-100/50 hover:bg-red-100'}`}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded View */}
                {expandedTaskId === task._id && (
                  <div className={`border-t ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'} p-6`}>
                    {/* Subtasks */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="mb-6">
                        <h4 className={`font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          📝 Subtasks
                        </h4>
                        <div className="space-y-2">
                          {task.subtasks.map((subtask, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={subtask.completed || false}
                                readOnly
                                className="w-5 h-5"
                              />
                              <span className={subtask.completed ? 'line-through' : ''}>
                                {subtask.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comments */}
                    {task.comments && task.comments.length > 0 && (
                      <div>
                        <h4 className={`font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          💬 Comments ({task.comments.length})
                        </h4>
                        <div className="space-y-3">
                          {task.comments.map((comment, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/30' : 'bg-white'}`}
                            >
                              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                {comment.text}
                              </p>
                              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                {new Date(comment.timestamp).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-12 rounded-xl ${isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No tasks found. {filter !== 'all' && 'Try adjusting your filters.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl max-w-2xl w-full max-h-96 overflow-y-auto`}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {editingTask ? 'Edit Task' : 'Create New Task'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4">
                <input
                  type="text"
                  placeholder="Task Title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:border-[#FF6523]`}
                  required
                />

                <textarea
                  placeholder="Description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:border-[#FF6523]`}
                  rows="3"
                />

                <div className={`grid ${user?.role === 'admin' ? 'grid-cols-4' : 'grid-cols-3'} gap-4`}>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                    className={`px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none`}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                  </select>

                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className={`px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none`}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>

                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className={`px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none`}
                  />
                  {user?.role === 'admin' && (
                    <input
                      type="number"
                      placeholder="Est. Hours"
                      value={newTask.estimatedHours || ''}
                      onChange={(e) => setNewTask({ ...newTask, estimatedHours: parseFloat(e.target.value) || 0 })}
                      className={`px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none`}
                    />
                  )}
                </div>

                {user?.role === 'admin' && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div>
                      <label className={`text-sm font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                        Estimated Hours
                      </label>
                      <input
                        type="number"
                        value={newTask.estimatedHours || 0}
                        onChange={(e) => setNewTask({ ...newTask, estimatedHours: parseFloat(e.target.value) || 0 })}
                        className={`w-full px-4 py-2 rounded-lg border mt-1 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                      />
                    </div>
                    <div>
                      <label className={`text-sm font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                        Actual Hours
                      </label>
                      <input
                        type="number"
                        value={newTask.actualHours || 0}
                        onChange={(e) => setNewTask({ ...newTask, actualHours: parseFloat(e.target.value) || 0 })}
                        className={`w-full px-4 py-2 rounded-lg border mt-1 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className={`px-4 py-2 rounded-lg font-medium ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  + Add Subtask
                </button>

                {newTask.subtasks && newTask.subtasks.map((subtask, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Subtask ${idx + 1}`}
                      value={subtask.title}
                      onChange={(e) => handleUpdateSubtask(idx, { ...subtask, title: e.target.value })}
                      className={`flex-1 px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FF6523] to-[#9C4CE0] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                  >
                    {editingTask ? 'Update Task' : 'Create Task'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={`flex-1 px-6 py-3 rounded-xl font-semibold ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
