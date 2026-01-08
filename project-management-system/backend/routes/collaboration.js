const express = require('express');
const router = express.Router();
const Collaboration = require('../models/Collaboration');
const auth = require('../middleware/auth');

// Get all collaboration items for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { type, category, status } = req.query;
    const query = { project: req.params.projectId };

    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.status = status;

    const items = await Collaboration.find(query)
      .populate('author', 'name email avatar')
      .populate('mentions', 'name email avatar')
      .populate('replies.author', 'name email avatar')
      .populate('likes', 'name email')
      .sort({ pinned: -1, createdAt: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create collaboration item
router.post('/', auth, async (req, res) => {
  const collaboration = new Collaboration({
    ...req.body,
    author: req.user.id,
  });

  try {
    const newItem = await collaboration.save();
    await newItem.populate('author', 'name email avatar');
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get single collaboration item with replies
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await Collaboration.findById(req.params.id)
      .populate('author', 'name email avatar')
      .populate('mentions', 'name email avatar')
      .populate('replies.author', 'name email avatar')
      .populate('likes', 'name email');

    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Mark as viewed
    const viewer = item.viewers.find(v => v.user.toString() === req.user.id);
    if (!viewer) {
      item.viewers.push({ user: req.user.id, viewedAt: Date.now() });
      await item.save();
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update collaboration item
router.put('/:id', auth, async (req, res) => {
  try {
    const item = await Collaboration.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Only author can edit
    if (item.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(item, req.body);
    item.updatedAt = Date.now();

    const updated = await item.save();
    await updated.populate(['author', 'mentions', 'replies.author', 'likes']);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add reply
router.post('/:id/replies', auth, async (req, res) => {
  try {
    const item = await Collaboration.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const reply = {
      _id: require('mongoose').Types.ObjectId(),
      author: req.user.id,
      content: req.body.content,
      attachments: req.body.attachments || [],
    };

    item.replies.push(reply);
    item.updatedAt = Date.now();

    const updated = await item.save();
    await updated.populate(['author', 'replies.author', 'mentions']);
    res.status(201).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Like collaboration item
router.post('/:id/like', auth, async (req, res) => {
  try {
    const item = await Collaboration.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const alreadyLiked = item.likes.includes(req.user.id);
    if (alreadyLiked) {
      item.likes = item.likes.filter(id => id.toString() !== req.user.id);
    } else {
      item.likes.push(req.user.id);
    }

    const updated = await item.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Pin/Unpin collaboration item
router.patch('/:id/pin', auth, async (req, res) => {
  try {
    const item = await Collaboration.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.pinned = !item.pinned;
    item.updatedAt = Date.now();

    const updated = await item.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete collaboration item
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Collaboration.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Only author can delete
    if (item.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Collaboration.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
