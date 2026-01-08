import React, { useState, useEffect } from 'react';
import { collaborationAPI } from '../services/api';
import '../styles/Collaboration.css';

const Collaboration = ({ projectId }) => {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    type: 'message',
    title: '',
    content: '',
    category: 'general',
    priority: 'normal',
    tags: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [projectId, filterType]);

  const fetchItems = async () => {
    try {
      const response = await collaborationAPI.getItems(projectId, filterType === 'all' ? null : filterType);
      setItems(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching collaboration items:', error);
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
    try {
      const data = {
        ...formData,
        project: projectId,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      };

      if (editingId) {
        await collaborationAPI.updateItem(editingId, data);
      } else {
        await collaborationAPI.createItem(data);
      }

      setFormData({
        type: 'message',
        title: '',
        content: '',
        category: 'general',
        priority: 'normal',
        tags: '',
      });
      setEditingId(null);
      setShowForm(false);
      fetchItems();
    } catch (error) {
      console.error('Error saving collaboration item:', error);
    }
  };

  const handleAddReply = async (itemId) => {
    if (!replyContent.trim()) return;

    try {
      await collaborationAPI.addReply(itemId, {
        content: replyContent,
      });
      setReplyContent('');
      setReplyingTo(null);
      fetchItems();
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const handleLike = async (itemId) => {
    try {
      await collaborationAPI.likeItem(itemId);
      fetchItems();
    } catch (error) {
      console.error('Error liking item:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await collaborationAPI.deleteItem(id);
        fetchItems();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const handlePin = async (id) => {
    try {
      await collaborationAPI.pinItem(id);
      fetchItems();
    } catch (error) {
      console.error('Error pinning item:', error);
    }
  };

  if (loading) return <div>Loading collaboration...</div>;

  const getPriorityColor = (priority) => {
    const colors = { low: '#90EE90', normal: '#87CEEB', high: '#FFB6C1', urgent: '#FF6347' };
    return colors[priority] || '#87CEEB';
  };

  return (
    <div className="collaboration">
      <div className="collab-header">
        <h2>💬 Collaboration & Communication</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Discussion'}
        </button>
      </div>

      <div className="collab-filters">
        <button
          className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filterType === 'message' ? 'active' : ''}`}
          onClick={() => setFilterType('message')}
        >
          Messages
        </button>
        <button
          className={`filter-btn ${filterType === 'discussion' ? 'active' : ''}`}
          onClick={() => setFilterType('discussion')}
        >
          Discussions
        </button>
        <button
          className={`filter-btn ${filterType === 'announcement' ? 'active' : ''}`}
          onClick={() => setFilterType('announcement')}
        >
          Announcements
        </button>
        <button
          className={`filter-btn ${filterType === 'file-share' ? 'active' : ''}`}
          onClick={() => setFilterType('file-share')}
        >
          File Sharing
        </button>
      </div>

      {showForm && (
        <form className="collab-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select name="type" value={formData.type} onChange={handleInputChange}>
                <option value="message">Message</option>
                <option value="discussion">Discussion</option>
                <option value="announcement">Announcement</option>
                <option value="file-share">File Share</option>
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange}>
                <option value="general">General</option>
                <option value="technical">Technical</option>
                <option value="decision">Decision</option>
                <option value="documentation">Documentation</option>
              </select>
            </div>
          </div>

          {(formData.type === 'discussion' || formData.type === 'announcement') && (
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter title"
              />
            </div>
          )}

          <div className="form-group">
            <label>Content</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Enter your message or content"
              rows="5"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleInputChange}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="e.g., design, review, urgent"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary">
            {editingId ? 'Update' : 'Post'}
          </button>
        </form>
      )}

      <div className="collab-items">
        {items.map(item => (
          <div key={item._id} className={`collab-item ${item.pinned ? 'pinned' : ''}`}>
            <div className="item-header">
              <div>
                <h4>{item.title || item.type}</h4>
                <span className="item-type">{item.type}</span>
                <span
                  className="priority-badge"
                  style={{ backgroundColor: getPriorityColor(item.priority) }}
                >
                  {item.priority}
                </span>
              </div>
              <div className="item-meta">
                <span className="author">{item.author?.name}</span>
                <span className="date">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="item-content">
              <p>{item.content}</p>
              {item.tags.length > 0 && (
                <div className="tags">
                  {item.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="item-actions">
              <button
                className="action-btn"
                onClick={() => handleLike(item._id)}
                title="Like"
              >
                👍 {item.likes.length}
              </button>
              <button
                className="action-btn"
                onClick={() => setReplyingTo(replyingTo === item._id ? null : item._id)}
              >
                💬 {item.replies.length} replies
              </button>
              <button
                className="action-btn"
                onClick={() => handlePin(item._id)}
                title="Pin"
              >
                {item.pinned ? '📌 Pinned' : '📌 Pin'}
              </button>
              <button
                className="action-btn delete"
                onClick={() => handleDelete(item._id)}
              >
                🗑️
              </button>
            </div>

            {item.replies.length > 0 && (
              <div className="replies">
                {item.replies.map(reply => (
                  <div key={reply._id} className="reply">
                    <strong>{reply.author?.name}:</strong>
                    <p>{reply.content}</p>
                    <span className="reply-date">{new Date(reply.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}

            {replyingTo === item._id && (
              <div className="reply-form">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  rows="2"
                />
                <div>
                  <button
                    className="btn-primary"
                    onClick={() => handleAddReply(item._id)}
                  >
                    Post Reply
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Collaboration;
