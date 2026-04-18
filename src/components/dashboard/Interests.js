import React, { useState } from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import '../../styles/dashboard.css';

const Interests = ({ interests, onAddInterest, onRemoveInterest }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag.trim()) {
      onAddInterest(newTag.trim());
      setNewTag('');
      setIsAdding(false);
    }
  };

  const suggestedTags = [
    'Machine Learning', 'Computer Vision', 'NLP', 'Reinforcement Learning',
    'Cloud Computing', 'DevOps', 'Blockchain', 'IoT', 'Robotics'
  ];

  const interestsList = interests || [];

  return React.createElement('section', { className: 'interests' },
    React.createElement('div', { className: 'section-header' },
      React.createElement('h2', null, 'Mes centres d\'intérêt'),
      React.createElement('span', { className: 'interests-count' }, `${interestsList.length} tags`)
    ),
    React.createElement('div', { className: 'interests-list' },
      interestsList.map((interest, index) => 
        React.createElement('div', {
          key: index,
          className: 'interest-tag'
        },
          React.createElement('span', { className: 'tag-text' }, interest),
          React.createElement('button', {
            className: 'remove-tag-btn',
            onClick: () => onRemoveInterest(interest)
          }, React.createElement(FiX, { size: 14 }))
        )
      ),
      isAdding ? 
        React.createElement('div', { className: 'add-tag-form' },
          React.createElement('input', {
            type: 'text',
            value: newTag,
            onChange: (e) => setNewTag(e.target.value),
            placeholder: 'Nouveau tag...',
            onKeyPress: (e) => e.key === 'Enter' && handleAddTag(),
            autoFocus: true
          }),
          React.createElement('div', { className: 'form-actions' },
            React.createElement('button', { onClick: handleAddTag, className: 'confirm-btn' }, '✓'),
            React.createElement('button', { onClick: () => setIsAdding(false), className: 'cancel-btn' }, '✗')
          )
        ) :
        React.createElement('button', { 
          className: 'add-tag-btn', 
          onClick: () => setIsAdding(true) 
        },
          React.createElement(FiPlus, { size: 16 }),
          'Ajouter un tag'
        )
    ),
    React.createElement('div', { className: 'suggested-tags' },
      React.createElement('p', { className: 'suggested-title' }, 'Suggestions:'),
      React.createElement('div', { className: 'suggested-list' },
        suggestedTags.map(tag => 
          !interestsList.includes(tag) && React.createElement('button', {
            key: tag,
            className: 'suggested-tag',
            onClick: () => onAddInterest(tag)
          }, `+ ${tag}`)
        )
      )
    )
  );
};

export default Interests;