import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI, analyticsAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { DarkModeContext } from '../context/DarkModeContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { isDarkMode, toggleDarkMode } = useContext(DarkModeContext);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
  });

  useEffect(() => {
    fetchProjects();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      extractTeamMembers();
      generateChatMessages();
    }
  }, [projects]);

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
      console.log('Analytics not available');
    }
  };

  const extractTeamMembers = () => {
    const uniqueMembers = new Map();
    
    projects.forEach(project => {
      if (project.members && Array.isArray(project.members)) {
        project.members.forEach(member => {
          const memberId = member.user?._id || member._id;
          if (memberId && memberId !== user?._id) {
            const memberName = member.user?.name || member.name || 'Team Member';
            const memberEmail = member.user?.email || member.email || '';
            uniqueMembers.set(memberId, {
              id: memberId,
              name: memberName,
              email: memberEmail,
              avatar: memberName.charAt(0).toUpperCase(),
            });
          }
        });
      }
    });

    setTeamMembers(Array.from(uniqueMembers.values()).slice(0, 10));
  };

  const generateChatMessages = () => {
    const sampleMessages = teamMembers.slice(0, 3).map((member, idx) => ({
      id: idx + 1,
      user: member.name,
      time: `${9 + idx}:${20 + idx * 10} am`,
      message: idx === 2 ? 'Voice message audio' : `Great work on the ${projects[0]?.name || 'project'}!`,
    }));

    if (sampleMessages.length === 0) {
      setChatMessages([
        { id: 1, user: 'Team Member 1', time: '09:30 am', message: 'Good morning, team!' },
        { id: 2, user: 'Team Member 2', time: '09:28 am', message: "Morning! Let's sync up soon" },
        { id: 3, user: 'You', time: '09:40 am', message: "That's great! I'm ready to discuss" },
      ]);
    } else {
      setChatMessages(sampleMessages);
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
        status: 'active',
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

  const navItems = [
    { icon: '🏠', label: 'Home', id: 'home' },
    { icon: '📅', label: 'Schedule', id: 'schedule' },
    { icon: '📁', label: 'Projects', id: 'projects' },
    { icon: '✓', label: 'Tasks', id: 'tasks' },
    { icon: '🔍', label: 'Search', id: 'search' },
    { icon: '📄', label: 'Documents', id: 'documents' },
    { icon: '👥', label: 'Team', id: 'team' },
    { icon: '💬', label: 'Chat', id: 'chat' },
    { icon: '📈', label: 'Progress', id: 'progress' },
    { icon: '⚙️', label: 'Settings', id: 'settings' },
  ];

  const topProjects = projects.slice(0, 3);

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-gray-950' : 'bg-white'}`} style={{ fontFamily: 'Urbanist, sans-serif' }}>
      {/* Sidebar */}
      <aside className={`transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} ${isDarkMode ? 'bg-gray-900/50 border-gray-700/50' : 'bg-[#FF6523]/5 border-[#FF6523]/20'} backdrop-blur-3xl border-r flex flex-col p-5 gap-10 shadow-lg overflow-y-auto`}>
        {/* Sidebar Header */}
        <div className="pb-5 border-b border-[#FF6523]/20">
          <div className="flex items-center gap-3 p-3 bg-[#FF6523]/15 rounded-2xl border border-[#FF6523]/25 hover:bg-[#FF6523]/25 transition-all">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6523] to-[#9C4CE0] flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <p className="text-xs text-white/70">Hello Again!</p>
              <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
            </div>
            <button className="text-white/60 hover:text-white text-lg">⋮</button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'home') navigate('/dashboard');
                else if (item.id === 'projects') navigate('/projects');
                else if (item.id === 'tasks') navigate('/tasks');
                else if (item.id === 'search') navigate('/search');
                else if (item.id === 'documents') navigate('/documents');
                else if (item.id === 'team') navigate('/users');
                else if (item.id === 'progress') navigate('/dashboard');
                else if (item.id === 'settings') navigate('/settings');
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/20 backdrop-blur-xl hover:bg-white/30 border border-white/40 text-gray-800 font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <span className="text-lg">{item.icon}</span>
              <span className={`text-sm font-medium ${sidebarOpen ? '' : 'hidden'}`}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="flex gap-2 pt-5 border-t border-[#FF6523]/20">
          <button className="flex-1 p-3 rounded-2xl bg-gradient-to-br from-white/30 to-white/20 backdrop-blur-xl hover:from-white/40 hover:to-white/30 border border-white/40 text-gray-800 font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">+</button>
          <button className="flex-1 p-3 rounded-2xl bg-gradient-to-br from-white/30 to-white/20 backdrop-blur-xl hover:from-white/40 hover:to-white/30 border border-white/40 text-gray-800 font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">📊</button>
          <button className="flex-1 p-3 rounded-2xl bg-gradient-to-br from-white/30 to-white/20 backdrop-blur-xl hover:from-white/40 hover:to-white/30 border border-white/40 text-gray-800 font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">🗑️</button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#FF6523]/20'} border-b p-4 flex justify-between items-center gap-5 shadow-sm`}>
          <div className={`flex items-center gap-2 flex-1 max-w-md ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-[#F3F3F0] border-[#FF6523]/20'} rounded-xl px-3 py-2 border hover:bg-opacity-80 transition-all`}>
            <input 
              type="text" 
              placeholder="Search something..." 
              className={`flex-1 bg-transparent ${isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'} outline-none text-sm`}
            />
            <button className={isDarkMode ? 'text-gray-400 hover:text-[#FF6523]' : 'text-gray-600 hover:text-[#FF6523]'}>🔍</button>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-gray-600 text-lg hover:scale-110 transition-transform">🎙️</button>
            
            <div className="flex items-center gap-2">
              {teamMembers.slice(0, 3).map(member => (
                <div 
                  key={member.id} 
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-lg"
                  title={member.name}
                >
                  {member.avatar}
                </div>
              ))}
              {teamMembers.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold border border-white/30">
                  +{teamMembers.length - 3}
                </div>
              )}
            </div>

            <button className="px-3 py-1.5 text-sm bg-white/15 border border-white/30 rounded-lg text-white hover:bg-white/25 transition-all">
              + Member
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Overview Card */}
            <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#FF6523]/10'} rounded-3xl p-6 border shadow-sm hover:shadow-md transition-all`}>
              <div className="mb-6">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-1`}>Overview</h2>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>10% this week</p>
              </div>

              <div className={`flex items-center justify-center h-64 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-br from-[#FF6523]/5 to-[#9C4CE0]/5 border-[#FF6523]/10'} rounded-2xl border`}>
                <svg viewBox="0 0 600 300" className="w-full h-full max-w-md">
                  <rect x="60" y="150" width="50" height="120" fill="#00d4ff" opacity="0.8" />
                  <rect x="130" y="100" width="50" height="170" fill="#00d4ff" opacity="0.8" />
                  <rect x="200" y="80" width="50" height="190" fill="#00d4ff" opacity="0.8" />
                  <rect x="270" y="120" width="50" height="150" fill="#00d4ff" opacity="0.8" />
                  <rect x="340" y="140" width="50" height="130" fill="#00d4ff" opacity="0.8" />
                  <rect x="410" y="170" width="50" height="100" fill="#00d4ff" opacity="0.8" />
                  
                  <rect x="60" y="100" width="50" height="50" fill="#667eea" opacity="0.6" />
                  <rect x="130" y="60" width="50" height="40" fill="#667eea" opacity="0.6" />
                  <rect x="200" y="40" width="50" height="40" fill="#667eea" opacity="0.6" />
                  <rect x="270" y="80" width="50" height="40" fill="#667eea" opacity="0.6" />
                  <rect x="340" y="100" width="50" height="40" fill="#667eea" opacity="0.6" />
                  <rect x="410" y="130" width="50" height="40" fill="#667eea" opacity="0.6" />
                </svg>
              </div>
            </div>

            {/* Projects Card */}
            <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#FF6523]/10'} rounded-3xl p-6 border shadow-sm hover:shadow-md transition-all`}>
              <div className="mb-6">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Projects</h2>
              </div>

              <div className="space-y-4">
                {topProjects.map(project => (
                  <div
                    key={project._id}
                    onClick={() => navigate(`/projects/${project._id}`)}
                    className="cursor-pointer p-4 bg-gradient-to-br from-[#FF6523]/5 to-[#9C4CE0]/5 border border-[#FF6523]/10 rounded-2xl hover:bg-[#FF6523]/10 hover:border-[#FF6523]/20 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#FF6523] transition-colors">{project.name}</h3>
                      <button className="text-gray-400 group-hover:text-[#FF6523] transition-colors">↗</button>
                    </div>

                    <p className="text-sm text-gray-500 mb-3">
                      Due: {new Date(project.endDate).toLocaleDateString()}
                    </p>

                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="font-bold text-gray-800">{project.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#FF6523] to-[#9C4CE0] rounded-full transition-all shadow-lg"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Team Members Section */}
                    {project.members && project.members.length > 0 && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 mb-2">👥 Team Members ({project.members.length})</p>
                        <div className="space-y-2">
                          {project.members.map((member, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-gray-50 transition-all border border-gray-100">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF6523] to-[#9C4CE0] flex items-center justify-center text-white text-xs font-bold">
                                {member.user?.name?.charAt(0)?.toUpperCase() || 'M'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">{member.user?.name || 'Team Member'}</p>
                                <p className="text-xs text-gray-400">{member.role || 'Contributor'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {projects.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No projects yet</p>
                  <button
                    onClick={() => setShowNewProject(true)}
                    className="px-6 py-2 bg-gradient-to-r from-[#FF6523] to-[#9C4CE0] text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    Create First Project
                  </button>
                </div>
              )}
            </div>

            {/* Schedule Card */}
            <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#FF6523]/10'} rounded-3xl p-6 border shadow-sm hover:shadow-md transition-all`}>
              <div className="mb-6">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Schedule</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {['Team Sync', 'Review', 'Planning', 'Demo'].map((item, idx) => (
                  <div key={idx} className="p-4 bg-gradient-to-br from-[#FF6523]/5 to-[#9C4CE0]/5 border border-[#FF6523]/10 border-l-4 border-l-[#FF6523] rounded-lg hover:bg-[#FF6523]/10 transition-all">
                    <h4 className="text-sm font-bold text-gray-800 mb-1">{item} Meeting</h4>
                    <p className="text-xs text-[#FF6523] font-semibold mb-2">10:{15 + idx * 5} AM</p>
                    <div className="flex gap-1">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#FF6523] to-[#9C4CE0] flex items-center justify-center text-white text-xs font-bold"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Chat Card */}
            <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#FF6523]/10'} rounded-3xl border shadow-sm flex flex-col h-96`}>
              <div className={`p-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-1`}>Team Chat</h3>
                <p className="text-xs text-[#FF6523]">3 members online</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map(msg => (
                  <div key={msg.id} className="flex gap-2 animate-slideIn">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF6523] to-[#9C4CE0] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg"></div>
                    <div className="flex-1">
                      <div className="flex justify-between gap-2 mb-1">
                        <p className="text-xs font-semibold text-gray-800">{msg.user}</p>
                        <p className="text-xs text-gray-400">{msg.time}</p>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-gray-200 flex gap-2">
                <input
                  type="text"
                  placeholder="Type message..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#FF6523] transition-all"
                />
                <button className="p-2 bg-gradient-to-r from-[#FF6523] to-[#9C4CE0] rounded-lg text-white hover:shadow-lg transition-all">
                  ↑
                </button>
              </div>
            </div>

            {/* Features Promo */}
            <div className={`${isDarkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700' : 'bg-gradient-to-br from-[#FF6523]/10 to-[#9C4CE0]/10 border-[#FF6523]/20'} rounded-3xl p-6 border shadow-sm text-center`}>
              <p className="text-4xl mb-2 animate-float">✨</p>
              <h4 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-1`}>New Features!</h4>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Check out our latest updates</p>
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-4 mb-4 border`}>
                <p className="text-4xl">🎉</p>
              </div>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-[#FF6523] to-[#9C4CE0] text-white font-semibold rounded-lg hover:shadow-lg transition-all">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#FF6523]/10'} rounded-3xl p-8 max-w-md w-full border shadow-lg`}>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Project Name"
                className={`w-full px-4 py-2 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:bg-gray-700' : 'bg-gray-50 border-[#FF6523]/20 text-gray-800 placeholder-gray-400 focus:bg-white'} border rounded-xl focus:outline-none focus:border-[#FF6523] transition-all`}
                required
              />
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Description"
                className={`w-full px-4 py-2 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:bg-gray-700' : 'bg-gray-50 border-[#FF6523]/20 text-gray-800 placeholder-gray-400 focus:bg-white'} border rounded-xl focus:outline-none focus:border-[#FF6523] transition-all resize-none`}
              />
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 border border-[#FF6523]/20 rounded-xl text-gray-800 focus:outline-none focus:bg-white focus:border-[#FF6523] transition-all"
              />
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 border border-[#FF6523]/20 rounded-xl text-gray-800 focus:outline-none focus:bg-white focus:border-[#FF6523] transition-all"
              />
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
                placeholder="Budget"
                className="w-full px-4 py-2 bg-gray-50 border border-[#FF6523]/20 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#FF6523] transition-all"
              />

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewProject(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-800 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#FF6523] to-[#9C4CE0] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease;
        }
      `}</style>
    </div>
  );
}
