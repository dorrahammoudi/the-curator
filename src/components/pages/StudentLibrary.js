import React, { useState, useEffect } from 'react';
import { FiSearch, FiDownload, FiEye, FiStar, FiX, FiBookmark, FiUser } from 'react-icons/fi';
import userStats from '../../utils/userStats';

var StudentLibrary = function({ user }) {
  var [searchTerm, setSearchTerm] = useState('');
  var [filterType, setFilterType] = useState('all');
  var [filterLevel, setFilterLevel] = useState('all');
  var [filteredResources, setFilteredResources] = useState([]);
  var [resources, setResources] = useState([]);
  var [loading, setLoading] = useState(true);
  var [savedResources, setSavedResources] = useState([]);
  var [showSavedSection, setShowSavedSection] = useState(false);

  useEffect(function() {
    fetchResources();
    loadSavedResources();
    
    var handleStorageChange = function(e) {
      if (e.key === 'teacher_resources') {
        fetchResources();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return function() { window.removeEventListener('storage', handleStorageChange); };
  }, []);

  var loadSavedResources = function() {
    var saved = localStorage.getItem('saved_resources');
    if (saved) {
      setSavedResources(JSON.parse(saved));
      setShowSavedSection(true);
    }
  };

  var getLevelIcon = function(level) {
    switch(level) {
      case 'DEBUTANT': return '🌱';
      case 'INTERMEDIAIRE': return '📚';
      case 'AVANCE': return '🚀';
      case 'EXPERT': return '🏆';
      default: return '📖';
    }
  };

  var getLevelLabel = function(level) {
    switch(level) {
      case 'DEBUTANT': return 'Débutant';
      case 'INTERMEDIAIRE': return 'Intermédiaire';
      case 'AVANCE': return 'Avancé';
      case 'EXPERT': return 'Expert';
      default: return 'Non spécifié';
    }
  };

  var getLevelColor = function(level) {
    switch(level) {
      case 'DEBUTANT': return { bg: '#d1fae5', color: '#10b981' };
      case 'INTERMEDIAIRE': return { bg: '#dbeafe', color: '#3b82f6' };
      case 'AVANCE': return { bg: '#fed7aa', color: '#d97706' };
      case 'EXPERT': return { bg: '#fef3c7', color: '#92400e' };
      default: return { bg: '#f0f0f0', color: '#666' };
    }
  };

  var fetchResources = function() {
    try {
      setLoading(true);
      var localResources = JSON.parse(localStorage.getItem('teacher_resources') || '[]');
      var allUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
      
      var resourcesWithNames = localResources.map(function(r) {
        if (!r.teacherName && r.teacherId) {
          var teacher = allUsers.find(function(u) { return u.id === r.teacherId; });
          r.teacherName = teacher ? teacher.name : 'Enseignant';
        }
        return r;
      });
      
      setResources(resourcesWithNames);
      setLoading(false);
    } catch (err) {
      console.error('Erreur:', err);
      setLoading(false);
    }
  };

  useEffect(function() {
    var results = resources.filter(function(r) {
      var matchesType = filterType === 'all' || (r.type && r.type.toLowerCase() === filterType);
      var matchesLevel = filterLevel === 'all' || (r.level && r.level === filterLevel);
      var matchesSearch = searchTerm === '' || (r.title && r.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.tags && r.tags.some(function(tag) { return tag && tag.toLowerCase().includes(searchTerm.toLowerCase()); }));
      return matchesType && matchesLevel && matchesSearch;
    });
    setFilteredResources(results);
  }, [searchTerm, filterType, filterLevel, resources]);

  var openFile = function(fileUrl, title) {
    if (fileUrl && fileUrl !== '/files/undefined' && fileUrl !== 'null') {
      window.open(fileUrl, '_blank');
    } else {
      var content = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title} - The Curator</title>
            <style>
              body { font-family: Arial; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
              .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; }
              h1 { color: #9b59b6; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${title}</h1>
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

  var downloadFile = function(fileUrl, title) {
    if (fileUrl && fileUrl !== '/files/undefined' && fileUrl !== 'null') {
      var link = document.createElement('a');
      link.href = fileUrl;
      link.download = title.replace(/[^a-z0-9]/gi, '_') + '.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      var content = `<h1>${title}</h1><p>Document téléchargé depuis The Curator</p>`;
      var blob = new Blob([content], { type: 'application/pdf' });
      var url = URL.createObjectURL(blob);
      link = document.createElement('a');
      link.href = url;
      link.download = title.replace(/[^a-z0-9]/gi, '_') + '.pdf';
      link.click();
      setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    }
  };

  var handleView = function(resource) {
    var currentUserId = localStorage.getItem('current_user_id');
    
    if (!currentUserId) {
      console.error('❌ Pas d\'utilisateur connecté');
      return;
    }
    
    var allResources = JSON.parse(localStorage.getItem('teacher_resources') || '[]');
    var updatedResources = allResources.map(function(r) {
      if (r.id === resource.id) {
        return { ...r, views: (r.views || 0) + 1 };
      }
      return r;
    });
    localStorage.setItem('teacher_resources', JSON.stringify(updatedResources));
    setResources(updatedResources);
    
    userStats.addView(resource.id, resource.title, resource.type, resource.fileUrl, resource.teacherName);
    
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

  var handleDownload = function(resource) {
    var allResources = JSON.parse(localStorage.getItem('teacher_resources') || '[]');
    var updatedResources = allResources.map(function(r) {
      if (r.id === resource.id) {
        return { ...r, downloads: (r.downloads || 0) + 1 };
      }
      return r;
    });
    localStorage.setItem('teacher_resources', JSON.stringify(updatedResources));
    setResources(updatedResources);
    
    userStats.addDownload(resource.id, resource.title, resource.type, resource.fileUrl, resource.teacherName);
    
    downloadFile(resource.fileUrl, resource.title);
  };

  var handleSave = function(resource) {
    var newSaved;
    if (savedResources.some(function(r) { return r.id === resource.id; })) {
      newSaved = savedResources.filter(function(r) { return r.id !== resource.id; });
      alert('Ressource retirée des favoris');
    } else {
      newSaved = [...savedResources, resource];
      alert('Ressource sauvegardée !');
    }
    setSavedResources(newSaved);
    localStorage.setItem('saved_resources', JSON.stringify(newSaved));
    setShowSavedSection(true);
  };

  if (loading) {
    return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' } },
      React.createElement('div', { style: { width: '50px', height: '50px', border: '3px solid rgba(155, 89, 182, 0.2)', borderTopColor: '#9b59b6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '1rem' } }),
      React.createElement('p', null, 'Chargement des ressources...')
    );
  }

  return React.createElement('div', { style: { padding: '2rem', background: '#f5f7fa', minHeight: '100vh' } },
    React.createElement('div', { style: { marginBottom: '2rem' } },
      React.createElement('h1', { style: { fontSize: '1.75rem', color: '#1a1a2e', marginBottom: '0.5rem' } }, 'Bibliothèque de Ressources'),
      React.createElement('p', { style: { color: '#666', fontSize: '0.875rem' } }, 'Consultez les ressources mises à disposition par vos enseignants')
    ),
    React.createElement('div', { style: { display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' } },
      React.createElement('div', { style: { flex: 2, display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '0.75rem 1rem' } },
        React.createElement(FiSearch, { style: { color: '#999', marginRight: '0.5rem' }, size: 18 }),
        React.createElement('input', {
          type: 'text',
          placeholder: 'Rechercher par titre ou tag...',
          value: searchTerm,
          onChange: function(e) { setSearchTerm(e.target.value); },
          style: { flex: 1, border: 'none', outline: 'none', fontSize: '0.875rem', background: 'transparent' }
        }),
        searchTerm && React.createElement('button', { 
          onClick: function() { setSearchTerm(''); },
          style: { background: 'none', border: 'none', cursor: 'pointer', color: '#999', display: 'flex', alignItems: 'center', padding: 0 }
        }, React.createElement(FiX, { size: 16 }))
      ),
      React.createElement('select', { 
        value: filterType, 
        onChange: function(e) { setFilterType(e.target.value); },
        style: { padding: '0.75rem 1rem', border: '1px solid #e0e0e0', borderRadius: '12px', background: 'white', cursor: 'pointer', fontSize: '0.875rem', minWidth: '150px' }
      },
        React.createElement('option', { value: 'all' }, 'Tous les types'),
        React.createElement('option', { value: 'pdf' }, 'PDF'),
        React.createElement('option', { value: 'vidéo' }, 'Vidéo'),
        React.createElement('option', { value: 'quiz' }, 'Quiz')
      ),
      React.createElement('select', { 
        value: filterLevel, 
        onChange: function(e) { setFilterLevel(e.target.value); },
        style: { padding: '0.75rem 1rem', border: '1px solid #e0e0e0', borderRadius: '12px', background: 'white', cursor: 'pointer', fontSize: '0.875rem', minWidth: '150px' }
      },
        React.createElement('option', { value: 'all' }, 'Tous niveaux'),
        React.createElement('option', { value: 'DEBUTANT' }, '🌱 Débutant'),
        React.createElement('option', { value: 'INTERMEDIAIRE' }, '📚 Intermédiaire'),
        React.createElement('option', { value: 'AVANCE' }, '🚀 Avancé'),
        React.createElement('option', { value: 'EXPERT' }, '🏆 Expert')
      )
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' } },
      filteredResources.map(function(resource) {
        var isSaved = savedResources.some(function(r) { return r.id === resource.id; });
        var levelStyle = getLevelColor(resource.level);
        return React.createElement('div', { key: resource.id, style: { background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } },
          React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' } },
            React.createElement('div', { style: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' } },
              React.createElement('span', { 
                style: { 
                  display: 'inline-block', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '20px', 
                  fontSize: '0.7rem', 
                  fontWeight: '600',
                  background: resource.type === 'PDF' ? '#fee2e2' : (resource.type === 'Vidéo' ? '#dbeafe' : '#d1fae5'),
                  color: resource.type === 'PDF' ? '#ef4444' : (resource.type === 'Vidéo' ? '#3b82f6' : '#10b981')
                } 
              }, resource.type),
              React.createElement('span', { 
                style: { 
                  display: 'inline-block', 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '20px', 
                  fontSize: '0.7rem', 
                  fontWeight: '600',
                  background: levelStyle.bg,
                  color: levelStyle.color
                } 
              }, getLevelIcon(resource.level) + ' ' + getLevelLabel(resource.level))
            ),
            React.createElement('button', { 
              onClick: function() { handleSave(resource); },
              style: { background: 'none', border: 'none', cursor: 'pointer', color: isSaved ? '#f59e0b' : '#ccc', padding: '0.25rem' }
            }, React.createElement(FiStar, { size: 16 }))
          ),
          React.createElement('h3', { style: { fontSize: '1.125rem', color: '#1a1a2e', marginBottom: '0.75rem', fontWeight: '600' } }, resource.title),
          React.createElement('div', { style: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' } },
            resource.tags && resource.tags.map(function(tag, idx) {
              return React.createElement('span', { key: idx, style: { background: '#f0f0f0', padding: '0.25rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', color: '#666' } }, tag);
            })
          ),
          React.createElement('div', { style: { display: 'flex', gap: '1rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap' } },
            React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#9b59b6', fontWeight: '500' } }, React.createElement(FiUser, { size: 12 }), resource.teacherName || 'Enseignant'),
            React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#999' } }, '📅', resource.date || 'Non spécifiée'),
            React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#999' } }, React.createElement(FiEye, { size: 12 }), (resource.views || 0).toLocaleString(), ' vues'),
            React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#999' } }, React.createElement(FiDownload, { size: 12 }), (resource.downloads || 0).toLocaleString(), ' téléch.')
          ),
          React.createElement('div', { style: { display: 'flex', gap: '1rem' } },
            React.createElement('button', { 
              onClick: function() { handleView(resource); },
              style: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' }
            }, React.createElement(FiEye, { size: 16 }), ' Consulter'),
            React.createElement('button', { 
              onClick: function() { handleDownload(resource); },
              style: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' }
            }, React.createElement(FiDownload, { size: 16 }), ' Télécharger')
          )
        );
      })
    ),
    filteredResources.length === 0 && React.createElement('div', { style: { textAlign: 'center', padding: '3rem', color: '#999' } },
      React.createElement('p', null, 'Aucune ressource trouvée')
    ),
    
    showSavedSection && savedResources.length > 0 && React.createElement('div', { 
      style: { marginTop: '30px', background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } 
    },
      React.createElement('h3', { style: { marginBottom: '15px', color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '10px' } },
        React.createElement(FiBookmark, { size: 20, color: '#f59e0b' }),
        'Mes ressources sauvegardées'
      ),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
        savedResources.map(function(resource) {
          return React.createElement('div', { key: resource.id, style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '10px' } },
            React.createElement('div', { style: { flex: 1 } },
              React.createElement('div', { style: { fontWeight: '500', marginBottom: '5px' } }, resource.title),
              React.createElement('div', { style: { fontSize: '12px', color: '#666' } }, resource.type + ' - ' + (resource.teacherName || 'Enseignant'))
            ),
            React.createElement('div', { style: { display: 'flex', gap: '8px' } },
              React.createElement('button', { onClick: function() { handleView(resource); }, style: { background: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px' } }, 'Voir'),
              React.createElement('button', { onClick: function() { handleDownload(resource); }, style: { background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px' } }, 'Télécharger'),
              React.createElement('button', { onClick: function() { handleSave(resource); }, style: { background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px' } }, 'Retirer')
            )
          );
        })
      )
    )
  );
};

export default StudentLibrary;