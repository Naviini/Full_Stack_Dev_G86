import React, { useState, useEffect, useContext } from 'react';
import { DarkModeContext } from '../context/DarkModeContext';

export default function Documents() {
  const { isDarkMode } = useContext(DarkModeContext);
  const [documents, setDocuments] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    category: 'general',
    description: '',
    tags: [],
  });
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // Sample documents data
  const sampleDocuments = [
    {
      id: 1,
      title: 'Project Charter',
      category: 'planning',
      description: 'Initial project scope and objectives',
      uploadedBy: 'John Doe',
      uploadedDate: new Date('2024-12-20'),
      size: '2.3 MB',
      type: 'PDF',
      downloads: 12,
      tags: ['project', 'charter'],
      shared: true,
      icon: '📄',
    },
    {
      id: 2,
      title: 'Resource Allocation Plan',
      category: 'resource',
      description: 'Team resources and capacity planning',
      uploadedBy: 'Jane Smith',
      uploadedDate: new Date('2024-12-18'),
      size: '1.8 MB',
      type: 'Excel',
      downloads: 8,
      tags: ['resources', 'planning'],
      shared: true,
      icon: '📊',
    },
    {
      id: 3,
      title: 'Budget Report Q4',
      category: 'finance',
      description: 'Q4 budget breakdown and analysis',
      uploadedBy: 'Mike Johnson',
      uploadedDate: new Date('2024-12-15'),
      size: '0.9 MB',
      type: 'PDF',
      downloads: 15,
      tags: ['budget', 'finance'],
      shared: false,
      icon: '💰',
    },
    {
      id: 4,
      title: 'Meeting Minutes - Dec 2024',
      category: 'communication',
      description: 'Monthly team meeting notes',
      uploadedBy: 'Sarah Wilson',
      uploadedDate: new Date('2024-12-10'),
      size: '0.5 MB',
      type: 'Word',
      downloads: 5,
      tags: ['meeting', 'notes'],
      shared: true,
      icon: '📝',
    },
  ];

  useEffect(() => {
    setDocuments(sampleDocuments);
  }, []);

  useEffect(() => {
    let filtered = documents;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === filterCategory);
    }

    setFilteredDocs(filtered);
  }, [searchTerm, filterCategory, documents]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadData({ ...uploadData, title: file.name.split('.')[0] });
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setUploadData({
        ...uploadData,
        tags: [...uploadData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (index) => {
    setUploadData({
      ...uploadData,
      tags: uploadData.tags.filter((_, i) => i !== index),
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !uploadData.title) {
      alert('Please select a file and enter a title');
      return;
    }

    setUploading(true);
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newDoc = {
        id: documents.length + 1,
        title: uploadData.title,
        category: uploadData.category,
        description: uploadData.description,
        uploadedBy: 'Current User',
        uploadedDate: new Date(),
        size: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
        type: selectedFile.type.split('/')[1]?.toUpperCase() || 'File',
        downloads: 0,
        tags: uploadData.tags,
        shared: false,
        icon: '📄',
      };

      setDocuments([newDoc, ...documents]);
      setUploadData({
        title: '',
        category: 'general',
        description: '',
        tags: [],
      });
      setSelectedFile(null);
      setShowUploadModal(false);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (docId) => {
    const doc = documents.find(d => d.id === docId);
    if (doc) {
      const updated = documents.map(d =>
        d.id === docId ? { ...d, downloads: d.downloads + 1 } : d
      );
      setDocuments(updated);
      alert(`Downloading: ${doc.title}`);
    }
  };

  const handleDelete = (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      setDocuments(documents.filter(d => d.id !== docId));
    }
  };

  const handleToggleSelection = (docId) => {
    setSelectedDocs(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const getFileIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return '📕';
      case 'excel':
      case 'spreadsheet':
        return '📊';
      case 'word':
        return '📗';
      case 'presentation':
        return '🎨';
      case 'image':
        return '🖼️';
      case 'video':
        return '🎬';
      default:
        return '📄';
    }
  };

  const categories = [
    { id: 'all', label: 'All Documents', icon: '📋' },
    { id: 'planning', label: 'Planning', icon: '📋' },
    { id: 'resource', label: 'Resources', icon: '👥' },
    { id: 'finance', label: 'Finance', icon: '💰' },
    { id: 'communication', label: 'Communication', icon: '💬' },
    { id: 'general', label: 'General', icon: '📄' },
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`} style={{ fontFamily: 'Urbanist, sans-serif' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              📁 Document Management
            </h1>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Organize, share, and manage project documents and files
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#FF6523] to-[#9C4CE0] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            + Upload Document
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#FF6523]/20'} border rounded-xl p-6`}>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Total Docs</p>
            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{documents.length}</p>
          </div>
          <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#FF6523]/20'} border rounded-xl p-6`}>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Shared</p>
            <p className={`text-3xl font-bold text-[#FF6523]`}>{documents.filter(d => d.shared).length}</p>
          </div>
          <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#FF6523]/20'} border rounded-xl p-6`}>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Total Downloads</p>
            <p className={`text-3xl font-bold text-blue-600`}>{documents.reduce((sum, d) => sum + d.downloads, 0)}</p>
          </div>
          <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#FF6523]/20'} border rounded-xl p-6`}>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Latest Upload</p>
            <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {documents.length > 0 ? new Date(documents[0].uploadedDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#FF6523]/20'} border rounded-2xl p-6 mb-6`}>
          <input
            type="text"
            placeholder="Search documents, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border mb-4 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 placeholder-gray-500'} focus:outline-none focus:border-[#FF6523]`}
          />

          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterCategory === cat.id
                    ? 'bg-gradient-to-r from-[#FF6523] to-[#9C4CE0] text-white'
                    : isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map(doc => (
              <div
                key={doc.id}
                className={`${isDarkMode ? 'bg-gray-900 border-gray-700 hover:bg-gray-800' : 'bg-white border-gray-200 hover:bg-gray-50'} border rounded-2xl p-6 transition-all shadow-lg hover:shadow-xl`}
              >
                {/* Checkbox */}
                <div className="flex items-start justify-between mb-4">
                  <input
                    type="checkbox"
                    checked={selectedDocs.includes(doc.id)}
                    onChange={() => handleToggleSelection(doc.id)}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <div className="text-3xl">{getFileIcon(doc.type)}</div>
                </div>

                {/* Content */}
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2 truncate`}>
                  {doc.title}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4 line-clamp-2`}>
                  {doc.description}
                </p>

                {/* Tags */}
                {doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {doc.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-[#FF6523]/20 text-[#FF6523]' : 'bg-[#FF6523]/10 text-[#FF6523]'}`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Metadata */}
                <div className={`text-xs ${isDarkMode ? 'text-gray-400 border-gray-700' : 'text-gray-600 border-gray-200'} border-t pt-4 mb-4`}>
                  <p>📤 By {doc.uploadedBy}</p>
                  <p>📅 {doc.uploadedDate.toLocaleDateString()}</p>
                  <p>💾 {doc.size}</p>
                  <p>⬇️ {doc.downloads} downloads</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(doc.id)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${isDarkMode ? 'bg-blue-900/30 hover:bg-blue-900/50 text-blue-400' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`}
                  >
                    ⬇️ Download
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${isDarkMode ? 'bg-red-900/20 hover:bg-red-900/30 text-red-400' : 'bg-red-100/50 hover:bg-red-100 text-red-700'}`}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-12 rounded-xl ${isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No documents found. Upload one to get started!
            </p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl max-w-2xl w-full`}
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  📤 Upload Document
                </h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-3xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-6">
                {/* File Upload */}
                <div>
                  <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Select File *
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      isDarkMode
                        ? 'border-gray-700 hover:border-[#FF6523] hover:bg-gray-800/50'
                        : 'border-gray-300 hover:border-[#FF6523] hover:bg-gray-50'
                    }`}
                    onClick={() => document.getElementById('file-input').click()}
                  >
                    {selectedFile ? (
                      <>
                        <p className={`text-3xl mb-2`}>{getFileIcon(selectedFile.type)}</p>
                        <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedFile.name}
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-4xl mb-2">📁</p>
                        <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Drop your file here or click to browse
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    id="file-input"
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Title */}
                <input
                  type="text"
                  placeholder="Document Title *"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:border-[#FF6523]`}
                  required
                />

                {/* Category */}
                <select
                  value={uploadData.category}
                  onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none`}
                >
                  <option value="general">General</option>
                  <option value="planning">Planning</option>
                  <option value="resource">Resources</option>
                  <option value="finance">Finance</option>
                  <option value="communication">Communication</option>
                </select>

                {/* Description */}
                <textarea
                  placeholder="Description (optional)"
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none focus:border-[#FF6523]`}
                  rows="3"
                />

                {/* Tags */}
                <div>
                  <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Tags (optional)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className={`flex-1 px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'} focus:outline-none`}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-[#FF6523] text-white rounded-lg hover:bg-[#E55610] transition-all"
                    >
                      Add
                    </button>
                  </div>
                  {uploadData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {uploadData.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-[#FF6523]/20 text-[#FF6523]' : 'bg-[#FF6523]/10 text-[#FF6523]'} flex items-center gap-2`}
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(idx)}
                            className="hover:opacity-70"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FF6523] to-[#9C4CE0] text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {uploading ? '⏳ Uploading...' : '✓ Upload Document'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className={`flex-1 px-6 py-3 rounded-xl font-semibold ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
