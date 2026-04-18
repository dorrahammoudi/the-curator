import React from 'react';
import '../../styles/common.css';

const ProgressBar = ({ label, percentage, color, showLabel = true }) => {
  const gradientColor = color || 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)';
  
  return React.createElement('div', { className: 'progress-item' },
    showLabel && React.createElement('div', { className: 'progress-header' },
      React.createElement('span', null, label),
      React.createElement('span', { className: 'progress-percent' }, `${percentage}%`)
    ),
    React.createElement('div', { className: 'progress-bar' },
      React.createElement('div', {
        className: 'progress-fill',
        style: {
          width: `${percentage}%`,
          background: gradientColor
        }
      })
    )
  );
};

export default ProgressBar;