import React, { useState } from 'react';
import { FiHome, FiTrendingUp, FiBookOpen, FiUser, FiSettings } from 'react-icons/fi';

var Aside = function({ activeTab, onTabChange, userRole }) {
  var [isOpen, setIsOpen] = useState(true);

  var toggleAside = function() {
    setIsOpen(!isOpen);
  };

  var getMenuItems = function() {
    if (userRole === 'ADMIN') {
      return [
        { id: 'administration', icon: FiSettings, label: 'Administration' }
      ];
    }
    
    if (userRole === 'ENSEIGNANT') {
      return [
        { id: 'dashboard', icon: FiHome, label: 'Dashboard' },
        { id: 'recommendations', icon: FiTrendingUp, label: 'Recommandations' },
        { id: 'library', icon: FiBookOpen, label: 'Librairie' },
        { id: 'profile', icon: FiUser, label: 'Profil' }
      ];
    }
    
    return [
      { id: 'dashboard', icon: FiHome, label: 'Dashboard' },
      { id: 'recommendations', icon: FiTrendingUp, label: 'Recommandations' },
      { id: 'library', icon: FiBookOpen, label: 'Librairie' },
      { id: 'profile', icon: FiUser, label: 'Profil' }
    ];
  };

  var menuItems = getMenuItems();

  return React.createElement(React.Fragment, null,
    React.createElement('aside', { 
      className: 'main-aside ' + (!isOpen ? 'collapsed' : '')
    },
      React.createElement('button', {
        className: 'aside-toggle',
        onClick: toggleAside
      }, isOpen ? '◀' : '▶'),
      React.createElement('div', { className: 'aside-logo' },
        React.createElement('h2', null, 'The Curator'),
        React.createElement('p', null, 'ACADEMIC PORTAL')
      ),
      React.createElement('nav', { className: 'sidebar-nav' },
        React.createElement('ul', null,
          menuItems.map(function(item) {
            var isActive = activeTab === item.id;
            return React.createElement('li', {
              key: item.id,
              className: 'nav-item ' + (isActive ? 'active' : ''),
              onClick: function() { onTabChange(item.id); }
            },
              React.createElement(item.icon, { className: 'nav-icon', size: 20 }),
              isOpen && React.createElement('span', { className: 'nav-label' }, item.label)
            );
          })
        )
      )
    )
  );
};

export default Aside;