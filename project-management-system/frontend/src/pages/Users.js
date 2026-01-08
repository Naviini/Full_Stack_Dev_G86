import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Users.css';

export default function Users() {
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'team-member',
    avatar: '',
  });

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch all projects for current user
      const projectsResponse = await fetch('http://localhost:5001/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!projectsResponse.ok) throw new Error('Failed to fetch projects');
      const projects = await projectsResponse.json();

      // Collect all unique team members from all projects with their associated projects
      const membersMap = new Map();

      for (const project of projects) {
        // Add project owner
        if (project.owner) {
          const ownerId = project.owner._id || project.owner;
          if (!membersMap.has(ownerId)) {
            membersMap.set(ownerId, {
              _id: ownerId,
              name: project.owner.name || 'Unknown',
              email: project.owner.email || 'No email',
              avatar: project.owner.avatar || '',
              role: 'project-manager',
              createdAt: new Date(),
              projects: [],
            });
          }
          membersMap.get(ownerId).projects.push({
            _id: project._id,
            name: project.name,
            progress: project.progress || 0,
          });
        }

        // Add project members
        if (project.members && Array.isArray(project.members)) {
          for (const member of project.members) {
            const userId = member.user._id || member.user;
            if (!membersMap.has(userId)) {
              membersMap.set(userId, {
                _id: userId,
                name: member.user.name || 'Unknown',
                email: member.user.email || 'No email',
                avatar: member.user.avatar || '',
                role: member.role === 'admin' ? 'project-manager' : 'team-member',
                createdAt: member.joinedAt || new Date(),
                projects: [],
              });
            }
            membersMap.get(userId).projects.push({
              _id: project._id,
              name: project.name,
              progress: project.progress || 0,
            });
          }
        }
      }

      // Remove duplicate projects for each member
      membersMap.forEach(member => {
        const uniqueProjects = new Map();
        member.projects.forEach(proj => {
          if (!uniqueProjects.has(proj._id)) {
            uniqueProjects.set(proj._id, proj);
          }
        });
        member.projects = Array.from(uniqueProjects.values());
      });

      // Convert map to array and exclude current user
      const teamMembers = Array.from(membersMap.values()).filter(m => m._id !== currentUser?._id);
      
      setTeamMembers(teamMembers);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load team members');
      setTeamMembers([]);
    } finally {
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
    
    if (!formData.name || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingId
        ? `http://localhost:5001/api/users/${editingId}`
        : 'http://localhost:5001/api/users';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error(`Failed to ${editingId ? 'update' : 'create'} team member`);

      const data = await response.json();

      if (editingId) {
        setTeamMembers(teamMembers.map(u => u._id === editingId ? data : u));
        setEditingId(null);
      } else {
        setTeamMembers([data, ...teamMembers]);
      }

      setFormData({ name: '', email: '', role: 'team-member', avatar: '' });
      setShowAddForm(false);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (user) => {
    // Navigate to projects where this member can be managed
    alert(`To manage ${user.name}'s role, visit your projects and update their membership there.`);
  };

  const handleDelete = async (userId, userName) => {
    // Removed - team members should be removed via project management
    alert(`To remove ${userName} from your team, visit the specific project and manage members there.`);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ name: '', email: '', role: 'team-member', avatar: '' });
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role) => {
    const colors = {
      'admin': 'bg-red-100 text-red-800',
      'project-manager': 'bg-blue-100 text-blue-800',
      'team-member': 'bg-green-100 text-green-800',
      'viewer': 'bg-gray-100 text-gray-800',
    };
    return colors[role] || colors['team-member'];
  };

  const getRoleBadge = (role) => {
    const badges = {
      'admin': '👑 Admin',
      'project-manager': '📊 Project Manager',
      'team-member': '👤 Team Member',
      'viewer': '👁️ Viewer',
    };
    return badges[role] || role;
  };

  if (loading) return <div className="loading-container"><p>Loading team members...</p></div>;

  return (
    <div className="users-container">
      <div className="users-header">
        <div>
          <h1 className="users-title">👥 Team Members</h1>
          <p className="users-subtitle">Manage your team members and roles</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-secondary"
        >
          ← Back to Dashboard
        </button>
      </div>

      {error && <div className="error-alert">{error}</div>}

      {/* Search and Filter Section */}
      <div className="users-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="project-manager">📊 Project Manager</option>
            <option value="team-member">👤 Team Member</option>
          </select>

          <button
            onClick={() => navigate('/projects')}
            className="btn-primary"
          >
            + Add Members via Projects
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="form-container">
          <h2 className="form-title">
            {editingId ? '✏️ Edit Team Member' : '➕ Add New Team Member'}
          </h2>
          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="team-member">👤 Team Member</option>
                  <option value="project-manager">📊 Project Manager</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="avatar">Avatar URL</label>
                <input
                  type="url"
                  id="avatar"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleInputChange}
                  placeholder="https://example.com/avatar.jpg"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingId ? 'Update Team Member' : 'Add Team Member'}
              </button>
              <button type="button" onClick={handleCancel} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List/Grid */}
      <div className="users-stats">
        <div className="stat-card">
          <p className="stat-label">Total Team Members</p>
          <p className="stat-value">{teamMembers.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Showing</p>
          <p className="stat-value">{filteredMembers.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Project Managers</p>
          <p className="stat-value">{teamMembers.filter(m => m.role === 'project-manager').length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Team Members</p>
          <p className="stat-value">{teamMembers.filter(m => m.role === 'team-member').length}</p>
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="no-users">
          <p className="no-users-icon">📭</p>
          <p className="no-users-text">
            {searchTerm || filterRole !== 'all' 
              ? 'No team members match your search criteria' 
              : 'No team members found'}
          </p>
        </div>
      ) : (
        <div className="users-grid">
          {filteredMembers.map(member => (
            <div key={member._id} className="user-card">
              <div className="user-card-header">
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} className="user-avatar" />
                ) : (
                  <div className="user-avatar-placeholder">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="user-info">
                  <h3 className="user-name">{member.name}</h3>
                  <p className="user-email">{member.email}</p>
                </div>
              </div>

              <div className="user-card-body">
                <span className={`role-badge ${getRoleColor(member.role)}`}>
                  {getRoleBadge(member.role)}
                </span>
                {member.createdAt && (
                  <p className="user-date">
                    📅 Joined {new Date(member.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Projects Section */}
              {member.projects && member.projects.length > 0 && (
                <div className="user-projects-section">
                  <p className="projects-label">📁 Projects ({member.projects.length})</p>
                  <div className="user-projects-list">
                    {member.projects.map((proj, idx) => (
                      <div key={idx} className="user-project-item">
                        <div className="project-name-badge">{proj.name}</div>
                        <div className="project-progress-mini">
                          <div className="progress-bar-mini" style={{ width: `${proj.progress}%` }}></div>
                        </div>
                        <span className="project-progress-text">{proj.progress}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="user-card-actions">
                <button
                  onClick={() => handleEdit(member)}
                  className="btn-edit"
                  title="Edit team member"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(member._id, member.name)}
                  className="btn-delete"
                  title="Manage this member in projects"
                >
                  🔗 View Projects
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View Alternative */}
      <div className="users-table-section">
        <h2 className="section-title">Team Members List</h2>
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(member => (
                <tr key={member._id} className="table-row">
                  <td className="name-cell">
                    <div className="name-cell-content">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="table-avatar" />
                      ) : (
                        <div className="table-avatar-placeholder">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{member.name}</span>
                    </div>
                  </td>
                  <td>{member.email}</td>
                  <td>
                    <span className={`role-badge-small ${getRoleColor(member.role)}`}>
                      {getRoleBadge(member.role)}
                    </span>
                  </td>
                  <td>
                    {member.createdAt 
                      ? new Date(member.createdAt).toLocaleDateString()
                      : 'N/A'
                    }
                  </td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleEdit(member)}
                      className="btn-small btn-edit-small"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(member._id, member.name)}
                      className="btn-small btn-delete-small"
                    >
                      Projects
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
