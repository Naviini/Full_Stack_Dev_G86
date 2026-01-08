const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// WebSocket Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Handle different possible field names for user ID
    socket.userId = decoded.userId || decoded.id || decoded._id || 'anonymous';
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// WebSocket Connection Handler
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected with socket ID: ${socket.id}`);

  // Join a project room for real-time updates
  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
    console.log(`User ${socket.userId} joined project ${projectId}`);
    io.to(`project-${projectId}`).emit('user-joined', {
      userId: socket.userId,
      timestamp: new Date(),
    });
  });

  // Leave a project room
  socket.on('leave-project', (projectId) => {
    socket.leave(`project-${projectId}`);
    console.log(`User ${socket.userId} left project ${projectId}`);
    io.to(`project-${projectId}`).emit('user-left', {
      userId: socket.userId,
      timestamp: new Date(),
    });
  });

  // Real-time task update
  socket.on('task-updated', (data) => {
    io.to(`project-${data.projectId}`).emit('task-update-notification', {
      taskId: data.taskId,
      updatedBy: socket.userId,
      changes: data.changes,
      timestamp: new Date(),
    });
  });

  // Real-time collaboration message
  socket.on('collaboration-message', (data) => {
    io.to(`project-${data.projectId}`).emit('new-message', {
      userId: socket.userId,
      message: data.message,
      projectId: data.projectId,
      timestamp: new Date(),
    });
  });

  // Real-time project status update
  socket.on('project-status-changed', (data) => {
    io.to(`project-${data.projectId}`).emit('project-status-update', {
      projectId: data.projectId,
      newStatus: data.status,
      updatedBy: socket.userId,
      timestamp: new Date(),
    });
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/milestones', require('./routes/milestones'));
app.use('/api', require('./routes/goals'));
app.use('/api', require('./routes/scope'));
app.use('/api', require('./routes/resources'));
app.use('/api/cost', require('./routes/cost'));
app.use('/api/quality', require('./routes/quality'));
app.use('/api/collaboration', require('./routes/collaboration'));
app.use('/api/planning', require('./routes/planning'));
app.use('/api/invitations', require('./routes/invitations'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Project Management System API' });
});

// Use a fixed port to avoid conflicts with global PORT env
const PORT = 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
