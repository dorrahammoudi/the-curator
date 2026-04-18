import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiSearch, FiLogOut, FiX } from 'react-icons/fi';
import '../../styles/layout.css';

var Header = function({ user, onLogout, onSearch, onNavigate }) {
  var [searchTerm, setSearchTerm] = useState('');
  var [isSearchFocused, setIsSearchFocused] = useState(false);
  var [searchResults, setSearchResults] = useState([]);
  var [showResults, setShowResults] = useState(false);
  var [userInterests, setUserInterests] = useState([]);
  var [userRole, setUserRole] = useState('');
  var [currentUserId, setCurrentUserId] = useState(null);
  var searchRef = useRef(null);

  useEffect(function() {
    loadUserData();
  }, []);

  var loadUserData = function() {
    var userInfo = JSON.parse(localStorage.getItem('user_data') || '{}');
    var dashboardData = JSON.parse(localStorage.getItem('dashboard_data') || '{}');
    var interests = userInfo.interests || dashboardData.profile?.interests || [];
    var role = userInfo.role || dashboardData.profile?.role || 'ETUDIANT';
    var userId = userInfo.id || dashboardData.profile?.id;
    
    setUserInterests(interests);
    setUserRole(role);
    setCurrentUserId(userId);
  };

  var calculateMatchScore = function(resourceTags, userTags) {
    if (!userTags || userTags.length === 0) return 0;
    if (!resourceTags || resourceTags.length === 0) return 0;
    
    var matches = resourceTags.filter(function(tag) {
      return userTags.some(function(interest) {
        if (!tag || !interest) return false;
        var tagLower = tag.toLowerCase();
        var interestLower = interest.toLowerCase();
        return tagLower.includes(interestLower) || interestLower.includes(tagLower);
      });
    });
    
    return Math.round((matches.length / Math.max(resourceTags.length, 1)) * 100);
  };

  var openResource = function(resource) {
    var allResources = JSON.parse(localStorage.getItem('teacher_resources') || '[]');
    var updatedResources = allResources.map(function(r) {
      if (r.id === resource.id) {
        return { ...r, views: (r.views || 0) + 1 };
      }
      return r;
    });
    localStorage.setItem('teacher_resources', JSON.stringify(updatedResources));
    
    var viewedResources = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
    viewedResources = viewedResources.filter(function(r) { return r.id !== resource.id; });
    viewedResources.unshift({
      id: resource.id,
      title: resource.title,
      type: resource.type,
      date: new Date().toLocaleDateString('fr-FR'),
      fileUrl: resource.fileUrl,
      teacherName: resource.teacherName
    });
    localStorage.setItem('recently_viewed', JSON.stringify(viewedResources.slice(0, 10)));
    
    window.dispatchEvent(new Event('storage'));
    
    if (resource.fileUrl && resource.fileUrl !== '/files/undefined' && resource.fileUrl !== 'null') {
      window.open(resource.fileUrl, '_blank');
    } else {
      var content = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${resource.title} - The Curator</title>
            <style>
              body { font-family: Arial; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
              .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; }
              h1 { color: #9b59b6; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${resource.title}</h1>
              <p>Document consulté via The Curator - Academic Portal</p>
              <hr><p>The Curator © ${new Date().getFullYear()}</p>
            </div>
          </body>
        </html>
      `;
      var blob = new Blob([content], { type: 'text/html' });
      var url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    }
  };

  var performSearch = function(query) {
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    var allResources = JSON.parse(localStorage.getItem('teacher_resources') || '[]');
    var adminResources = JSON.parse(localStorage.getItem('admin_resources') || '[]');
    
    var results = [];
    
    if (userRole === 'ADMIN') {
      var currentAdminEmail = JSON.parse(localStorage.getItem('user_data') || '{}').email;
      var myAdminResources = adminResources.filter(function(r) {
        return r.adminEmail === currentAdminEmail;
      });
      
      results = myAdminResources.filter(function(resource) {
        return (resource.title && resource.title.toLowerCase().includes(query.toLowerCase())) ||
               (resource.tags && resource.tags.some(function(tag) { 
                 return tag && tag.toLowerCase().includes(query.toLowerCase()); 
               }));
      });
      
    } else if (userRole === 'ENSEIGNANT') {
      var dashboardData = JSON.parse(localStorage.getItem('dashboard_data') || '{}');
      var myDepartment = dashboardData.profile?.departement || '';
      var myAdminEmail = JSON.parse(localStorage.getItem('user_data') || '{}').adminEmail;
      
      var teacherResults = allResources.filter(function(resource) {
        if (resource.teacherId === currentUserId) return false;
        return resource.departement && resource.departement.toLowerCase() === myDepartment.toLowerCase();
      });
      
      var adminResourcesForTeacher = adminResources.filter(function(r) {
        return r.adminEmail === myAdminEmail;
      });
      
      var allRecommendations = [...teacherResults, ...adminResourcesForTeacher];
      
      results = allRecommendations.filter(function(resource) {
        return (resource.title && resource.title.toLowerCase().includes(query.toLowerCase())) ||
               (resource.tags && resource.tags.some(function(tag) { 
                 return tag && tag.toLowerCase().includes(query.toLowerCase()); 
               }));
      });
      
    } else {
      if (userInterests.length === 0) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }
      
      results = allResources.filter(function(resource) {
        if (!resource.tags || resource.tags.length === 0) return false;
        
        var matchesSearch = (resource.title && resource.title.toLowerCase().includes(query.toLowerCase())) ||
                           (resource.tags && resource.tags.some(function(tag) { 
                             return tag && tag.toLowerCase().includes(query.toLowerCase()); 
                           }));
        
        if (!matchesSearch) return false;
        
        var hasMatchingInterest = resource.tags.some(function(tag) {
          return userInterests.some(function(interest) {
            return tag && interest && (tag.toLowerCase().includes(interest.toLowerCase()) || interest.toLowerCase().includes(tag.toLowerCase()));
          });
        });
        
        return hasMatchingInterest;
      });
    }
    
    if (userRole === 'ETUDIANT') {
      results = results.map(function(r) {
        var score = calculateMatchScore(r.tags || [], userInterests);
        return { ...r, matchScore: score };
      });
      results.sort(function(a, b) { return b.matchScore - a.matchScore; });
    }
    
    setSearchResults(results.slice(0, 5));
    setShowResults(results.length > 0);
  };

  var handleSearch = function(e) {
    var value = e.target.value;
    setSearchTerm(value);
    performSearch(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  var clearSearch = function() {
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    if (onSearch) {
      onSearch('');
    }
  };

  var handleResultClick = function(result) {
    setShowResults(false);
    setSearchTerm('');
    openResource(result);
  };

  var handleSearchSubmit = function() {
    if (searchTerm.length >= 2) {
      setShowResults(false);
      if (onNavigate) {
        onNavigate('search', { query: searchTerm });
      }
    }
  };

  var handleKeyPress = function(e) {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  useEffect(function() {
    var handleClickOutside = function(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return function() {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  var handleLogoutClick = function() {
    onLogout();
  };

  return React.createElement('header', { className: 'main-header' },
    React.createElement('div', { className: 'header-left' },
      React.createElement('h1', { className: 'logo' }, 'The Curator'),
      React.createElement('p', { className: 'logo-subtitle' }, 'ACADEMIC PORTAL')
    ),
    React.createElement('div', { className: 'header-center', ref: searchRef },
      React.createElement('div', { className: 'search-bar ' + (isSearchFocused ? 'focused' : '') },
        React.createElement(FiSearch, { size: 18 }),
        React.createElement('input', {
          type: 'text',
          placeholder: 'Rechercher des ressources...',
          value: searchTerm,
          onChange: handleSearch,
          onKeyPress: handleKeyPress,
          onFocus: function() { 
            setIsSearchFocused(true);
            if (searchTerm.length >= 2) setShowResults(true);
          },
          onBlur: function() { setIsSearchFocused(false); },
          className: 'search-input'
        }),
        searchTerm && React.createElement('button', { 
          className: 'search-clear',
          onClick: clearSearch
        }, React.createElement(FiX, { size: 16 }))
      ),
      showResults && searchResults.length > 0 && React.createElement('div', { className: 'search-results-dropdown' },
        searchResults.map(function(result) {
          return React.createElement('div', {
            key: result.id,
            className: 'search-result-item',
            onClick: function() { handleResultClick(result); }
          },
            React.createElement('div', { className: 'search-result-header' },
              React.createElement('span', { className: 'search-result-title' }, result.title),
              React.createElement('span', { className: 'search-result-type' }, result.type || 'Ressource')
            ),
            React.createElement('div', { className: 'search-result-tags' },
              result.tags && result.tags.slice(0, 2).map(function(tag) {
                return React.createElement('span', { key: tag, className: 'search-result-tag' }, tag);
              })
            ),
            userRole === 'ETUDIANT' && result.matchScore > 0 && React.createElement('div', { className: 'search-result-score', style: { fontSize: '10px', color: '#10b981', marginTop: '4px' } },
              '🔍 ' + result.matchScore + '% correspondance'
            )
          );
        }),
        React.createElement('div', { 
          className: 'search-view-all',
          onClick: handleSearchSubmit,
          style: { 
            padding: '10px 16px', 
            textAlign: 'center', 
            borderTop: '1px solid #f0f0f0',
            cursor: 'pointer',
            color: '#9b59b6',
            fontWeight: '500',
            fontSize: '12px'
          }
        }, 'Voir tous les résultats pour "' + searchTerm + '" →')
      ),
      showResults && searchResults.length === 0 && searchTerm.length >= 2 && React.createElement('div', { className: 'search-results-empty' },
        'Aucun résultat trouvé pour "' + searchTerm + '"'
      )
    ),
    React.createElement('div', { className: 'header-right' },
      React.createElement('button', { className: 'notification-btn' }, React.createElement(FiBell, { size: 18 })),
      React.createElement('div', { className: 'user-menu' },
        React.createElement('div', { className: 'user-avatar' }, '👤'),
        React.createElement('div', { className: 'user-info' },
          React.createElement('div', { className: 'user-name' }, user?.name || 'Utilisateur'),
          React.createElement('div', { className: 'user-role' }, 
            userRole === 'ETUDIANT' ? 'Étudiant' : (userRole === 'ENSEIGNANT' ? 'Enseignant' : 'Administrateur')
          )
        )
      ),
      React.createElement('button', { className: 'logout-btn', onClick: handleLogoutClick }, React.createElement(FiLogOut, { size: 16 }), 'Quitter')
    )
  );
};

export default Header;