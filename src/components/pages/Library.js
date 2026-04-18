import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiPlus, FiX, FiTrash2, FiBookmark, FiEye } from 'react-icons/fi';

var Library = function({ globalSearchTerm = '' }) {
  var [searchTerm, setSearchTerm] = useState(globalSearchTerm);
  var [filterType, setFilterType] = useState('all');
  var [filterLevel, setFilterLevel] = useState('all');
  var [filteredResources, setFilteredResources] = useState([]);
  var [showAddModal, setShowAddModal] = useState(false);
  var [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  var [loading, setLoading] = useState(false);
  var [resources, setResources] = useState([]);
  var [savedResources, setSavedResources] = useState([]);
  var [showSavedSection, setShowSavedSection] = useState(false);
  var [currentTeacher, setCurrentTeacher] = useState({ name: '', id: null, departement: '' });
  var [newResource, setNewResource] = useState({
    title: '',
    type: 'COURS',
    tags: '',
    level: 'DEBUTANT',
    date: '',
    file: null,
    description: ''
  });

  useEffect(function() {
    var dashboardData = JSON.parse(localStorage.getItem('dashboard_data') || '{}');
    var userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    var currentUserId = localStorage.getItem('current_user_id');
    
    var teacherId = currentUserId || userData.id || dashboardData.profile?.id;
    var teacherName = dashboardData.profile?.name || userData.name || 'Enseignant';
    var teacherDepartement = dashboardData.profile?.departement || userData.departement || '';
    
    setCurrentTeacher({
      name: teacherName,
      id: teacherId,
      departement: teacherDepartement
    });
  }, []);

  useEffect(function() {
    var saved = localStorage.getItem('saved_resources');
    if (saved) {
      setSavedResources(JSON.parse(saved));
      setShowSavedSection(true);
    }
  }, []);

  var fetchResources = useCallback(function() {
    try {
      setLoading(true);
      var allResources = JSON.parse(localStorage.getItem('teacher_resources') || '[]');
      var myResources = allResources.filter(function(resource) {
        return String(resource.teacherId) === String(currentTeacher.id);
      });
      var cleanedResources = myResources.map(function(r) {
        return {
          ...r,
          teacherName: r.teacherName || currentTeacher.name,
          date: r.date || r.rawDate || 'Non spécifiée',
          tags: r.tags || (r.tag ? [r.tag] : []),
          level: r.level || 'DEBUTANT'
        };
      });
      setResources(cleanedResources);
      setLoading(false);
    } catch (err) {
      console.error('Erreur:', err);
      setLoading(false);
    }
  }, [currentTeacher.id, currentTeacher.name]);

  useEffect(function() {
    if (currentTeacher.id) {
      fetchResources();
    }
  }, [currentTeacher.id, fetchResources]);

  useEffect(function() {
    if (globalSearchTerm !== undefined && globalSearchTerm !== searchTerm) {
      setSearchTerm(globalSearchTerm);
    }
  }, [globalSearchTerm, searchTerm]);

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

  var handleView = function(resource) {
    if (resource.fileUrl) {
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

  var handleDelete = function(id) {
    var resourceToDelete = resources.find(function(r) { return r.id === id; });
    setShowDeleteConfirm(resourceToDelete);
  };

  var confirmDelete = function() {
    if (showDeleteConfirm) {
      var allResources = JSON.parse(localStorage.getItem('teacher_resources') || '[]');
      var updatedResources = allResources.filter(function(r) { return r.id !== showDeleteConfirm.id; });
      localStorage.setItem('teacher_resources', JSON.stringify(updatedResources));
      setResources(resources.filter(function(r) { return r.id !== showDeleteConfirm.id; }));
      setShowDeleteConfirm(null);
      alert('✅ Ressource supprimée avec succès !');
    }
  };

  var cancelDelete = function() {
    setShowDeleteConfirm(null);
  };

  var handleFileChange = function(e) {
    var file = e.target.files[0];
    if (file) {
      setNewResource({ ...newResource, file: file });
    }
  };

  var getMonthName = function(month) {
    var months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return months[month - 1] || 'Jan';
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

  var handleAddResource = function() {
    if (!newResource.title || !newResource.tags) {
      alert('Veuillez remplir tous les champs obligatoires (titre et tags)');
      return;
    }

    setLoading(true);
    
    var resourceDate = newResource.date;
    if (!resourceDate) {
      var today = new Date();
      resourceDate = today.toISOString().split('T')[0];
    }
    
    var displayDate = resourceDate.split('-')[2] + ' ' + getMonthName(parseInt(resourceDate.split('-')[1])) + ' ' + resourceDate.split('-')[0];
    var tagsArray = newResource.tags.split(',').map(function(tag) { return tag.trim(); });
    
    var fileUrl = null;
    if (newResource.file) {
      fileUrl = URL.createObjectURL(newResource.file);
    }
    
    var newResourceObj = {
      id: Date.now(),
      title: newResource.title,
      type: newResource.type,
      description: newResource.description || newResource.title,
      tags: tagsArray,
      level: newResource.level,
      date: displayDate,
      rawDate: resourceDate,
      fileUrl: fileUrl,
      teacherId: currentTeacher.id,
      teacherName: currentTeacher.name,
      departement: currentTeacher.departement,
      views: 0,
      downloads: 0,
      createdAt: new Date().toISOString()
    };
    
    var existingResources = JSON.parse(localStorage.getItem('teacher_resources') || '[]');
    existingResources.push(newResourceObj);
    localStorage.setItem('teacher_resources', JSON.stringify(existingResources));
    
    localStorage.setItem('refresh_recommendations', Date.now().toString());
    
    setResources([...resources, newResourceObj]);
    setShowAddModal(false);
    setNewResource({ title: '', type: 'COURS', tags: '', level: 'DEBUTANT', date: '', file: null, description: '' });
    alert('✅ Ressource ajoutée avec succès !');
    setLoading(false);
  };

  if (loading) {
    return React.createElement('div', { style: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' } },
      React.createElement('div', { style: { width: '40px', height: '40px', border: '3px solid rgba(155, 89, 182, 0.2)', borderTopColor: '#9b59b6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' } })
    );
  }

  return React.createElement('div', { style: { padding: '20px', background: '#f5f7fa', minHeight: '100vh' } },
    React.createElement('div', { style: { marginBottom: '20px' } },
      React.createElement('h1', { style: { fontSize: '24px', color: '#1a1a2e', marginBottom: '5px' } }, 'Mes Ressources'),
      React.createElement('p', { style: { color: '#666' } }, 
        '💡 Gérez vos supports pédagogiques. Les ressources que vous ajoutez avec des tags seront automatiquement recommandées aux étudiants.'
      )
    ),
    React.createElement('div', { style: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' } },
      React.createElement('div', { style: { flex: 2, display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '8px 12px' } },
        React.createElement(FiSearch, { size: 18 }),
        React.createElement('input', {
          type: 'text',
          placeholder: 'Recherche dans mes ressources...',
          value: searchTerm,
          onChange: function(e) { setSearchTerm(e.target.value); },
          style: { flex: 1, border: 'none', outline: 'none', marginLeft: '8px' }
        }),
        searchTerm && React.createElement('button', { 
          onClick: function() { setSearchTerm(''); },
          style: { background: 'none', border: 'none', cursor: 'pointer' }
        }, React.createElement(FiX, { size: 16 }))
      ),
      React.createElement('select', { 
        value: filterType, 
        onChange: function(e) { setFilterType(e.target.value); },
        style: { padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', background: 'white' }
      },
        React.createElement('option', { value: 'all' }, 'Tous les types'),
        React.createElement('option', { value: 'cours' }, 'Cours'),
        React.createElement('option', { value: 'exercice' }, 'Exercice'),
        React.createElement('option', { value: 'article' }, 'Article')
      ),
      React.createElement('select', { 
        value: filterLevel, 
        onChange: function(e) { setFilterLevel(e.target.value); },
        style: { padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', background: 'white' }
      },
        React.createElement('option', { value: 'all' }, 'Tous niveaux'),
        React.createElement('option', { value: 'DEBUTANT' }, '🌱 Débutant'),
        React.createElement('option', { value: 'INTERMEDIAIRE' }, '📚 Intermédiaire'),
        React.createElement('option', { value: 'AVANCE' }, '🚀 Avancé'),
        React.createElement('option', { value: 'EXPERT' }, '🏆 Expert')
      ),
      React.createElement('button', { 
        onClick: function() { setShowAddModal(true); },
        style: { display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
      }, React.createElement(FiPlus, { size: 18 }), 'Ajouter une ressource')
    ),
    React.createElement('div', { style: { marginBottom: '10px' } },
      React.createElement('p', null, React.createElement('strong', null, filteredResources.length), ' ressource(s) publiée(s)')
    ),
    React.createElement('div', { style: { background: 'white', borderRadius: '15px', overflowX: 'auto', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } },
      React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', minWidth: '1000px' } },
        React.createElement('thead', null,
          React.createElement('tr', { style: { background: '#f8f9fa', borderBottom: '1px solid #e0e0e0' } },
            React.createElement('th', { style: { padding: '15px', textAlign: 'left' } }, 'TITRE'),
            React.createElement('th', { style: { padding: '15px', textAlign: 'left' } }, 'TYPE'),
            React.createElement('th', { style: { padding: '15px', textAlign: 'left' } }, 'NIVEAU'),
            React.createElement('th', { style: { padding: '15px', textAlign: 'left' } }, 'TAGS'),
            React.createElement('th', { style: { padding: '15px', textAlign: 'left' } }, 'DATE'),
            React.createElement('th', { style: { padding: '15px', textAlign: 'left' } }, 'VUES'),
            React.createElement('th', { style: { padding: '15px', textAlign: 'left' } }, 'TÉLÉCHARGEMENTS'),
            React.createElement('th', { style: { padding: '15px', textAlign: 'left' } }, 'ACTIONS')
          )
        ),
        React.createElement('tbody', null,
          filteredResources.map(function(resource) {
            var levelStyle = getLevelColor(resource.level);
            return React.createElement('tr', { key: resource.id, style: { borderBottom: '1px solid #f0f0f0' } },
              React.createElement('td', { style: { padding: '15px', fontWeight: '500' } }, resource.title || ''),
              React.createElement('td', { style: { padding: '15px' } },
                React.createElement('span', { 
                  style: { 
                    display: 'inline-block', 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '11px', 
                    fontWeight: '600',
                    background: resource.type === 'COURS' ? '#dbeafe' : (resource.type === 'EXERCICE' ? '#d1fae5' : '#fed7aa'),
                    color: resource.type === 'COURS' ? '#3b82f6' : (resource.type === 'EXERCICE' ? '#10b981' : '#d97706')
                  }
                }, resource.type === 'COURS' ? 'Cours' : (resource.type === 'EXERCICE' ? 'Exercice' : 'Article'))
              ),
              React.createElement('td', { style: { padding: '15px' } },
                React.createElement('span', { 
                  style: { 
                    display: 'inline-block', 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '11px', 
                    fontWeight: '600',
                    background: levelStyle.bg,
                    color: levelStyle.color
                  } 
                }, getLevelIcon(resource.level) + ' ' + getLevelLabel(resource.level))
              ),
              React.createElement('td', { style: { padding: '15px' } },
                React.createElement('div', { style: { display: 'flex', gap: '5px', flexWrap: 'wrap' } },
                  resource.tags && resource.tags.length > 0 ? resource.tags.map(function(tag, idx) {
                    return React.createElement('span', { key: idx, style: { background: '#f0f0f0', padding: '3px 8px', borderRadius: '12px', fontSize: '11px' } }, tag);
                  }) : React.createElement('span', { style: { color: '#999', fontSize: '11px' } }, 'Aucun tag')
                )
              ),
              React.createElement('td', { style: { padding: '15px', fontSize: '13px', color: '#666' } }, resource.date || 'Non spécifiée'),
              React.createElement('td', { style: { padding: '15px', fontSize: '13px' } }, (resource.views || 0).toLocaleString()),
              React.createElement('td', { style: { padding: '15px', fontSize: '13px' } }, (resource.downloads || 0).toLocaleString()),
              React.createElement('td', { style: { padding: '15px' } },
                React.createElement('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
                  React.createElement('button', { 
                    onClick: function() { handleView(resource); },
                    style: { background: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }
                  }, React.createElement(FiEye, { size: 12 }), ' Voir'),
                  React.createElement('button', { 
                    onClick: function() { handleDelete(resource.id); },
                    style: { background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }
                  }, React.createElement(FiTrash2, { size: 12 }), ' Supprimer')
                )
              )
            );
          })
        )
      )
    ),
    
    filteredResources.length === 0 && React.createElement('div', { style: { textAlign: 'center', padding: '40px', color: '#999' } },
      React.createElement('p', null, 'Vous n\'avez pas encore publié de ressources.'),
      React.createElement('p', { style: { fontSize: '12px', marginTop: '10px' } }, 'Cliquez sur "Ajouter une ressource" pour commencer.')
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
              React.createElement('button', { onClick: function() { handleDelete(resource.id); }, style: { background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px' } }, 'Retirer')
            )
          );
        })
      )
    ),
    
    showAddModal && React.createElement('div', { 
      style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
      onClick: function() { setShowAddModal(false); }
    },
      React.createElement('div', { 
        style: { background: 'white', borderRadius: '20px', width: '550px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' },
        onClick: function(e) { e.stopPropagation(); }
      },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #e0e0e0' } },
          React.createElement('h3', { style: { margin: 0, fontSize: '20px' } }, 'Ajouter une ressource'),
          React.createElement('button', { onClick: function() { setShowAddModal(false); }, style: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' } }, React.createElement(FiX, { size: 20 }))
        ),
        React.createElement('div', { style: { padding: '20px' } },
          React.createElement('div', { style: { marginBottom: '15px' } },
            React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' } }, 'Titre *'),
            React.createElement('input', { 
              type: 'text', 
              placeholder: 'Titre de la ressource', 
              value: newResource.title, 
              onChange: function(e) { setNewResource({...newResource, title: e.target.value}); }, 
              style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' } 
            })
          ),
          React.createElement('div', { style: { marginBottom: '15px' } },
            React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' } }, 'Type'),
            React.createElement('select', { 
              value: newResource.type, 
              onChange: function(e) { setNewResource({...newResource, type: e.target.value}); }, 
              style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' } 
            },
              React.createElement('option', { value: 'COURS' }, 'Cours'),
              React.createElement('option', { value: 'EXERCICE' }, 'Exercice'),
              React.createElement('option', { value: 'ARTICLE' }, 'Article')
            )
          ),
          React.createElement('div', { style: { marginBottom: '15px' } },
            React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' } }, 'Niveau'),
            React.createElement('select', { 
              value: newResource.level, 
              onChange: function(e) { setNewResource({...newResource, level: e.target.value}); }, 
              style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' } 
            },
              React.createElement('option', { value: 'DEBUTANT' }, '🌱 Débutant'),
              React.createElement('option', { value: 'INTERMEDIAIRE' }, '📚 Intermédiaire'),
              React.createElement('option', { value: 'AVANCE' }, '🚀 Avancé'),
              React.createElement('option', { value: 'EXPERT' }, '🏆 Expert')
            )
          ),
          React.createElement('div', { style: { marginBottom: '15px' } },
            React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' } }, 'Fichier (optionnel)'),
            React.createElement('input', { 
              type: 'file', 
              accept: '.pdf,.mp4,.doc,.docx,.ppt,.pptx', 
              onChange: handleFileChange, 
              style: { width: '100%', padding: '8px', border: '1px dashed #9b59b6', borderRadius: '8px' } 
            }),
            newResource.file && React.createElement('p', { style: { marginTop: '5px', fontSize: '12px', color: '#10b981' } }, '✅ Fichier sélectionné: ' + newResource.file.name)
          ),
          React.createElement('div', { style: { marginBottom: '15px' } },
            React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' } }, 'Tags (séparés par des virgules) *'),
            React.createElement('input', { 
              type: 'text', 
              placeholder: 'Ex: Intelligence Artificielle, Python, Deep Learning', 
              value: newResource.tags, 
              onChange: function(e) { setNewResource({...newResource, tags: e.target.value}); }, 
              style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' } 
            }),
            React.createElement('small', { style: { display: 'block', marginTop: '5px', fontSize: '11px', color: '#9b59b6', fontWeight: 'bold' } }, 
              '💡 Les étudiants avec ces intérêts verront cette ressource !'
            )
          ),
          React.createElement('div', { style: { marginBottom: '15px' } },
            React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' } }, 'Description (optionnelle)'),
            React.createElement('textarea', { 
              placeholder: 'Description de la ressource...', 
              value: newResource.description, 
              onChange: function(e) { setNewResource({...newResource, description: e.target.value}); }, 
              rows: 3, 
              style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', resize: 'vertical' } 
            })
          ),
          React.createElement('div', { style: { marginBottom: '20px' } },
            React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' } }, 'Date'),
            React.createElement('input', { 
              type: 'date', 
              value: newResource.date, 
              onChange: function(e) { setNewResource({...newResource, date: e.target.value}); }, 
              style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' } 
            })
          )
        ),
        React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '20px', borderTop: '1px solid #e0e0e0' } },
          React.createElement('button', { onClick: function() { setShowAddModal(false); }, style: { padding: '8px 16px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' } }, 'Annuler'),
          React.createElement('button', { onClick: handleAddResource, disabled: loading, style: { padding: '8px 16px', background: loading ? '#ccc' : 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer' } }, loading ? 'Ajout...' : 'Ajouter')
        )
      )
    ),
    
    showDeleteConfirm && React.createElement('div', { 
      style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
      onClick: cancelDelete
    },
      React.createElement('div', { style: { background: 'white', borderRadius: '20px', width: '400px', maxWidth: '90%' }, onClick: function(e) { e.stopPropagation(); } },
        React.createElement('div', { style: { padding: '20px', borderBottom: '1px solid #e0e0e0' } },
          React.createElement('h3', { style: { margin: 0 } }, 'Confirmer la suppression')
        ),
        React.createElement('div', { style: { padding: '20px' } },
          React.createElement('p', null, 'Êtes-vous sûr de vouloir supprimer cette ressource ?'),
          React.createElement('p', { style: { fontWeight: 'bold', color: '#e74c3c', textAlign: 'center', margin: '15px 0' } }, '"' + (showDeleteConfirm?.title || '') + '"')
        ),
        React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '20px', borderTop: '1px solid #e0e0e0' } },
          React.createElement('button', { onClick: cancelDelete, style: { padding: '8px 16px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' } }, 'Annuler'),
          React.createElement('button', { onClick: confirmDelete, style: { padding: '8px 16px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' } }, 'Supprimer')
        )
      )
    )
  );
};

export default Library;