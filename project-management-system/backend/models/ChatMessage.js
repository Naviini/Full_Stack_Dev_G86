const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  editedAt: Date,
  deletedAt: Date,
  type: {
    type: String,
    enum: ['text'],
    default: 'text',
  },
  attachments: [
    {
      name: String,
      url: String,
    },
  ],
  readBy: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);

