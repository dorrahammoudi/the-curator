import React from 'react';
import { FiAward, FiTag } from 'react-icons/fi';
import '../../styles/dashboard.css';

const TopPercentBadge = ({ percentage = 5, message, onViewAllTags }) => {
  const defaultMessage = 'VOUS FAITES PARTIE DES ÉTUDIANTS LES PLUS ACTIFS DE VOTRE INSTITUTION CE MOIS-CI.';
  
  return React.createElement('section', { className: 'top-percent-badge' },
    React.createElement('div', { className: 'badge-card' },
      React.createElement('div', { className: 'badge-icon' },
        React.createElement(FiAward, { size: 48, color: '#667eea' })
      ),
      React.createElement('div', { className: 'badge-text' },
        React.createElement('h3', null, `Top ${percentage}%`),
        React.createElement('p', null, message || defaultMessage)
      ),
      React.createElement('button', 
        { 
          className: 'see-all-tags',
          onClick: onViewAllTags 
        },
        React.createElement(FiTag, { size: 16, style: { marginRight: '8px' } }),
        'Voir tous les tags →'
      )
    )
  );
};

export default TopPercentBadge;