import React, { useState } from 'react';
import { FiEdit2, FiSave, FiX } from 'react-icons/fi';
import '../../styles/dashboard.css';

const ProfileHeader = ({ profile, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile || {});

  const handleSave = () => {
    onUpdate(editedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  if (!profile) {
    return React.createElement('div', { className: 'profile-header' },
      React.createElement('div', { className: 'profile-info' },
        React.createElement('h1', null, 'Chargement...')
      )
    );
  }

  const creditsText = profile.credits ? 
    (typeof profile.credits === 'object' ? `${profile.credits.current} / ${profile.credits.total}` : profile.credits) :
    '112 / 120';

  if (isEditing) {
    return React.createElement('div', { className: 'profile-header editing' },
      React.createElement('div', { className: 'profile-info' },
        React.createElement('input', {
          type: 'text',
          value: editedProfile.name || '',
          onChange: (e) => setEditedProfile({...editedProfile, name: e.target.value}),
          className: 'edit-input name-input'
        }),
        React.createElement('input', {
          type: 'text',
          value: editedProfile.program || '',
          onChange: (e) => setEditedProfile({...editedProfile, program: e.target.value}),
          className: 'edit-input program-input'
        }),
        React.createElement('div', { className: 'badges' },
          React.createElement('input', {
            type: 'text',
            value: editedProfile.promo || '',
            onChange: (e) => setEditedProfile({...editedProfile, promo: e.target.value}),
            className: 'edit-input badge-input'
          }),
          React.createElement('div', { className: 'edit-credits' },
            React.createElement('input', {
              type: 'number',
              value: editedProfile.credits?.current || 112,
              onChange: (e) => setEditedProfile({
                ...editedProfile, 
                credits: { ...editedProfile.credits, current: parseInt(e.target.value) }
              }),
              className: 'edit-input small-input'
            }),
            React.createElement('span', null, ' / '),
            React.createElement('input', {
              type: 'number',
              value: editedProfile.credits?.total || 120,
              onChange: (e) => setEditedProfile({
                ...editedProfile, 
                credits: { ...editedProfile.credits, total: parseInt(e.target.value) }
              }),
              className: 'edit-input small-input'
            })
          ),
          React.createElement('input', {
            type: 'number',
            step: '0.1',
            value: editedProfile.average || 16.4,
            onChange: (e) => setEditedProfile({...editedProfile, average: parseFloat(e.target.value)}),
            className: 'edit-input small-input'
          })
        ),
        React.createElement('div', { className: 'edit-actions' },
          React.createElement('button', { onClick: handleSave, className: 'save-btn' },
            React.createElement(FiSave, { size: 16 }), ' Sauvegarder'
          ),
          React.createElement('button', { onClick: handleCancel, className: 'cancel-btn' },
            React.createElement(FiX, { size: 16 }), ' Annuler'
          )
        )
      )
    );
  }

  return React.createElement('div', { className: 'profile-header' },
    React.createElement('div', { className: 'profile-info' },
      React.createElement('div', { className: 'profile-header-row' },
        React.createElement('h1', null, profile.name || 'Lucas Bernard'),
        React.createElement('button', { 
          onClick: () => setIsEditing(true), 
          className: 'edit-profile-btn'
        }, React.createElement(FiEdit2, { size: 16 }))
      ),
      React.createElement('p', { className: 'program' }, profile.program || 'Master II en Intelligence Artificielle & Big Data'),
      React.createElement('div', { className: 'badges' },
        React.createElement('span', { className: 'badge promo' }, profile.promo || 'Promo LUMIÈRE 2024'),
        React.createElement('span', { className: 'badge credits' }, `Crédits ECTS ${creditsText}`),
        React.createElement('span', { className: 'badge moyenne' }, `Moyenne ${profile.average || '16.4'} / 20`)
      )
    )
  );
};

export default ProfileHeader;