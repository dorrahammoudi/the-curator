import React from 'react';
import Header from './Header';
import Aside from './Aside';
import Footer from './Footer';
import '../../styles/layout.css';

var Layout = function({ children, activeTab, onTabChange, user, onLogout, onSearch, onNavigate, userRole }) {
  return React.createElement('div', { className: 'app-layout' },
    React.createElement(Header, { 
      user: user, 
      onLogout: onLogout, 
      onSearch: onSearch,
      onNavigate: onNavigate 
    }),
    React.createElement('div', { className: 'layout-container' },
      React.createElement(Aside, { 
        activeTab: activeTab, 
        onTabChange: onTabChange,
        userRole: userRole
      }),
      React.createElement('main', { className: 'layout-main' }, children)
    ),
    React.createElement(Footer, null)
  );
};

export default Layout;