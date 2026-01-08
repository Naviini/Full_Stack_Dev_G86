import React, { useState, useEffect, useContext } from 'react';
import { DarkModeContext } from '../context/DarkModeContext';
import { projectsAPI, tasksAPI } from '../services/api';

export default function Search() {
  const { isDarkMode } = useContext(DarkModeContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, projects, tasks
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedFilters, setSavedFilters] = useState([]);

  // Quick filter presets
  const quickFilters = [
    { label: 'My Tasks', type: 'my-tasks', icon: '✓' },
    { label: 'Overdue', type: 'overdue', icon: '⚠️' },
    { label: 'In Progress', type: 'in-progress', icon: '⏳' },
    { label: 'Completed', type: 'completed', icon: '✅' },
    { label: 'High Priority', type: 'high-priority', icon: '🔴' },
  ];

  // Load saved filters from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedFilters') || '[]');
    setSavedFilters(saved);
  }, []);

  // Search and filter
  useEffect(() => {
    if (searchTerm.length > 0 || filterStatus !== 'all' || filterPriority !== 'all') {
      performSearch();
    } else {
      setResults([]);
    }
  }, [searchTerm, filterType, filterStatus, filterPriority]);

  const performSearch = async () => {
    setLoading(true);
    try {
      let allResults = [];

      if (filterType === 'all' || filterType === 'projects') {
        const projectsRes = await projectsAPI.getAll();
        const filtered = projectsRes.data.filter(p =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        allResults = [...allResults, ...filtered.map(p => ({ ...p, type: 'project' }))];
      }

      if (filterType === 'all' || filterType === 'tasks') {
        const tasksRes = await tasksAPI.getAll();
        let filtered = tasksRes.data.filter(t =>
          t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filterStatus !== 'all') {
          filtered = filtered.filter(t => t.status === filterStatus);
        }
        if (filterPriority !== 'all') {
          filtered = filtered.filter(t => t.priority === filterPriority);
        }

        allResults = [...allResults, ...filtered.map(t => ({ ...t, type: 'task' }))];
      }

      setResults(allResults);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyQuickFilter = (filterType) => {
    setSearchTerm('');
    switch (filterType) {
      case 'my-tasks':
        setFilterType('tasks');
        setFilterStatus('all');
        setFilterPriority('all');
        break;
      case 'overdue':
        setFilterType('tasks');
        setFilterStatus('overdue');
        break;
      case 'in-progress':
        setFilterType('tasks');
        setFilterStatus('in-progress');
        break;
      case 'completed':
        setFilterType('tasks');
        setFilterStatus('completed');
        break;
      case 'high-priority':
        setFilterType('tasks');
        setFilterPriority('high');
        break;
      default:
        break;
    }
  };

  const saveCurrentFilter = () => {
    const filterName = prompt('Name this filter:');
    if (filterName) {
      const newFilter = {
        id: Date.now(),
        name: filterName,
        type: filterType,
        status: filterStatus,
        priority: filterPriority,
        search: searchTerm,
      };
      const updated = [...savedFilters, newFilter];
      setSavedFilters(updated);
      localStorage.setItem('savedFilters', JSON.stringify(updated));
    }
  };

  const applySavedFilter = (filter) => {
    setSearchTerm(filter.search);
    setFilterType(filter.type);
    setFilterStatus(filter.status);
    setFilterPriority(filter.priority);
  };

  const deleteSavedFilter = (filterId) => {
    const updated = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updated);
    localStorage.setItem('savedFilters', JSON.stringify(updated));
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`} style={{ fontFamily: 'Urbanist, sans-serif' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            🔍 Search & Filter
          </h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Find projects and tasks quickly with powerful search and filters
          </p>
        </div>

        {/* Search Bar */}
        <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#FF6523]/20'} rounded-2xl p-6 border shadow-lg mb-6`}>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Search projects, tasks, and more..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`flex-1 px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'} focus:outline-none focus:border-[#FF6523] transition-all`}
            />
            <button
              onClick={saveCurrentFilter}
              className="px-6 py-3 bg-gradient-to-r from-[#FF6523] to-[#9C4CE0] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              💾 Save Filter
            </button>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:border-[#FF6523]`}
              >
                <option value="all">All</option>
                <option value="projects">Projects Only</option>
                <option value="tasks">Tasks Only</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:border-[#FF6523]`}
              >
                <option value="all">All Status</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Priority
              </label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} focus:outline-none focus:border-[#FF6523]`}
              >
                <option value="all">All Priorities</option>
                <option value="critical">🔴 Critical</option>
                <option value="high">🟠 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Filters */}
        <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#FF6523]/20'} rounded-2xl p-6 border shadow-lg mb-6`}>
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Quick Filters</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {quickFilters.map(filter => (
              <button
                key={filter.type}
                onClick={() => applyQuickFilter(filter.type)}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
              >
                {filter.icon} {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#FF6523]/20'} rounded-2xl p-6 border shadow-lg mb-6`}>
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Saved Filters</h3>
            <div className="flex flex-wrap gap-2">
              {savedFilters.map(filter => (
                <div key={filter.id} className="flex items-center gap-2">
                  <button
                    onClick={() => applySavedFilter(filter)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${isDarkMode ? 'bg-[#FF6523]/20 hover:bg-[#FF6523]/30 text-[#FF6523]' : 'bg-[#FF6523]/10 hover:bg-[#FF6523]/20 text-[#FF6523]'}`}
                  >
                    {filter.name}
                  </button>
                  <button
                    onClick={() => deleteSavedFilter(filter.id)}
                    className={`p-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div>
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            Results ({results.length})
          </h3>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6523]"></div>
              <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map(result => (
                <div
                  key={`${result.type}-${result._id}`}
                  className={`${isDarkMode ? 'bg-gray-900 border-gray-700 hover:bg-gray-800' : 'bg-white border-gray-200 hover:bg-gray-50'} border rounded-xl p-6 transition-all`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${result.type === 'project' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                          {result.type === 'project' ? '📁 Project' : '✓ Task'}
                        </span>
                        {result.priority && (
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${result.priority === 'high' ? 'bg-red-100 text-red-800' : result.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {result.priority}
                          </span>
                        )}
                      </div>
                      <h4 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {result.name || result.title}
                      </h4>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {result.description}
                      </p>
                    </div>
                    <button className={`px-4 py-2 rounded-lg font-medium transition-all ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`}>
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-12 rounded-xl ${isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' 
                  ? 'No results found. Try adjusting your search or filters.'
                  : 'Start searching or use quick filters to find projects and tasks'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
