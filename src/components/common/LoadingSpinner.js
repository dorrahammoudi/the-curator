import React from 'react';
import '../../styles/common.css';

const LoadingSpinner = ({ message = 'Chargement en cours...' }) => {
  return React.createElement('div', { className: 'loading-spinner-container' },
    React.createElement('div', { className: 'spinner' }),
    React.createElement('p', { className: 'spinner-message' }, message)
  );
};

export default LoadingSpinner;