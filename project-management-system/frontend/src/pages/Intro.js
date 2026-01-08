import React from 'react';
import { Link } from 'react-router-dom';

const Intro = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6 bg-black bg-opacity-20 backdrop-blur-md">
        <div className="text-white text-2xl font-bold flex items-center gap-2">
          <span className="text-3xl">📊</span>
          <span>ProjectHub</span>
        </div>
        <div className="flex gap-4">
          <Link
            to="/login"
            className="px-6 py-2 text-white hover:bg-white hover:text-blue-600 rounded-lg transition duration-300"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-6 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition duration-300"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Manage Projects Like a Pro
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Streamline your project management with real-time collaboration, advanced analytics, and seamless team coordination.
            </p>
            <div className="flex gap-4 pt-4">
              <Link
                to="/register"
                className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition duration-300 shadow-lg"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition duration-300"
              >
                Demo →
              </Link>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative">
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-20 shadow-2xl transform hover:scale-105 transition duration-300">
              <div className="space-y-4">
                <div className="h-3 bg-blue-300 rounded-full w-24"></div>
                <div className="h-3 bg-blue-300 rounded-full w-32"></div>
                <div className="mt-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-2 bg-blue-300 rounded-full w-24"></div>
                        <div className="h-2 bg-blue-300 rounded-full w-32 opacity-60"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-8 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-16">
          Powerful Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: '⚡',
              title: 'Real-Time Collaboration',
              desc: 'Work together seamlessly with instant updates and live messaging'
            },
            {
              icon: '📈',
              title: 'Advanced Analytics',
              desc: 'Gain insights with comprehensive project metrics and reports'
            },
            {
              icon: '👥',
              title: 'Team Management',
              desc: 'Invite, manage, and track your team members efficiently'
            },
            {
              icon: '📋',
              title: 'Task Management',
              desc: 'Organize tasks, set priorities, and track progress easily'
            },
            {
              icon: '💰',
              title: 'Cost Tracking',
              desc: 'Monitor budgets and manage project expenses in real-time'
            },
            {
              icon: '🎯',
              title: 'Goal Setting',
              desc: 'Define objectives and measure success with clear metrics'
            }
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20 hover:bg-opacity-20 transition duration-300"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-blue-100">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-6xl mx-auto px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { number: '10K+', label: 'Active Users' },
            { number: '50K+', label: 'Projects' },
            { number: '99.9%', label: 'Uptime' },
            { number: '24/7', label: 'Support' }
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-4xl font-bold text-white mb-2">
                {stat.number}
              </div>
              <div className="text-blue-100">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-8 py-20 text-center">
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-12 border border-white border-opacity-20">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of teams using ProjectHub to manage projects effectively
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/register"
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition duration-300"
            >
              Start Free Trial
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition duration-300"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white border-opacity-20 py-8">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-blue-100 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-blue-100 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-blue-100 text-sm">
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-blue-100 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white border-opacity-20 pt-8 text-center text-blue-100">
            <p>&copy; 2025 ProjectHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Intro;
