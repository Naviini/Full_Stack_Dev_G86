import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function UsersTailwind() {
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const projectsResponse = await fetch('http://localhost:5001/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!projectsResponse.ok) throw new Error('Failed to fetch projects');
      const projects = await projectsResponse.json();

      const membersMap = new Map();

      for (const project of projects) {
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

      membersMap.forEach(member => {
        const uniqueProjects = new Map();
        member.projects.forEach(proj => {
          if (!uniqueProjects.has(proj._id)) {
            uniqueProjects.set(proj._id, proj);
          }
        });
        member.projects = Array.from(uniqueProjects.values());
      });

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

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500">
        <div className="text-center">
          <div className="inline-block px-6 py-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
            <p className="text-white font-semibold">Loading team members...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 flex justify-between items-start shadow-2xl">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">👥 Team Members</h1>
          <p className="text-white/70">Manage your team members and roles</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 bg-white/15 hover:bg-white/25 border border-white/30 rounded-xl text-white font-semibold transition-all"
        >
          ← Back to Dashboard
        </button>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-xl text-red-200">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="🔍 Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:bg-white/15 focus:border-cyan-400 transition-all"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white focus:outline-none focus:bg-white/15 focus:border-cyan-400 transition-all"
        >
          <option value="all" className="bg-slate-800">All Roles</option>
          <option value="project-manager" className="bg-slate-800">📊 Project Manager</option>
          <option value="team-member" className="bg-slate-800">👤 Team Member</option>
        </select>
        <button
          onClick={() => navigate('/projects')}
          className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
        >
          + Add Members via Projects
        </button>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: teamMembers.length },
          { label: 'Showing', value: filteredMembers.length },
          { label: 'Project Managers', value: teamMembers.filter(m => m.role === 'project-manager').length },
          { label: 'Team Members', value: teamMembers.filter(m => m.role === 'team-member').length },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center">
            <p className="text-white/70 text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="max-w-7xl mx-auto text-center py-16">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-white/70">
            {searchTerm || filterRole !== 'all' 
              ? 'No team members match your search criteria' 
              : 'No team members found'}
          </p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map(member => (
            <div
              key={member._id}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all shadow-2xl"
            >
              {/* Member Header */}
              <div className="flex items-center gap-4 mb-4">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{member.name}</h3>
                  <p className="text-sm text-white/60">{member.email}</p>
                </div>
              </div>

              {/* Member Info */}
              <div className="mb-4 pb-4 border-b border-white/20">
                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold ${
                  member.role === 'project-manager'
                    ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50'
                    : 'bg-green-500/30 text-green-200 border border-green-400/50'
                }`}>
                  {member.role === 'project-manager' ? '📊 Project Manager' : '👤 Team Member'}
                </span>
                {member.createdAt && (
                  <p className="text-xs text-white/60 mt-2">
                    📅 Joined {new Date(member.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Projects Section */}
              {member.projects && member.projects.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-white/80 mb-3">📁 Projects ({member.projects.length})</p>
                  <div className="space-y-2">
                    {member.projects.map((proj, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{proj.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                              style={{ width: `${proj.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-white/80 min-w-fit">{proj.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
