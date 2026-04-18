import React, { useState, useEffect } from 'react';
import Layout from './components/layout/Layout';
import Login from './components/pages/Login';
import Inscription from './components/pages/Inscription';
import Dashboard from './components/pages/Dashboard';
import TeacherDashboard from './components/pages/TeacherDashboard';
import Library from './components/pages/Library';
import StudentLibrary from './components/pages/StudentLibrary';
import ProfilePage from './components/pages/Profile';
import Recommendations from './components/pages/Recommendations';
import Administration from './components/pages/Administration';
import SearchPage from './components/pages/SearchPage';
import LoadingSpinner from './components/common/LoadingSpinner';
import { useDashboardData } from './hooks/useDashboardData';

import './styles/global.css';
import './styles/layout.css';
import './styles/dashboard.css';
import './styles/library.css';
import './styles/teacherDashboard.css';
import './styles/login.css';
import './styles/inscription.css';
import './styles/profile.css';
import './styles/recommendations.css';
import './styles/administration.css';
import './styles/common.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useState(null);
  
  const { loading, data, updateProfile, updateObjective, addInterest, removeInterest, refreshData } = useDashboardData();

  useEffect(function() {
    var token = localStorage.getItem('token');
    var currentUserId = localStorage.getItem('current_user_id');
    var savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && currentUserId) {
      setIsAuthenticated(true);
      setUser(savedUser.id ? savedUser : { id: currentUserId, role: savedUser.role || 'ETUDIANT' });
      
      if (savedUser.role === 'ADMIN') {
        setCurrentPage('administration');
      } else {
        setCurrentPage('dashboard');
      }
      refreshData();
    }
  }, []);

  var handleLogin = function(loginData) {
    setUser(loginData);
    setIsAuthenticated(true);
    
    if (loginData.role === 'ADMIN') {
      setCurrentPage('administration');
    } else {
      setCurrentPage('dashboard');
    }
    refreshData();
  };

  var handleRegister = function(registerData) {
    setUser(registerData);
    setIsAuthenticated(true);
    
    if (registerData.role === 'ADMIN') {
      setCurrentPage('administration');
    } else {
      setCurrentPage('dashboard');
    }
    refreshData();
  };

  var handleLogout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('current_user_id');
    localStorage.removeItem('user');
    
    setIsAuthenticated(false);
    setCurrentPage('login');
    setUser(null);
    setGlobalSearchTerm('');
    setSearchParams(null);
  };

  var handleGlobalSearch = function(searchTerm) {
    setGlobalSearchTerm(searchTerm);
  };

  var handleNavigate = function(page, params) {
    setCurrentPage(page);
    if (params && params.query) {
      setGlobalSearchTerm(params.query);
      setSearchParams(params);
    }
  };

  if (!isAuthenticated) {
    if (currentPage === 'inscription') {
      return React.createElement(Inscription, { 
        onRegister: handleRegister, 
        onGoToLogin: function() { setCurrentPage('login'); }
      });
    }
    return React.createElement(Login, { 
      onLogin: handleLogin, 
      onGoToRegister: function() { setCurrentPage('inscription'); }
    });
  }

  if (loading) {
    return React.createElement(LoadingSpinner, { 
      message: 'Chargement de votre tableau de bord...' 
    });
  }

  var userRole = user?.role || data.profile?.role || 'ETUDIANT';
  var currentUserName = user?.name || data.profile?.name || (userRole === 'ENSEIGNANT' ? 'Enseignant' : 'Étudiant');
  
  var dashboardProps = {
    profile: { ...data.profile, ...user, name: currentUserName, role: userRole },
    academicData: data.academicActivity,
    objectives: data.objectives,
    popularTags: data.popularTags,
    interests: data.interests || user?.interests || [],
    onUpdateProfile: updateProfile,
    onUpdateObjective: updateObjective,
    onAddInterest: addInterest,
    onRemoveInterest: removeInterest,
    userRole: userRole
  };

  var renderPage = function() {
    if (currentPage === 'search') {
      return React.createElement(SearchPage, { searchQuery: globalSearchTerm });
    }
    
    if (userRole === 'ADMIN') {
      return React.createElement(Administration, null);
    }
    
    if (userRole === 'ENSEIGNANT') {
      switch(currentPage) {
        case 'dashboard':
          return React.createElement(TeacherDashboard, { user: { ...user, ...data.profile } });
        case 'library':
          return React.createElement(Library, { globalSearchTerm: globalSearchTerm });
        case 'profile':
          return React.createElement(ProfilePage, {
            userData: { ...data.profile, ...user },
            onUpdateProfile: updateProfile,
            interests: data.interests || [],
            onAddInterest: addInterest,
            onRemoveInterest: removeInterest,
            userRole: userRole
          });
        case 'recommendations':
          return React.createElement(Recommendations, { 
            userRole: userRole,
            userData: { ...data.profile, ...user },
            onNavigate: handleNavigate
          });
        default:
          return React.createElement(TeacherDashboard, { user: { ...user, ...data.profile } });
      }
    }
    
    // ETUDIANT
    switch(currentPage) {
      case 'dashboard':
        return React.createElement(Dashboard, dashboardProps);
      case 'library':
        return React.createElement(StudentLibrary, { user: user });
      case 'profile':
        return React.createElement(ProfilePage, {
          userData: { ...data.profile, ...user },
          onUpdateProfile: updateProfile,
          interests: data.interests || [],
          onAddInterest: addInterest,
          onRemoveInterest: removeInterest,
          userRole: userRole
        });
      case 'recommendations':
        return React.createElement(Recommendations, { 
          userRole: userRole,
          userData: { ...data.profile, ...user },
          onNavigate: handleNavigate
        });
      default:
        return React.createElement(Dashboard, dashboardProps);
    }
  };

  return React.createElement(Layout, 
    { 
      activeTab: currentPage, 
      onTabChange: function(tab) { setCurrentPage(tab); }, 
      user: { ...data.profile, ...user, name: currentUserName, role: userRole },
      onLogout: handleLogout,
      onSearch: handleGlobalSearch,
      onNavigate: handleNavigate,
      userRole: userRole
    },
    renderPage()
  );
}

export default App;