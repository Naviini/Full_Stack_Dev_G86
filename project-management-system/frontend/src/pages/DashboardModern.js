import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI, analyticsAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import '../styles/DashboardModern.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
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

  // Navigation items
  const navItems = [
    { icon: '🏠', label: 'Home', id: 'home' },
    { icon: '📅', label: 'Schedule', id: 'schedule' },
    { icon: '📁', label: 'Projects', id: 'projects' },
    { icon: '👥', label: 'Team', id: 'team' },
    { icon: '💬', label: 'Chat', id: 'chat' },
    { icon: '📈', label: 'Progress', id: 'progress' },
    { icon: '⚙️', label: 'Settings', id: 'settings' },
  ];

  // Get top projects for overview
  const topProjects = projects.slice(0, 3);
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;

  return (
    <div className="dashboard-modern">
      {/* Left Sidebar */}
      <aside className={`sidebar-modern ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="avatar-circle">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
            <div className="user-info">
              <p className="user-greeting">Hello Again!</p>
              <p className="user-name">{user?.name || 'User'}</p>
            </div>
            <button className="dropdown-btn">⋮</button>
          </div>
        </div>

        <nav className="nav-menu">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'home') navigate('/dashboard');
                else if (item.id === 'projects') navigate('/projects');
                else if (item.id === 'team') navigate('/users');
                else if (item.id === 'progress') navigate('/dashboard');
              }}
              className="nav-item"
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="action-btn">+</button>
          <button className="action-btn">📊</button>
          <button className="action-btn">🗑️</button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content-modern">
        {/* Top Bar */}
        <div className="top-bar-modern">
          <div className="search-container">
            <input type="text" placeholder="Search something" className="search-input" />
            <button className="search-btn">🔍</button>
          </div>
          <div className="top-bar-right">
            <button className="voice-btn">🎙️</button>
            <div className="team-avatars">
              {teamMembers.slice(0, 3).map(member => (
                <div key={member.id} className="avatar-small" title={member.name}>
                  {member.avatar}
                </div>
              ))}
              {teamMembers.length > 3 && (
                <div className="avatar-small" title={`+${teamMembers.length - 3} more`}>
                  +{teamMembers.length - 3}
                </div>
              )}
            </div>
            <button className="add-member-btn">+ Member</button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Left Section */}
          <div className="left-section">
            {/* Overview Section */}
            <section className="section-card overview-section">
              <div className="section-header">
                <h2>Overview</h2>
                <p className="subtitle">10% this week</p>
              </div>
              
              <div className="chart-container">
                <svg viewBox="0 0 600 300" className="bar-chart">
                  {/* Bar chart visualization */}
                  <rect x="60" y="150" width="50" height="120" fill="#ff6b35" />
                  <rect x="130" y="100" width="50" height="170" fill="#ff6b35" />
                  <rect x="200" y="80" width="50" height="190" fill="#ff6b35" />
                  <rect x="270" y="120" width="50" height="150" fill="#ff6b35" />
                  <rect x="340" y="140" width="50" height="130" fill="#ff6b35" />
                  <rect x="410" y="170" width="50" height="100" fill="#ff6b35" />
                  
                  {/* Overlay bars */}
                  <rect x="60" y="100" width="50" height="50" fill="#2d3748" opacity="0.6" />
                  <rect x="130" y="60" width="50" height="40" fill="#2d3748" opacity="0.6" />
                  <rect x="200" y="40" width="50" height="40" fill="#2d3748" opacity="0.6" />
                  <rect x="270" y="80" width="50" height="40" fill="#2d3748" opacity="0.6" />
                  <rect x="340" y="100" width="50" height="40" fill="#2d3748" opacity="0.6" />
                  <rect x="410" y="130" width="50" height="40" fill="#2d3748" opacity="0.6" />
                </svg>
              </div>
            </section>

            {/* Projects Grid */}
            <section className="section-card projects-section">
              <div className="section-header">
                <h2>Projects</h2>
              </div>
              
              <div className="projects-list">
                {topProjects.map(project => (
                  <div
                    key={project._id}
                    onClick={() => navigate(`/projects/${project._id}`)}
                    className="project-item clickable"
                  >
                    <div className="project-title-bar">
                      <h3>{project.name}</h3>
                      <button className="expand-btn">↗</button>
                    </div>
                    <p className="project-date">Due: {new Date(project.endDate).toLocaleDateString()}</p>
                    
                    <div className="project-progress">
                      <div className="progress-label">
                        <span>Progress</span>
                        <span className="progress-value">{project.progress}%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Team Members Section */}
                    {project.members && project.members.length > 0 && (
                      <div className="project-team-section">
                        <p className="team-section-label">👥 Team Members ({project.members.length})</p>
                        <div className="team-members-list">
                          {project.members.map((member, idx) => (
                            <div key={idx} className="team-member-item">
                              <div className="member-avatar-large">
                                {member.user?.name?.charAt(0)?.toUpperCase() || 'M'}
                              </div>
                              <div className="member-info">
                                <p className="member-name">{member.user?.name || 'Team Member'}</p>
                                <p className="member-role">{member.role || 'Contributor'}</p>
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
                <div className="empty-state">
                  <p>No projects yet</p>
                  <button
                    onClick={() => setShowNewProject(true)}
                    className="btn-primary-small"
                  >
                    Create First Project
                  </button>
                </div>
              )}
            </section>

            {/* Schedule Section */}
            <section className="section-card schedule-section">
              <div className="section-header">
                <h2>Schedule</h2>
                <p className="subtitle">October 2025</p>
              </div>
              
              <div className="schedule-content">
                <div className="schedule-item">
                  <h4>Morning Meeting</h4>
                  <p>10:00 AM</p>
                  <div className="member-avatars">
                    <div className="avatar-small">J</div>
                    <div className="avatar-small">S</div>
                    <div className="avatar-small">C</div>
                    <div className="avatar-small">+2</div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Section - Chat */}
          <aside className="right-section">
            <div className="team-chat-section">
              <div className="chat-header">
                <h3>Team Chat</h3>
                <p className="online-count">{Math.floor(Math.random() * 8) + 1}/20 online</p>
              </div>

              <div className="chat-messages">
                {chatMessages.map(msg => (
                  <div key={msg.id} className="message-item">
                    <div className="message-avatar">
                      {msg.user.charAt(0)}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <span className="message-user">{msg.user}</span>
                        <span className="message-time">{msg.time}</span>
                      </div>
                      {msg.message.includes('audio') ? (
                        <div className="voice-message">▶️ 🔊 ━━━━━━━━ 2:45</div>
                      ) : (
                        <p className="message-text">{msg.message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="chat-input-area">
                <input
                  type="text"
                  placeholder="Type here..."
                  className="chat-input"
                />
                <button className="chat-send-btn">🎙️</button>
              </div>
            </div>

            {/* New Features Section */}
            <div className="features-promo">
              <div className="promo-header">
                <span className="promo-icon">🎉</span>
                <h4>New Features!</h4>
                <p>Available Now</p>
              </div>
              <div className="promo-image">
                <div className="avatar-large">😊</div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Create Project Modal */}
      {showNewProject && (
        <div className="modal-overlay" onClick={() => setShowNewProject(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Create New Project</h2>
            <form onSubmit={handleCreateProject} className="modal-form">
              <input
                type="text"
                placeholder="Project Name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
              <input
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
              <input
                type="date"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Budget"
                value={formData.budget}
                onChange={e => setFormData({ ...formData, budget: e.target.value })}
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowNewProject(false)}>
                  Cancel
                </button>
                <button type="submit">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
