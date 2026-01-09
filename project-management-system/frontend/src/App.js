import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { DarkModeProvider } from './context/DarkModeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Intro from './pages/Intro';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardModernTailwind from './pages/DashboardModernTailwind';
import ProjectDetail from './pages/ProjectDetail';
import Analytics from './pages/Analytics';
import UsersTailwind from './pages/UsersTailwind';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Search from './pages/Search';
import Documents from './pages/Documents';
import Settings from './pages/Settings';
import TimeLog from './pages/TimeLog';
import Resources from './pages/Resources';
import Templates from './pages/Templates';
import InvitationAcceptance from './pages/InvitationAcceptance';
import Chat from './pages/Chat';

// Google OAuth Client ID - Replace with your actual Google Client ID
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE';

// Warn if Google Client ID is not set
if (!process.env.REACT_APP_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
  console.warn('⚠️ Google OAuth Client ID not set! Google Sign-In will not work.');
  console.warn('Please create a .env file in the frontend folder with: REACT_APP_GOOGLE_CLIENT_ID=your_client_id');
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <DarkModeProvider>
        <Router>
          <AuthProvider>
            <Routes>
            <Route path="/" element={<Intro />} />
            <Route path="/login" element={<><Navbar /><Login /></>} />
            <Route path="/register" element={<><Navbar /><Register /></>} />
            <Route path="/invitations/:invitationId/:token" element={<InvitationAcceptance />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardModernTailwind /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
            <Route path="/projects/:projectId/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/projects/:projectId/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/time-log" element={<ProtectedRoute><TimeLog /></ProtectedRoute>} />
            <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><UsersTailwind /></ProtectedRoute>} />
            </Routes>
          </AuthProvider>
        </Router>
      </DarkModeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
