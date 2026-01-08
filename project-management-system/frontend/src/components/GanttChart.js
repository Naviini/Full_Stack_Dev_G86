import React, { useState, useEffect } from 'react';
import '../styles/GanttChart.css';

const GanttChart = ({ tasks, startDate, endDate }) => {
  const [chartData, setChartData] = useState([]);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    generateChartData();
  }, [tasks, startDate, endDate]);

  const generateChartData = () => {
    if (!tasks || tasks.length === 0) return;

    const projectStart = new Date(startDate);
    const projectEnd = new Date(endDate);
    const totalDays = Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24));

    const data = tasks.map(task => {
      const taskStart = new Date(task.dueDate || projectStart);
      const taskEnd = new Date(task.dueDate || projectEnd);
      
      const startOffset = Math.ceil((taskStart - projectStart) / (1000 * 60 * 60 * 24));
      const duration = Math.ceil((taskEnd - taskStart) / (1000 * 60 * 60 * 24)) || 7;

      return {
        id: task._id,
        name: task.title,
        assignee: task.assignee?.name || 'Unassigned',
        priority: task.priority,
        status: task.status,
        startOffset,
        duration,
        progress: calculateProgress(task),
        dueDate: task.dueDate,
      };
    });

    setChartData(data);
  };

  const calculateProgress = (task) => {
    if (task.status === 'completed') return 100;
    if (task.status === 'in-progress') return 50;
    if (task.status === 'review') return 75;
    return 0;
  };

  const getStatusColor = (status) => {
    const colors = {
      'todo': '#e0e0e0',
      'in-progress': '#2196F3',
      'review': '#FF9800',
      'completed': '#4CAF50',
    };
    return colors[status] || '#999';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': '#4CAF50',
      'medium': '#FFC107',
      'high': '#FF5722',
      'critical': '#D32F2F',
    };
    return colors[priority] || '#999';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const monthHeaders = () => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const headers = [];

    let current = new Date(start);
    while (current <= end) {
      const monthName = current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      headers.push({
        label: monthName,
        date: new Date(current),
      });
      current.setMonth(current.getMonth() + 1);
    }

    return headers;
  };

  return (
    <div className="gantt-container">
      <div className="gantt-controls">
        <label>
          Zoom:
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.5"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
          />
          <span>{Math.round(scale * 100)}%</span>
        </label>
      </div>

      <div className="gantt-wrapper">
        <div className="gantt-chart" style={{ '--scale': scale }}>
          {/* Header */}
          <div className="gantt-header">
            <div className="gantt-task-name">Task Name</div>
            <div className="gantt-timeline-header">
              {monthHeaders()?.map((month, idx) => (
                <div key={idx} className="gantt-month-header">
                  {month.label}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {chartData.map((item) => (
            <div key={item.id} className="gantt-row">
              <div className="gantt-task-info">
                <div className="task-name">{item.name}</div>
                <div className="task-meta">
                  <span className="assignee">{item.assignee}</span>
                  <span
                    className="priority"
                    style={{ backgroundColor: getPriorityColor(item.priority) }}
                  >
                    {item.priority}
                  </span>
                </div>
              </div>

              <div className="gantt-timeline">
                <div
                  className="gantt-bar"
                  style={{
                    left: `${item.startOffset * 4.17 * scale}px`,
                    width: `${item.duration * 4.17 * scale}px`,
                    backgroundColor: getStatusColor(item.status),
                  }}
                >
                  <div
                    className="gantt-bar-progress"
                    style={{
                      width: `${item.progress}%`,
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    }}
                  />
                  <span className="gantt-bar-label">{item.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="gantt-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#e0e0e0' }}></div>
          <span>Not Started</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#2196F3' }}></div>
          <span>In Progress</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#FF9800' }}></div>
          <span>In Review</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#4CAF50' }}></div>
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
