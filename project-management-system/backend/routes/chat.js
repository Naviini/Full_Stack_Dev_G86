const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// Helper: ensure the requesting user is part of the project
const ensureMembership = async (projectId, userId) => {
  const project = await Project.findById(projectId).select('owner members');
  if (!project) return { ok: false, status: 404, message: 'Project not found' };

  const isOwner = project.owner?.toString() === userId;
  const isMember = project.members?.some((m) => m.user?.toString() === userId);

  if (!isOwner && !isMember) {
    return { ok: false, status: 403, message: 'Not authorized for this project chat' };
  }

  return { ok: true, project };
};

// GET latest messages for a project
router.get('/project/:projectId/messages', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.user.id;

    const membership = await ensureMembership(projectId, userId);
    if (!membership.ok) {
      return res.status(membership.status).json({ message: membership.message });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

    const messages = await ChatMessage.find({ project: projectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'name email')
      .lean();

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST new message
router.post('/project/:projectId/messages', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.user.id;
    const { text, attachments = [] } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const membership = await ensureMembership(projectId, userId);
    if (!membership.ok) {
      return res.status(membership.status).json({ message: membership.message });
    }

    const message = await ChatMessage.create({
      project: projectId,
      sender: userId,
      text: text.trim(),
      attachments,
      readBy: [{ user: userId, readAt: new Date() }],
    });

    await message.populate('sender', 'name email');

    // Emit over websocket if available
    const io = req.app.get('io');
    if (io) {
      io.to(`project-${projectId}`).emit('chat:message', {
        _id: message._id,
        project: projectId,
        sender: message.sender,
        text: message.text,
        attachments: message.attachments,
        readBy: message.readBy,
        createdAt: message.createdAt,
      });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Create chat message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH edit message (owner only)
router.patch('/project/:projectId/messages/:messageId', auth, async (req, res) => {
  try {
    const { projectId, messageId } = req.params;
    const userId = req.user.user.id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const membership = await ensureMembership(projectId, userId);
    if (!membership.ok) {
      return res.status(membership.status).json({ message: membership.message });
    }

    const message = await ChatMessage.findOne({ _id: messageId, project: projectId });
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: 'You can only edit your messages' });
    }

    message.text = text.trim();
    message.editedAt = new Date();
    message.deletedAt = null;
    await message.save();
    await message.populate('sender', 'name email');

    const io = req.app.get('io');
    if (io) {
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
    }

    res.json(message);
  } catch (error) {
    console.error('Edit chat message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE (soft) message (owner only)
router.delete('/project/:projectId/messages/:messageId', auth, async (req, res) => {
  try {
    const { projectId, messageId } = req.params;
    const userId = req.user.user.id;

    const membership = await ensureMembership(projectId, userId);
    if (!membership.ok) {
      return res.status(membership.status).json({ message: membership.message });
    }

    const message = await ChatMessage.findOne({ _id: messageId, project: projectId });
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: 'You can only delete your messages' });
    }

    message.text = 'This message was deleted';
    message.deletedAt = new Date();
    await message.save();
    await message.populate('sender', 'name email');

    const io = req.app.get('io');
    if (io) {
      io.to(`project-${projectId}`).emit('chat:deleted', {
        _id: message._id,
        project: projectId,
        deletedAt: message.deletedAt,
      });
    }

    res.json(message);
  } catch (error) {
    console.error('Delete chat message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST read receipts for given messages
router.post('/project/:projectId/read', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.user.id;
    const { messageIds = [] } = req.body;

    const membership = await ensureMembership(projectId, userId);
    if (!membership.ok) {
      return res.status(membership.status).json({ message: membership.message });
    }

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.json({ updated: 0 });
    }

    const result = await ChatMessage.updateMany(
      { _id: { $in: messageIds }, project: projectId, 'readBy.user': { $ne: userId } },
      { $push: { readBy: { user: userId, readAt: new Date() } } }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`project-${projectId}`).emit('chat:read', {
        messageIds,
        userId,
        readAt: new Date(),
      });
    }

    res.json({ updated: result.modifiedCount });
  } catch (error) {
    console.error('Read receipt error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

