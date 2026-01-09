const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const ChatMessage = require('./models/ChatMessage');
const Project = require('./models/Project');

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
app.set('io', io);

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
    socket.userId = decoded.userId || decoded.id || decoded._id || decoded.user?.id || 'anonymous';
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
  socket.on('join-project', async (projectId) => {
    try {
      const project = await Project.findById(projectId).select('owner members');
      const userId = socket.user?.user?.id || socket.userId;
      const isOwner = project?.owner?.toString() === userId;
      const isMember = project?.members?.some((m) => m.user?.toString() === userId);
      if (!project || (!isOwner && !isMember)) {
        return socket.emit('chat:error', { message: 'Not authorized for this project' });
      }
      socket.join(`project-${projectId}`);
      console.log(`User ${socket.userId} joined project ${projectId}`);
      io.to(`project-${projectId}`).emit('user-joined', {
        userId: socket.userId,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('join-project error', err);
      socket.emit('chat:error', { message: 'Unable to join project' });
    }
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

  // Real-time chat message with persistence
  socket.on('chat:send', async (data) => {
    const { projectId, text, attachments = [] } = data || {};
    const userId = socket.user?.user?.id || socket.userId;
    if (!projectId || !text) return;

    try {
      const project = await Project.findById(projectId).select('owner members');
      const isOwner = project?.owner?.toString() === userId;
      const isMember = project?.members?.some((m) => m.user?.toString() === userId);
      if (!project || (!isOwner && !isMember)) {
        return socket.emit('chat:error', { message: 'Not authorized for this project' });
      }

      const message = await ChatMessage.create({
        project: projectId,
        sender: userId,
        text: text.trim(),
        attachments,
        readBy: [{ user: userId, readAt: new Date() }],
      });
      await message.populate('sender', 'name email');

      io.to(`project-${projectId}`).emit('chat:message', {
        _id: message._id,
        project: projectId,
        sender: message.sender,
        text: message.text,
        attachments: message.attachments,
        readBy: message.readBy,
        createdAt: message.createdAt,
      });
    } catch (err) {
      console.error('chat:send error', err);
      socket.emit('chat:error', { message: 'Unable to send message' });
    }
  });

  // Update chat message (owner only)
  socket.on('chat:update', async ({ projectId, messageId, text }) => {
    const userId = socket.user?.user?.id || socket.userId;
    if (!projectId || !messageId || !text) return;
    try {
      const project = await Project.findById(projectId).select('owner members');
      const isOwner = project?.owner?.toString() === userId;
      const isMember = project?.members?.some((m) => m.user?.toString() === userId);
      if (!project || (!isOwner && !isMember)) {
        return socket.emit('chat:error', { message: 'Not authorized for this project' });
      }

      const message = await ChatMessage.findOne({ _id: messageId, project: projectId });
      if (!message) return socket.emit('chat:error', { message: 'Message not found' });
      if (message.sender.toString() !== userId) {
        return socket.emit('chat:error', { message: 'You can only edit your messages' });
      }

      message.text = text.trim();
      message.editedAt = new Date();
      message.deletedAt = null;
      await message.save();
      await message.populate('sender', 'name email');

      io.to(`project-${projectId}`).emit('chat:updated', {
        _id: message._id,
        project: projectId,
        text: message.text,
        editedAt: message.editedAt,
        sender: message.sender,
        readBy: message.readBy,
        createdAt: message.createdAt,
        deletedAt: message.deletedAt,
      });
    } catch (err) {
      console.error('chat:update error', err);
      socket.emit('chat:error', { message: 'Unable to edit message' });
    }
  });

  // Delete chat message (owner only, soft delete)
  socket.on('chat:delete', async ({ projectId, messageId }) => {
    const userId = socket.user?.user?.id || socket.userId;
    if (!projectId || !messageId) return;
    try {
      const project = await Project.findById(projectId).select('owner members');
      const isOwner = project?.owner?.toString() === userId;
      const isMember = project?.members?.some((m) => m.user?.toString() === userId);
      if (!project || (!isOwner && !isMember)) {
        return socket.emit('chat:error', { message: 'Not authorized for this project' });
      }

      const message = await ChatMessage.findOne({ _id: messageId, project: projectId });
      if (!message) return socket.emit('chat:error', { message: 'Message not found' });
      if (message.sender.toString() !== userId) {
        return socket.emit('chat:error', { message: 'You can only delete your messages' });
      }

      message.text = 'This message was deleted';
      message.deletedAt = new Date();
      await message.save();

      io.to(`project-${projectId}`).emit('chat:deleted', {
        _id: message._id,
        project: projectId,
        deletedAt: message.deletedAt,
      });
    } catch (err) {
      console.error('chat:delete error', err);
      socket.emit('chat:error', { message: 'Unable to delete message' });
    }
  });

  // Typing indicator
  socket.on('chat:typing', ({ projectId, isTyping }) => {
    const userName = socket.user?.user?.name || 'User';
    io.to(`project-${projectId}`).emit('chat:typing', {
      userId: socket.userId,
      userName,
      isTyping: !!isTyping,
      projectId,
    });
  });

  // Read receipts
  socket.on('chat:read', async ({ projectId, messageIds = [] }) => {
    const userId = socket.user?.user?.id || socket.userId;
    if (!projectId || !Array.isArray(messageIds) || messageIds.length === 0) return;
    try {
      await ChatMessage.updateMany(
        { _id: { $in: messageIds }, project: projectId, 'readBy.user': { $ne: userId } },
        { $push: { readBy: { user: userId, readAt: new Date() } } }
      );
      io.to(`project-${projectId}`).emit('chat:read', {
        messageIds,
        userId,
        readAt: new Date(),
        projectId,
      });
    } catch (err) {
      console.error('chat:read error', err);
    }
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
app.use('/api/chat', require('./routes/chat'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Project Management System API' });
});

// Use a fixed port to avoid conflicts with global PORT env
const PORT = 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
