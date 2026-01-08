import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/OverallProgressChart.css';

export default function OverallProgressChart({ projectId }) {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProgressData();
  }, [projectId]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch project data
      const projectResponse = await axios.get(
        `http://localhost:5001/api/projects/${projectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const project = projectResponse.data;

      // Fetch project tasks
      const tasksResponse = await axios.get(
        `http://localhost:5001/api/tasks/project/${projectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const tasks = tasksResponse.data;

      // Calculate accurate progress metrics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
      const reviewTasks = tasks.filter(t => t.status === 'review').length;
      const todoTasks = tasks.filter(t => t.status === 'todo').length;

      // Calculate weighted progress (task-based)
      const taskBasedProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

      // Calculate timeline progress
      const projectStart = new Date(project.startDate);
      const projectEnd = new Date(project.endDate);
      const today = new Date();
      const totalDuration = projectEnd - projectStart;
      const elapsedDuration = today - projectStart;
      const timelineProgress = Math.max(0, Math.min(100, Math.round((elapsedDuration / totalDuration) * 100)));

      // Calculate budget progress
      const budgetProgress = project.budget.estimated === 0 
        ? 0 
        : Math.round((project.budget.actual / project.budget.estimated) * 100);

      // Calculate overall project progress
      const overallProgress = Math.round((taskBasedProgress + timelineProgress) / 2);

      // Time tracking
      const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
      const totalActualHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

      // Risk metrics
      const highPriorityTasks = tasks.filter(t => t.priority === 'high' || t.priority === 'critical').length;
      const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
      const blockedTasks = tasks.filter(t => t.status === 'blocked' || t.status === 'review').length;

      setProgressData({
        projectName: project.name,
        projectStatus: project.status,
        
        // Overall metrics
        overallProgress,
        taskBasedProgress,
        timelineProgress,
        budgetProgress,
        
        // Task breakdown
        totalTasks,
        completedTasks,
        inProgressTasks,
        reviewTasks,
        todoTasks,
        blockedTasks,
        
        // Time metrics
        totalEstimatedHours: totalEstimatedHours.toFixed(1),
        totalActualHours: totalActualHours.toFixed(1),
        timeVariance: (totalActualHours - totalEstimatedHours).toFixed(1),
        
        // Budget metrics
        estimatedBudget: project.budget.estimated,
        actualBudget: project.budget.actual,
        budgetVariance: project.budget.actual - project.budget.estimated,
        
        // Risk metrics
        highPriorityTasks,
        overdueTasks,
        
        // Dates
        startDate: new Date(project.startDate).toLocaleDateString(),
        endDate: new Date(project.endDate).toLocaleDateString(),
        daysElapsed: Math.floor(elapsedDuration / (1000 * 60 * 60 * 24)),
        totalDays: Math.floor(totalDuration / (1000 * 60 * 60 * 24)),
      });

      setError('');
    } catch (err) {
      console.error('Error fetching progress data:', err);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#10b981'; // Green
    if (progress >= 50) return '#f59e0b'; // Amber
    if (progress >= 20) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getStatusColor = (status) => {
    const colors = {
      'planning': '#9333ea',
      'active': '#3b82f6',
      'completed': '#10b981',
      'on-hold': '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const renderProgressBar = (label, progress, color, showPercentage = true) => (
    <div className="progress-item">
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        {showPercentage && <span className="progress-value">{progress}%</span>}
      </div>
      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: color || getProgressColor(progress),
          }}
        />
      </div>
    </div>
  );

  if (loading) {
    return <div className="progress-chart loading">📊 Loading progress data...</div>;
  }

  if (error) {
    return <div className="progress-chart error">❌ {error}</div>;
  }

  if (!progressData) {
    return <div className="progress-chart">No progress data available</div>;
  }

  return (
    <div className="progress-chart">
      {/* Overall Progress Section */}
      <div className="progress-section overall-section">
        <h2 className="section-title">📊 Overall Project Progress</h2>
        
        <div className="progress-grid-2">
          <div className="progress-box">
            <div className="big-number" style={{ color: getProgressColor(progressData.overallProgress) }}>
              {progressData.overallProgress}%
            </div>
            <p className="big-label">Project Complete</p>
            <p className="status-badge" style={{ backgroundColor: getStatusColor(progressData.projectStatus) }}>
              {progressData.projectStatus.toUpperCase()}
            </p>
          </div>

          <div className="timeline-info">
            <p className="timeline-stat">
              <span className="timeline-label">📅 Timeline</span>
              <span className="timeline-value">{progressData.daysElapsed} / {progressData.totalDays} days</span>
            </p>
            <p className="timeline-stat">
              <span className="timeline-label">🚀 Start</span>
              <span className="timeline-value">{progressData.startDate}</span>
            </p>
            <p className="timeline-stat">
              <span className="timeline-label">🏁 End</span>
              <span className="timeline-value">{progressData.endDate}</span>
            </p>
          </div>
        </div>

        {/* Main Progress Bars */}
        <div className="progress-section-content">
          {renderProgressBar('Task Completion', progressData.taskBasedProgress, getProgressColor(progressData.taskBasedProgress))}
          {renderProgressBar('Timeline Progress', progressData.timelineProgress, getProgressColor(progressData.timelineProgress))}
          {renderProgressBar('Budget Usage', Math.min(progressData.budgetProgress, 100), getProgressColor(Math.min(progressData.budgetProgress, 100)))}
        </div>
      </div>

      {/* Task Status Breakdown */}
      <div className="progress-section">
        <h3 className="section-title">📋 Task Status Breakdown</h3>
        
        <div className="status-grid">
          <div className="status-card todo">
            <div className="status-number">{progressData.todoTasks}</div>
            <div className="status-name">To Do</div>
            <div className="status-percent">
              {progressData.totalTasks > 0 ? Math.round((progressData.todoTasks / progressData.totalTasks) * 100) : 0}%
            </div>
          </div>

          <div className="status-card inprogress">
            <div className="status-number">{progressData.inProgressTasks}</div>
            <div className="status-name">In Progress</div>
            <div className="status-percent">
              {progressData.totalTasks > 0 ? Math.round((progressData.inProgressTasks / progressData.totalTasks) * 100) : 0}%
            </div>
          </div>

          <div className="status-card review">
            <div className="status-number">{progressData.reviewTasks}</div>
            <div className="status-name">Review</div>
            <div className="status-percent">
              {progressData.totalTasks > 0 ? Math.round((progressData.reviewTasks / progressData.totalTasks) * 100) : 0}%
            </div>
          </div>

          <div className="status-card completed">
            <div className="status-number">{progressData.completedTasks}</div>
            <div className="status-name">Completed</div>
            <div className="status-percent">
              {progressData.totalTasks > 0 ? Math.round((progressData.completedTasks / progressData.totalTasks) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Time Tracking Section */}
      <div className="progress-section">
        <h3 className="section-title">⏱️ Time Tracking</h3>
        
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Estimated Hours</div>
            <div className="metric-value">{progressData.totalEstimatedHours}h</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Actual Hours</div>
            <div className="metric-value">{progressData.totalActualHours}h</div>
          </div>

          <div className={`metric-card ${parseFloat(progressData.timeVariance) > 0 ? 'variance-over' : 'variance-under'}`}>
            <div className="metric-label">Time Variance</div>
            <div className="metric-value">
              {parseFloat(progressData.timeVariance) > 0 ? '+' : ''}{progressData.timeVariance}h
            </div>
          </div>
        </div>
      </div>

      {/* Budget Section */}
      <div className="progress-section">
        <h3 className="section-title">💰 Budget Analysis</h3>
        
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Estimated Budget</div>
            <div className="metric-value">${progressData.estimatedBudget.toLocaleString()}</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Actual Spending</div>
            <div className="metric-value">${progressData.actualBudget.toLocaleString()}</div>
          </div>

          <div className={`metric-card ${progressData.budgetVariance > 0 ? 'variance-over' : 'variance-under'}`}>
            <div className="metric-label">Budget Variance</div>
            <div className="metric-value">
              {progressData.budgetVariance > 0 ? '+' : ''}${progressData.budgetVariance.toLocaleString()}
            </div>
          </div>
        </div>

        {progressData.budgetProgress > 100 && (
          <div className="alert-warning">
            ⚠️ Budget has exceeded by {progressData.budgetProgress - 100}%
          </div>
        )}
      </div>

      {/* Risk Indicators */}
      <div className="progress-section">
        <h3 className="section-title">⚠️ Risk Indicators</h3>
        
        <div className="risk-grid">
          <div className={`risk-card ${progressData.highPriorityTasks > 0 ? 'risk-high' : 'risk-low'}`}>
            <div className="risk-icon">🔴</div>
            <div className="risk-label">High Priority Tasks</div>
            <div className="risk-count">{progressData.highPriorityTasks}</div>
          </div>

          <div className={`risk-card ${progressData.overdueTasks > 0 ? 'risk-high' : 'risk-low'}`}>
            <div className="risk-icon">⏰</div>
            <div className="risk-label">Overdue Tasks</div>
            <div className="risk-count">{progressData.overdueTasks}</div>
          </div>

          <div className={`risk-card ${progressData.blockedTasks > 0 ? 'risk-medium' : 'risk-low'}`}>
            <div className="risk-icon">🚫</div>
            <div className="risk-label">Blocked Tasks</div>
            <div className="risk-count">{progressData.blockedTasks}</div>
          </div>

          <div className="risk-card risk-info">
            <div className="risk-icon">📊</div>
            <div className="risk-label">Total Tasks</div>
            <div className="risk-count">{progressData.totalTasks}</div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="progress-summary">
        <p className="summary-text">
          ✅ <strong>{progressData.completedTasks}</strong> tasks completed out of <strong>{progressData.totalTasks}</strong> total tasks
        </p>
        <p className="summary-text">
          ⏱️ <strong>{progressData.daysElapsed}</strong> days elapsed out of <strong>{progressData.totalDays}</strong> total project days
        </p>
        <p className="summary-text">
          💰 Spent <strong>${progressData.actualBudget.toLocaleString()}</strong> of <strong>${progressData.estimatedBudget.toLocaleString()}</strong> budget
        </p>
      </div>
    </div>
  );
}
