import React, { useState, useEffect } from 'react';
import { FiUsers, FiTrash2, FiEdit2, FiSave, FiX, FiSearch, FiShield, FiPlus, FiEye, FiDownload, FiRefreshCw } from 'react-icons/fi';

var Administration = function() {
  var [users, setUsers] = useState([]);
  var [filteredUsers, setFilteredUsers] = useState([]);
  var [searchTerm, setSearchTerm] = useState('');
  var [loading, setLoading] = useState(true);
  var [selectedUser, setSelectedUser] = useState(null);
  var [isEditing, setIsEditing] = useState(false);
  var [editForm, setEditForm] = useState({});
  var [currentAdmin, setCurrentAdmin] = useState(null);
  var [adminResources, setAdminResources] = useState([]);
  var [showAddResourceModal, setShowAddResourceModal] = useState(false);
  var [showResourceDetail, setShowResourceDetail] = useState(null);
  var [newResource, setNewResource] = useState({
    title: '',
    type: 'DOCUMENT_OFFICIEL',
    tags: '',
    description: '',
    fileUrl: ''
  });

  var resourceTypes = [
    { value: 'DOCUMENT_OFFICIEL', label: '📄 Document officiel', color: '#3b82f6' },
    { value: 'FORMATION', label: '🎓 Formation', color: '#10b981' },
    { value: 'APPEL_PROJET', label: '📢 Appel à projets', color: '#f59e0b' },
    { value: 'CONFERENCE', label: '🎤 Conférence', color: '#ef4444' },
    { value: 'RESSOURCE_PEDAGOGIQUE', label: '📚 Ressource pédagogique', color: '#9b59b6' }
  ];

  useEffect(function() {
    loadCurrentAdmin();
  }, []);

  useEffect(function() {
    if (currentAdmin) {
      loadUsers();
      loadAdminResources();
    }
  }, [currentAdmin]);

  useEffect(function() {
    var results = users.filter(function(user) {
      return (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (user.specialite || '').toLowerCase().includes(searchTerm.toLowerCase());
    });
    setFilteredUsers(results);
  }, [searchTerm, users]);

  var loadCurrentAdmin = function() {
    var userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    var dashboardData = JSON.parse(localStorage.getItem('dashboard_data') || '{}');
    var adminEmail = userData.email || dashboardData.profile?.email;
    
    setCurrentAdmin({
      id: userData.id || dashboardData.profile?.id,
      email: adminEmail,
      name: userData.name || dashboardData.profile?.name || 'Administrateur'
    });
    
    console.log('Admin connecté:', adminEmail);
  };

  var loadUsers = function() {
    setLoading(true);
    try {
      var allUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
      var currentAdminEmail = currentAdmin?.email;
      
      if (!currentAdminEmail) {
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
        return;
      }
      
      var adminTeachers = [];
      
      for (var i = 0; i < allUsers.length; i++) {
        var user = allUsers[i];
        if (user.role === 'ENSEIGNANT') {
          var dashboardKey = 'dashboard_data_' + user.id;
          var dashboardData = JSON.parse(localStorage.getItem(dashboardKey) || '{}');
          var userAdminEmail = dashboardData.profile?.adminEmail || user.adminEmail;
          
          if (userAdminEmail === currentAdminEmail) {
            adminTeachers.push({
              id: user.id,
              name: user.name || 'Enseignant',
              email: user.email || '',
              role: user.role,
              specialite: dashboardData.profile?.specialite || '',
              departement: dashboardData.profile?.departement || '',
              titre: dashboardData.profile?.titre || '',
              telephone: dashboardData.profile?.telephone || '',
              establishment: dashboardData.profile?.establishment || '',
              adminEmail: userAdminEmail,
              createdAt: user.createdAt || new Date().toISOString()
            });
          }
        }
      }
      
      setUsers(adminTeachers);
      setFilteredUsers(adminTeachers);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  var loadAdminResources = function() {
    var currentAdminEmail = currentAdmin?.email;
    var currentAdminId = currentAdmin?.id;
    
    console.log('Chargement ressources admin - Email:', currentAdminEmail);
    
    if (!currentAdminEmail) {
      setAdminResources([]);
      return;
    }
    
    // Charger depuis la clé spécifique à l'admin
    var specificKey = 'admin_resources_' + currentAdminEmail;
    var myResources = JSON.parse(localStorage.getItem(specificKey) || '[]');
    
    // Aussi charger depuis la clé globale
    var globalResources = JSON.parse(localStorage.getItem('admin_resources') || '[]');
    var globalFiltered = globalResources.filter(function(r) {
      return r.adminEmail === currentAdminEmail || r.adminId === currentAdminId;
    });
    
    // Fusionner et supprimer les doublons
    var allResources = [...myResources, ...globalFiltered];
    var uniqueResources = [];
    var ids = {};
    
    for (var i = 0; i < allResources.length; i++) {
      var res = allResources[i];
      if (!ids[res.id]) {
        ids[res.id] = true;
        uniqueResources.push(res);
      }
    }
    
    // Trier par date
    uniqueResources.sort(function(a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    console.log('Ressources admin chargées:', uniqueResources.length);
    setAdminResources(uniqueResources);
  };

  var handleRefresh = function() {
    loadUsers();
    loadAdminResources();
    alert('Données rafraîchies !');
  };

  var handleFixTeacher = function() {
    var adminEmail = currentAdmin?.email;
    if (!adminEmail) {
      alert('Email admin non trouvé');
      return;
    }
    
    var allUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
    var fixed = 0;
    
    allUsers.forEach(function(user) {
      if (user.role === 'ENSEIGNANT') {
        var dashboardKey = 'dashboard_data_' + user.id;
        var dashboardData = JSON.parse(localStorage.getItem(dashboardKey) || '{}');
        if (!dashboardData.profile) dashboardData.profile = {};
        
        if (!dashboardData.profile.adminEmail) {
          dashboardData.profile.adminEmail = adminEmail;
          localStorage.setItem(dashboardKey, JSON.stringify(dashboardData));
          fixed++;
        }
      }
    });
    
    alert(fixed + ' enseignant(s) ont été rattachés à votre administration !');
    loadUsers();
  };

  var handleDeleteUser = function(userId) {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet enseignant ?')) {
      var allUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
      var updatedUsers = allUsers.filter(function(u) { return u.id !== userId; });
      localStorage.setItem('all_users', JSON.stringify(updatedUsers));
      
      localStorage.removeItem('dashboard_data_' + userId);
      localStorage.removeItem('interests_' + userId);
      
      loadUsers();
      alert('Enseignant supprimé avec succès !');
    }
  };

  var handleEditUser = function(user) {
    setSelectedUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      telephone: user.telephone || '',
      specialite: user.specialite || '',
      departement: user.departement || '',
      titre: user.titre || '',
      establishment: user.establishment || ''
    });
    setIsEditing(true);
  };

  var handleSaveEdit = function() {
    try {
      var allUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
      var updatedUsers = allUsers.map(function(u) {
        if (u.id === selectedUser.id) {
          return { ...u, name: editForm.name, email: editForm.email };
        }
        return u;
      });
      localStorage.setItem('all_users', JSON.stringify(updatedUsers));
      
      var dashboardKey = 'dashboard_data_' + selectedUser.id;
      var dashboardData = JSON.parse(localStorage.getItem(dashboardKey) || '{}');
      dashboardData.profile = {
        ...dashboardData.profile,
        name: editForm.name,
        email: editForm.email,
        telephone: editForm.telephone,
        specialite: editForm.specialite,
        departement: editForm.departement,
        titre: editForm.titre,
        establishment: editForm.establishment
      };
      localStorage.setItem(dashboardKey, JSON.stringify(dashboardData));
      
      setIsEditing(false);
      setSelectedUser(null);
      loadUsers();
      alert('Enseignant mis à jour avec succès !');
    } catch (err) {
      alert('Erreur lors de la mise à jour');
    }
  };

  var handleAddResource = function() {
    if (!newResource.title || !newResource.tags) {
      alert('Veuillez remplir le titre et les tags');
      return;
    }

    var currentAdminEmail = currentAdmin?.email;
    var currentAdminId = currentAdmin?.id;
    var currentAdminName = currentAdmin?.name;
    
    if (!currentAdminEmail) {
      alert('Erreur: email admin non trouvé');
      return;
    }
    
    var tagsArray = newResource.tags.split(',').map(function(tag) { return tag.trim(); });
    var selectedType = resourceTypes.find(function(t) { return t.value === newResource.type; }) || resourceTypes[0];
    
    var resourceObj = {
      id: Date.now(),
      title: newResource.title,
      type: newResource.type,
      typeLabel: selectedType.label,
      typeColor: selectedType.color,
      description: newResource.description || newResource.title,
      tags: tagsArray,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      fileUrl: newResource.fileUrl || null,
      adminEmail: currentAdminEmail,
      adminId: currentAdminId,
      adminName: currentAdminName || 'Administrateur',
      createdAt: new Date().toISOString(),
      isFromAdmin: true
    };
    
    // Sauvegarder dans la clé spécifique à l'admin
    var specificKey = 'admin_resources_' + currentAdminEmail;
    var existingSpecific = JSON.parse(localStorage.getItem(specificKey) || '[]');
    existingSpecific.push(resourceObj);
    localStorage.setItem(specificKey, JSON.stringify(existingSpecific));
    
    // Sauvegarder aussi dans la clé globale
    var existingGlobal = JSON.parse(localStorage.getItem('admin_resources') || '[]');
    existingGlobal.push(resourceObj);
    localStorage.setItem('admin_resources', JSON.stringify(existingGlobal));
    
    console.log('Ressource sauvegardée dans:', specificKey);
    
    // Déclencher le rafraîchissement
    localStorage.setItem('refresh_recommendations', Date.now().toString());
    
    // Réinitialiser le formulaire
    setShowAddResourceModal(false);
    setNewResource({ title: '', type: 'DOCUMENT_OFFICIEL', tags: '', description: '', fileUrl: '' });
    
    // Recharger les ressources
    loadAdminResources();
    
    alert('✅ Ressource ajoutée avec succès !');
  };

  var handleDeleteResource = function(resourceId) {
    if (window.confirm('Supprimer cette ressource ?')) {
      var currentAdminEmail = currentAdmin?.email;
      
      // Supprimer de la clé spécifique
      if (currentAdminEmail) {
        var specificKey = 'admin_resources_' + currentAdminEmail;
        var specificResources = JSON.parse(localStorage.getItem(specificKey) || '[]');
        var updatedSpecific = specificResources.filter(function(r) { return r.id !== resourceId; });
        localStorage.setItem(specificKey, JSON.stringify(updatedSpecific));
      }
      
      // Supprimer de la clé globale
      var globalResources = JSON.parse(localStorage.getItem('admin_resources') || '[]');
      var updatedGlobal = globalResources.filter(function(r) { return r.id !== resourceId; });
      localStorage.setItem('admin_resources', JSON.stringify(updatedGlobal));
      
      loadAdminResources();
      alert('Ressource supprimée');
    }
  };

  var getResourceTypeLabel = function(type) {
    var found = resourceTypes.find(function(t) { return t.value === type; });
    return found ? found.label : type;
  };

  if (loading) {
    return React.createElement('div', { style: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' } },
      React.createElement('div', { style: { width: '40px', height: '40px', border: '3px solid rgba(155, 89, 182, 0.2)', borderTopColor: '#9b59b6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' } })
    );
  }

  return React.createElement('div', { style: { padding: '20px', maxWidth: '1200px', margin: '0 auto' } },
    React.createElement('div', { style: { marginBottom: '30px' } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' } },
        React.createElement('div', null,
          React.createElement('h1', { style: { fontSize: '24px', color: '#1a1a2e', marginBottom: '10px' } }, 'Administration'),
          React.createElement('p', { style: { color: '#666' } }, 
            'Bienvenue ' + (currentAdmin?.name || 'Administrateur') + ' (Email: ' + (currentAdmin?.email || '') + ')'
          )
        ),
        React.createElement('div', { style: { display: 'flex', gap: '10px' } },
          React.createElement('button', { 
            onClick: handleRefresh,
            style: { padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }
          }, React.createElement(FiRefreshCw, { size: 14 }), ' Rafraîchir'),
          React.createElement('button', { 
            onClick: handleFixTeacher,
            style: { padding: '8px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }
          }, '🔧 Rattacher les enseignants')
        )
      )
    ),
    
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '30px' } },
      React.createElement('div', { style: { background: 'white', borderRadius: '15px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } },
        React.createElement(FiUsers, { size: 40, color: '#9b59b6' }),
        React.createElement('div', { style: { fontSize: '28px', fontWeight: 'bold', marginTop: '10px', color: '#1a1a2e' } }, (users || []).length),
        React.createElement('div', { style: { color: '#666' } }, 'Enseignants rattachés')
      ),
      React.createElement('div', { style: { background: 'white', borderRadius: '15px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } },
        React.createElement(FiShield, { size: 40, color: '#f59e0b' }),
        React.createElement('div', { style: { fontSize: '28px', fontWeight: 'bold', marginTop: '10px', color: '#1a1a2e' } }, (adminResources || []).length),
        React.createElement('div', { style: { color: '#666' } }, 'Ressources publiées')
      )
    ),
    
    // Section Ressources
    React.createElement('div', { style: { background: 'white', borderRadius: '15px', padding: '20px', marginBottom: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' } },
        React.createElement('h2', { style: { fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' } },
          React.createElement(FiShield, { size: 20, color: '#f59e0b' }),
          'Mes ressources (visibles par mes enseignants)'
        ),
        React.createElement('button', { 
          onClick: function() { setShowAddResourceModal(true); },
          style: { padding: '8px 16px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }
        }, React.createElement(FiPlus, { size: 14 }), ' Ajouter une ressource')
      ),
      
      (adminResources || []).length === 0 ? 
        React.createElement('div', { style: { textAlign: 'center', padding: '30px', color: '#999', background: '#f8f9fa', borderRadius: '10px' } },
          React.createElement(FiShield, { size: 40, color: '#ccc' }),
          React.createElement('p', { style: { marginTop: '10px' } }, 'Aucune ressource publiée.'),
          React.createElement('p', { style: { fontSize: '12px' } }, 'Cliquez sur "Ajouter une ressource" pour partager des documents avec vos enseignants.')
        ) :
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
          (adminResources || []).map(function(resource) {
            return React.createElement('div', { key: resource.id, style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '10px', borderLeft: '4px solid #f59e0b' } },
              React.createElement('div', { style: { flex: 1 } },
                React.createElement('div', { style: { fontWeight: '500', marginBottom: '5px' } }, resource.title),
                React.createElement('div', { style: { fontSize: '12px', color: '#666', display: 'flex', flexWrap: 'wrap', gap: '10px' } },
                  React.createElement('span', { style: { background: resource.typeColor + '20', color: resource.typeColor, padding: '2px 8px', borderRadius: '12px', fontSize: '10px' } }, getResourceTypeLabel(resource.type)),
                  React.createElement('span', null, '🏷️ ' + (resource.tags || []).join(', ')),
                  React.createElement('span', null, '📅 ' + resource.date)
                )
              ),
              React.createElement('div', { style: { display: 'flex', gap: '8px' } },
                React.createElement('button', { 
                  onClick: function() { setShowResourceDetail(resource); },
                  style: { background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }
                }, React.createElement(FiEye, { size: 12 }), ' Voir'),
                React.createElement('button', { 
                  onClick: function() { handleDeleteResource(resource.id); },
                  style: { background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }
                }, React.createElement(FiTrash2, { size: 12 }), ' Supprimer')
              )
            );
          })
        )
    ),
    
    // Section Enseignants
    React.createElement('div', { style: { background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } },
      React.createElement('h2', { style: { fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' } },
        React.createElement(FiUsers, { size: 20, color: '#9b59b6' }),
        'Mes enseignants'
      ),
      
      React.createElement('div', { style: { marginBottom: '20px' } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px', padding: '8px 12px', maxWidth: '400px' } },
          React.createElement(FiSearch, { size: 18, color: '#999' }),
          React.createElement('input', {
            type: 'text',
            placeholder: 'Rechercher un enseignant...',
            value: searchTerm,
            onChange: function(e) { setSearchTerm(e.target.value); },
            style: { flex: 1, border: 'none', outline: 'none', marginLeft: '8px', background: 'transparent' }
          })
        )
      ),
      
      (filteredUsers || []).length === 0 ? 
        React.createElement('div', { style: { textAlign: 'center', padding: '40px', color: '#999' } },
          React.createElement(FiUsers, { size: 40, color: '#ccc' }),
          React.createElement('p', { style: { marginTop: '10px' } }, searchTerm ? 'Aucun enseignant trouvé' : 'Aucun enseignant rattaché à votre administration.'),
          React.createElement('p', { style: { fontSize: '12px', marginTop: '10px' } }, 'Cliquez sur "Rattacher les enseignants" pour les associer à votre administration.')
        ) :
        React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse' } },
          React.createElement('thead', null,
            React.createElement('tr', { style: { background: '#f8f9fa', borderBottom: '1px solid #e0e0e0' } },
              React.createElement('th', { style: { padding: '12px', textAlign: 'left', color: '#666' } }, 'NOM'),
              React.createElement('th', { style: { padding: '12px', textAlign: 'left', color: '#666' } }, 'EMAIL'),
              React.createElement('th', { style: { padding: '12px', textAlign: 'left', color: '#666' } }, 'SPÉCIALITÉ'),
              React.createElement('th', { style: { padding: '12px', textAlign: 'left', color: '#666' } }, 'TITRE'),
              React.createElement('th', { style: { padding: '12px', textAlign: 'left', color: '#666' } }, 'ACTIONS')
            )
          ),
          React.createElement('tbody', null,
            (filteredUsers || []).map(function(user) {
              return React.createElement('tr', { key: user.id, style: { borderBottom: '1px solid #f0f0f0' } },
                React.createElement('td', { style: { padding: '12px', fontWeight: '500' } }, user.name || 'Non renseigné'),
                React.createElement('td', { style: { padding: '12px', color: '#666' } }, user.email || 'Non renseigné'),
                React.createElement('td', { style: { padding: '12px', color: '#666' } }, user.specialite || 'Non spécifiée'),
                React.createElement('td', { style: { padding: '12px', color: '#666' } }, user.titre || 'Non spécifié'),
                React.createElement('td', { style: { padding: '12px' } },
                  React.createElement('div', { style: { display: 'flex', gap: '8px' } },
                    React.createElement('button', { 
                      onClick: function() { handleEditUser(user); },
                      style: { background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }
                    }, React.createElement(FiEdit2, { size: 12 }), ' Modifier'),
                    React.createElement('button', { 
                      onClick: function() { handleDeleteUser(user.id); },
                      style: { background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }
                    }, React.createElement(FiTrash2, { size: 12 }), ' Supprimer')
                  )
                )
              );
            })
          )
        )
    ),
    
    // Modal d'ajout de ressource
    showAddResourceModal && React.createElement('div', { 
      style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
      onClick: function() { setShowAddResourceModal(false); }
    },
      React.createElement('div', { 
        style: { background: 'white', borderRadius: '20px', width: '550px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' },
        onClick: function(e) { e.stopPropagation(); }
      },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #e0e0e0' } },
          React.createElement('h2', { style: { margin: 0, fontSize: '20px' } }, 'Ajouter une ressource'),
          React.createElement('button', { onClick: function() { setShowAddResourceModal(false); }, style: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' } }, React.createElement(FiX, { size: 20 }))
        ),
        React.createElement('div', { style: { padding: '20px' } },
          React.createElement('div', { style: { marginBottom: '15px' } },
            React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' } }, 'Titre *'),
            React.createElement('input', {
              type: 'text',
              placeholder: 'Titre de la ressource',
              value: newResource.title,
              onChange: function(e) { setNewResource({ ...newResource, title: e.target.value }); },
              style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }
            })
          ),
          React.createElement('div', { style: { marginBottom: '15px' } },
            React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' } }, 'Type'),
            React.createElement('select', {
              value: newResource.type,
              onChange: function(e) { setNewResource({ ...newResource, type: e.target.value }); },
              style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }
            },
              resourceTypes.map(function(type) {
                return React.createElement('option', { key: type.value, value: type.value }, type.label);
              })
            )
          ),
          React.createElement('div', { style: { marginBottom: '15px' } },
            React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' } }, 'Tags (séparés par des virgules) *'),
            React.createElement('input', {
              type: 'text',
              placeholder: 'Ex: Pédagogie, Formation, Innovation',
              value: newResource.tags,
              onChange: function(e) { setNewResource({ ...newResource, tags: e.target.value }); },
              style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }
            }),
            React.createElement('small', { style: { display: 'block', marginTop: '5px', fontSize: '11px', color: '#f59e0b' } }, 
              '💡 Ces tags déterminent quels enseignants verront cette ressource (selon leurs centres d\'intérêt)'
            )
          ),
          React.createElement('div', { style: { marginBottom: '15px' } },
            React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' } }, 'Description'),
            React.createElement('textarea', {
              placeholder: 'Description de la ressource...',
              value: newResource.description,
              onChange: function(e) { setNewResource({ ...newResource, description: e.target.value }); },
              rows: 3,
              style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', resize: 'vertical' }
            })
          ),
          React.createElement('div', { style: { marginBottom: '20px' } },
            React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' } }, 'URL du fichier (optionnel)'),
            React.createElement('input', {
              type: 'text',
              placeholder: 'https://...',
              value: newResource.fileUrl,
              onChange: function(e) { setNewResource({ ...newResource, fileUrl: e.target.value }); },
              style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }
            })
          )
        ),
        React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '20px', borderTop: '1px solid #e0e0e0' } },
          React.createElement('button', { onClick: function() { setShowAddResourceModal(false); }, style: { padding: '8px 16px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' } }, 'Annuler'),
          React.createElement('button', { onClick: handleAddResource, style: { padding: '8px 16px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' } }, 'Ajouter')
        )
      )
    ),
    
    // Modal de détail de ressource
    showResourceDetail && React.createElement('div', { 
      style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
      onClick: function() { setShowResourceDetail(null); }
    },
      React.createElement('div', { 
        style: { background: 'white', borderRadius: '20px', width: '500px', maxWidth: '90%' },
        onClick: function(e) { e.stopPropagation(); }
      },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #e0e0e0' } },
          React.createElement('h2', { style: { margin: 0, fontSize: '20px' } }, showResourceDetail.title),
          React.createElement('button', { onClick: function() { setShowResourceDetail(null); }, style: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' } }, React.createElement(FiX, { size: 20 }))
        ),
        React.createElement('div', { style: { padding: '20px' } },
          React.createElement('p', { style: { color: '#666', marginBottom: '15px' } }, showResourceDetail.description),
          React.createElement('div', { style: { marginBottom: '10px' } },
            React.createElement('strong', null, 'Type: '),
            React.createElement('span', { style: { background: showResourceDetail.typeColor + '20', color: showResourceDetail.typeColor, padding: '2px 8px', borderRadius: '12px', fontSize: '12px' } }, getResourceTypeLabel(showResourceDetail.type))
          ),
          React.createElement('div', { style: { marginBottom: '10px' } },
            React.createElement('strong', null, 'Tags: '),
            React.createElement('span', null, (showResourceDetail.tags || []).join(', '))
          ),
          React.createElement('div', { style: { marginBottom: '10px' } },
            React.createElement('strong', null, 'Date: '),
            React.createElement('span', null, showResourceDetail.date)
          ),
          React.createElement('div', { style: { marginBottom: '10px' } },
            React.createElement('strong', null, 'Publié par: '),
            React.createElement('span', null, showResourceDetail.adminName)
          ),
          showResourceDetail.fileUrl && React.createElement('div', { style: { marginTop: '15px' } },
            React.createElement('a', { 
              href: showResourceDetail.fileUrl, 
              target: '_blank', 
              rel: 'noopener noreferrer',
              style: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: '#10b981', color: 'white', borderRadius: '8px', textDecoration: 'none' }
            }, React.createElement(FiDownload, { size: 14 }), ' Télécharger')
          )
        ),
        React.createElement('div', { style: { padding: '20px', borderTop: '1px solid #e0e0e0', textAlign: 'right' } },
          React.createElement('button', { onClick: function() { setShowResourceDetail(null); }, style: { padding: '8px 16px', background: '#9b59b6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' } }, 'Fermer')
        )
      )
    ),
    
    // Modal d'édition d'enseignant
    isEditing && React.createElement('div', { 
      style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
      onClick: function() { setIsEditing(false); }
    },
      React.createElement('div', { 
        style: { background: 'white', borderRadius: '20px', width: '500px', maxWidth: '90%', padding: '20px' },
        onClick: function(e) { e.stopPropagation(); }
      },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' } },
          React.createElement('h2', { style: { margin: 0 } }, 'Modifier l\'enseignant'),
          React.createElement('button', { onClick: function() { setIsEditing(false); }, style: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' } }, React.createElement(FiX, { size: 20 }))
        ),
        React.createElement('div', { style: { marginBottom: '15px' } },
          React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '500' } }, 'Nom complet'),
          React.createElement('input', {
            type: 'text',
            value: editForm.name || '',
            onChange: function(e) { setEditForm({ ...editForm, name: e.target.value }); },
            style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }
          })
        ),
        React.createElement('div', { style: { marginBottom: '15px' } },
          React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '500' } }, 'Email'),
          React.createElement('input', {
            type: 'email',
            value: editForm.email || '',
            onChange: function(e) { setEditForm({ ...editForm, email: e.target.value }); },
            style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }
          })
        ),
        React.createElement('div', { style: { marginBottom: '15px' } },
          React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '500' } }, 'Téléphone'),
          React.createElement('input', {
            type: 'text',
            value: editForm.telephone || '',
            onChange: function(e) { setEditForm({ ...editForm, telephone: e.target.value }); },
            style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }
          })
        ),
        React.createElement('div', { style: { marginBottom: '15px' } },
          React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '500' } }, 'Spécialité'),
          React.createElement('input', {
            type: 'text',
            value: editForm.specialite || '',
            onChange: function(e) { setEditForm({ ...editForm, specialite: e.target.value }); },
            style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }
          })
        ),
        React.createElement('div', { style: { marginBottom: '15px' } },
          React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '500' } }, 'Département'),
          React.createElement('input', {
            type: 'text',
            value: editForm.departement || '',
            onChange: function(e) { setEditForm({ ...editForm, departement: e.target.value }); },
            style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }
          })
        ),
        React.createElement('div', { style: { marginBottom: '20px' } },
          React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '500' } }, 'Titre / Grade'),
          React.createElement('input', {
            type: 'text',
            value: editForm.titre || '',
            onChange: function(e) { setEditForm({ ...editForm, titre: e.target.value }); },
            style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }
          })
        ),
        React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '10px' } },
          React.createElement('button', { onClick: function() { setIsEditing(false); }, style: { padding: '8px 16px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' } }, 'Annuler'),
          React.createElement('button', { onClick: handleSaveEdit, style: { padding: '8px 16px', background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' } }, React.createElement(FiSave, { size: 14 }), ' Sauvegarder')
        )
      )
    )
  );
};

export default Administration;