import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

export default function Sidebar({ onCreateProject }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const menuItems = [
    { icon: '📊', label: 'Dashboard', path: '/dashboard' },
    { icon: '💼', label: 'Projects', path: '/projects' },
    { icon: '📋', label: 'Tasks', path: '/tasks' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
    { icon: '⏰', label: 'Time log', path: '/time-log' },
    { icon: '👥', label: 'Resource mgnt', path: '/resources' },
    { icon: '👤', label: 'Users', path: '/users' },
    { icon: '📄', label: 'Project template', path: '/templates' },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className={`bg-gray-800 text-white transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      } min-h-screen flex flex-col`}
    >
      {/* Branding */}
      <div className="p-6 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-xl">
            
          </div>
          {!collapsed && <span className="text-xl font-bold">ProjectHub</span>}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
        >
          <span className="text-gray-300">{collapsed ? '→' : '←'}</span>
        </button>
      </div>

      {/* Create Project Button */}
      <div className="p-4">
        <button
          onClick={onCreateProject}
          className="w-full bg-white text-red-600 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
        >
          <span className="text-xl">+</span>
          {!collapsed && <span>Create new project</span>}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              isActive(item.path)
                ? 'bg-orange-500 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
}



