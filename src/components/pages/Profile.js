import React, { useState, useEffect, useCallback } from 'react';
import { FiEdit2, FiSave, FiX, FiMail, FiPhone, FiCalendar, FiMapPin, FiBookOpen, FiUsers, FiAward, FiClock, FiEye, FiDownload, FiUser, FiUserCheck } from 'react-icons/fi';
import api from '../../services/api';
import userStats from '../../utils/userStats';


var Profile = function({ userData, onUpdateProfile, interests, onAddInterest, onRemoveInterest, userRole }) {
  var [isEditing, setIsEditing] = useState(false);
  var [editedProfile, setEditedProfile] = useState(userData);
  var [loading, setLoading] = useState(false);
  var [recentResources, setRecentResources] = useState([]);
  var [stats, setStats] = useState({
    totalViews: 0,
    totalDownloads: 0,
    resourcesCount: 0,
    topPercent: 0,
    rank: 0,
    totalStudents: 0,
    averageViews: 0
  });

  var loadRecentResources = function() {
    var currentUserId = localStorage.getItem('current_user_id');
    if (!currentUserId) return;
    var userViewKey = 'recently_viewed_' + currentUserId;
    var viewedResources = JSON.parse(localStorage.getItem(userViewKey) || '[]');
    setRecentResources(viewedResources.slice(0, 5));
  };

  var loadRealStats = useCallback(function() {
    var currentUserId = localStorage.getItem('current_user_id');
    if (!currentUserId) return;
    
    var viewedResources = userStats.getUserViews(currentUserId);
    var downloadedResources = userStats.getUserDownloads(currentUserId);
    
    var currentUserViews = viewedResources.length;
    var totalDownloads = downloadedResources.length;
    
    var allUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
    var allStudents = allUsers.filter(function(user) {
      return user.role === 'ETUDIANT';
    });
    
    var studentActivities = [];
    
    allStudents.forEach(function(student) {
      var studentViews = userStats.getUserViews(student.id).length;
      studentActivities.push({
        id: student.id,
        name: student.name,
        views: studentViews
      });
    });
    
    studentActivities.sort(function(a, b) { return b.views - a.views; });
    
    var rank = 1;
    for (var i = 0; i < studentActivities.length; i++) {
      if (studentActivities[i].id === currentUserId) {
        rank = i + 1;
        break;
      }
    }
    
    var totalStudents = studentActivities.length;
    var topPercent = 0;
    if (totalStudents > 0) {
      var percentBetter = ((rank - 1) / totalStudents) * 100;
      topPercent = Math.round(100 - percentBetter);
      topPercent = Math.max(1, Math.min(99, topPercent));
    } else {
      topPercent = 100;
    }
    
    var totalViewsAll = studentActivities.reduce(function(sum, s) { return sum + s.views; }, 0);
    var averageViews = totalStudents > 0 ? Math.round(totalViewsAll / totalStudents) : 0;
    
    setStats({
      totalViews: currentUserViews,
      totalDownloads: totalDownloads,
      resourcesCount: recentResources.length,
      topPercent: topPercent,
      rank: rank,
      totalStudents: totalStudents,
      averageViews: averageViews
    });
  }, [recentResources.length]);

  useEffect(function() {
    loadRecentResources();
    loadRealStats();
    
    var handleStorageChange = function(e) {
      loadRecentResources();
      loadRealStats();
    };
    window.addEventListener('storage', handleStorageChange);
    return function() { window.removeEventListener('storage', handleStorageChange); };
  }, [loadRealStats]);

  var handleSave = async function() {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await api.put(`/users/${user.id}`, editedProfile);
      onUpdateProfile(editedProfile);
      setIsEditing(false);
      alert('Profil mis à jour avec succès !');
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  var savedUserData = localStorage.getItem('user_data');
  var userInfo = savedUserData ? JSON.parse(savedUserData) : {};

  var handleViewResource = function(resource) {
    var currentUserId = localStorage.getItem('current_user_id');
    if (!currentUserId) return;
    
    var userViewKey = 'recently_viewed_' + currentUserId;
    var viewedResources = JSON.parse(localStorage.getItem(userViewKey) || '[]');
    viewedResources = viewedResources.filter(function(r) { return r.id !== resource.id; });
    viewedResources.unshift({
      id: resource.id,
      title: resource.title,
      type: resource.type,
      date: new Date().toLocaleDateString('fr-FR'),
      fileUrl: resource.fileUrl
    });
    localStorage.setItem(userViewKey, JSON.stringify(viewedResources.slice(0, 10)));
    localStorage.setItem('recently_viewed', JSON.stringify(viewedResources.slice(0, 10)));
    
    window.dispatchEvent(new Event('storage'));
    loadRealStats();
    
    if (resource.fileUrl) {
      window.open(resource.fileUrl, '_blank');
    } else {
      var blob = new Blob(["Contenu du fichier: " + resource.title], { type: 'application/pdf' });
      var url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    }
  };

  var handleDownloadResource = function(resource) {
    var currentUserId = localStorage.getItem('current_user_id');
    if (!currentUserId) return;
    
    var userDownloadKey = 'downloaded_resources_' + currentUserId;
    var downloadedResources = JSON.parse(localStorage.getItem(userDownloadKey) || '[]');
    downloadedResources.unshift({
      id: resource.id,
      title: resource.title,
      type: resource.type,
      date: new Date().toISOString().split('T')[0]
    });
    localStorage.setItem(userDownloadKey, JSON.stringify(downloadedResources.slice(0, 50)));
    localStorage.setItem('downloaded_resources', JSON.stringify(downloadedResources.slice(0, 50)));
    
    var userViewKey = 'recently_viewed_' + currentUserId;
    var viewedResources = JSON.parse(localStorage.getItem(userViewKey) || '[]');
    viewedResources = viewedResources.filter(function(r) { return r.id !== resource.id; });
    viewedResources.unshift({
      id: resource.id,
      title: resource.title,
      type: resource.type,
      date: new Date().toLocaleDateString('fr-FR'),
      fileUrl: resource.fileUrl
    });
    localStorage.setItem(userViewKey, JSON.stringify(viewedResources.slice(0, 10)));
    localStorage.setItem('recently_viewed', JSON.stringify(viewedResources.slice(0, 10)));
    
    window.dispatchEvent(new Event('storage'));
    loadRealStats();
    
    if (resource.fileUrl) {
      var link = document.createElement('a');
      link.href = resource.fileUrl;
      link.download = resource.title.replace(/[^a-z0-9]/gi, '_') + '.pdf';
      link.click();
    } else {
      var blob = new Blob(["Contenu du fichier: " + resource.title], { type: 'application/pdf' });
      var url = URL.createObjectURL(blob);
      var anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = resource.title.replace(/[^a-z0-9]/gi, '_') + '.pdf';
      anchor.click();
      URL.revokeObjectURL(url);
    }
  };

  // Vue Enseignant
  if (userRole === 'ENSEIGNANT') {
    return React.createElement('div', { style: { padding: '20px', maxWidth: '1200px', margin: '0 auto' } },
      React.createElement('div', { style: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '20px', padding: '30px', marginBottom: '30px', color: 'white' } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '25px', flexWrap: 'wrap' } },
          React.createElement('div', { style: { width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
            React.createElement(FiUserCheck, { size: 40, color: 'white' })
          ),
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '10px' } },
              React.createElement('h1', { style: { fontSize: '28px', margin: 0, color: 'white' } }, userData?.name || userInfo.name || 'Enseignant'),
              React.createElement('button', { 
                onClick: function() { setIsEditing(true); }, 
                style: { background: 'rgba(255,255,255,0.2)', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' } 
              }, React.createElement(FiEdit2, { size: 14 }), ' Modifier')
            ),
            React.createElement('p', { style: { fontSize: '16px', marginBottom: '15px', opacity: 0.9 } }, userData?.departement || userInfo.departement || 'Département non spécifié'),
            React.createElement('div', { style: { display: 'flex', gap: '15px', flexWrap: 'wrap' } },
              React.createElement('span', { style: { background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '20px', fontSize: '13px' } }, '👨‍🏫 ' + (userData?.titre || userInfo.titre || 'Enseignant')),
              React.createElement('span', { style: { background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '20px', fontSize: '13px' } }, '📚 ' + (userData?.specialite || userInfo.specialite || 'Spécialité non spécifiée'))
            )
          )
        )
      ),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' } },
        React.createElement('div', { style: { background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } },
          React.createElement('h3', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#1a1a2e' } }, React.createElement(FiBookOpen, { size: 20 }), ' Informations professionnelles'),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
            React.createElement('div', { style: { display: 'flex', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' } },
              React.createElement('strong', { style: { width: '140px', color: '#666' } }, 'Département:'),
              React.createElement('span', { style: { color: '#333' } }, userData?.departement || userInfo.departement || 'Non spécifié')
            ),
            React.createElement('div', { style: { display: 'flex', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' } },
              React.createElement('strong', { style: { width: '140px', color: '#666' } }, 'Spécialité:'),
              React.createElement('span', { style: { color: '#333' } }, userData?.specialite || userInfo.specialite || 'Non spécifiée')
            ),
            React.createElement('div', { style: { display: 'flex', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' } },
              React.createElement('strong', { style: { width: '140px', color: '#666' } }, 'Titre / Grade:'),
              React.createElement('span', { style: { color: '#333' } }, userData?.titre || userInfo.titre || 'Non spécifié')
            ),
            React.createElement('div', { style: { display: 'flex', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' } },
              React.createElement('strong', { style: { width: '140px', color: '#666' } }, 'Bureau:'),
              React.createElement('span', { style: { color: '#333' } }, userData?.bureau || userInfo.bureau || 'Non spécifié')
            ),
            React.createElement('div', { style: { display: 'flex' } },
              React.createElement('strong', { style: { width: '140px', color: '#666' } }, 'Heures de cours:'),
              React.createElement('span', { style: { color: '#333' } }, userData?.heuresCours || userInfo.heuresCours || '18h/semaine')
            )
          )
        ),
        React.createElement('div', { style: { background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } },
          React.createElement('h3', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#1a1a2e' } }, React.createElement(FiUsers, { size: 20 }), ' Contact'),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' } },
              React.createElement(FiMail, { size: 18, color: '#9b59b6' }),
              React.createElement('span', { style: { color: '#333' } }, userData?.email || userInfo.email || 'Non renseigné')
            ),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' } },
              React.createElement(FiPhone, { size: 18, color: '#9b59b6' }),
              React.createElement('span', { style: { color: '#333' } }, userData?.telephone || userInfo.telephone || 'Non renseigné')
            ),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' } },
              React.createElement(FiCalendar, { size: 18, color: '#9b59b6' }),
              React.createElement('span', { style: { color: '#333' } }, userData?.dateNaissance || userInfo.dateNaissance || 'Non renseignée')
            ),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
              React.createElement(FiMapPin, { size: 18, color: '#9b59b6' }),
              React.createElement('span', { style: { color: '#333' } }, userData?.adresse || userInfo.adresse || 'Non renseignée')
            )
          )
        )
      )
    );
  }

  // Vue Étudiant
  return React.createElement('div', { style: { padding: '20px', maxWidth: '1200px', margin: '0 auto' } },
    React.createElement('div', { style: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '20px', padding: '30px', marginBottom: '30px', color: 'white', display: 'flex', gap: '30px', alignItems: 'center', flexWrap: 'wrap' } },
      React.createElement('div', { style: { width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
        React.createElement(FiUser, { size: 40, color: 'white' })
      ),
      React.createElement('div', { style: { flex: 1 } },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '10px' } },
          React.createElement('h1', { style: { fontSize: '28px', margin: 0, color: 'white' } }, userData?.name || userInfo.name || 'Étudiant'),
          React.createElement('button', { 
            onClick: function() { setIsEditing(true); }, 
            style: { background: 'rgba(255,255,255,0.2)', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' } 
          }, React.createElement(FiEdit2, { size: 14 }), ' Modifier')
        ),
        React.createElement('p', { style: { fontSize: '16px', marginBottom: '15px', opacity: 0.9 } }, userData?.program || userInfo.program || 'Master II en Intelligence Artificielle & Big Data'),
        React.createElement('div', { style: { display: 'flex', gap: '15px', flexWrap: 'wrap' } },
          React.createElement('span', { style: { background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '20px', fontSize: '13px' } }, userData?.promo || userInfo.promo || 'Promo LUMIÈRE 2024'),
          React.createElement('span', { style: { background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '20px', fontSize: '13px' } }, 'Crédits ' + (userData?.credits?.current || userInfo.creditsObj?.current || '112') + ' / ' + (userData?.credits?.total || userInfo.creditsObj?.total || '120')),
          React.createElement('span', { style: { background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '20px', fontSize: '13px' } }, 'Moyenne ' + (userData?.average || userInfo.average || '16.4') + ' / 20')
        )
      )
    ),

    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' } },
      React.createElement('div', { style: { background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } },
        React.createElement('h3', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#1a1a2e' } }, React.createElement(FiUsers, { size: 20 }), ' Informations personnelles'),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
          React.createElement('div', { style: { display: 'flex', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' } },
            React.createElement('strong', { style: { width: '140px', color: '#666' } }, 'Nom complet:'),
            React.createElement('span', { style: { color: '#333' } }, userData?.name || userInfo.name || 'Non renseigné')
          ),
          React.createElement('div', { style: { display: 'flex', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' } },
            React.createElement('strong', { style: { width: '140px', color: '#666' } }, 'Email:'),
            React.createElement('span', { style: { color: '#333' } }, userData?.email || userInfo.email || 'Non renseigné')
          ),
          React.createElement('div', { style: { display: 'flex', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' } },
            React.createElement('strong', { style: { width: '140px', color: '#666' } }, 'Téléphone:'),
            React.createElement('span', { style: { color: '#333' } }, userData?.telephone || userInfo.telephone || 'Non renseigné')
          ),
          React.createElement('div', { style: { display: 'flex', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' } },
            React.createElement('strong', { style: { width: '140px', color: '#666' } }, 'Date de naissance:'),
            React.createElement('span', { style: { color: '#333' } }, userData?.dateNaissance || userInfo.dateNaissance || 'Non renseignée')
          ),
          React.createElement('div', { style: { display: 'flex', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' } },
            React.createElement('strong', { style: { width: '140px', color: '#666' } }, 'Adresse:'),
            React.createElement('span', { style: { color: '#333' } }, userData?.adresse || userInfo.adresse || 'Non renseignée')
          ),
          React.createElement('div', { style: { display: 'flex', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' } },
            React.createElement('strong', { style: { width: '140px', color: '#666' } }, 'Filière:'),
            React.createElement('span', { style: { color: '#333' } }, userData?.filiere || userInfo.filiere || 'Non spécifiée')
          ),
          React.createElement('div', { style: { display: 'flex' } },
            React.createElement('strong', { style: { width: '140px', color: '#666' } }, 'Niveau:'),
            React.createElement('span', { style: { color: '#333' } }, userData?.niveau || userInfo.niveau || 'Non spécifié')
          )
        )
      ),
      
      React.createElement('div', { style: { background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } },
        React.createElement('h3', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#1a1a2e' } }, 
          React.createElement(FiAward, { size: 20 }), ' Classement'
        ),
        React.createElement('div', { style: { textAlign: 'center', padding: '10px' } },
          React.createElement('div', { style: { fontSize: '48px', fontWeight: 'bold', color: '#9b59b6' } }, 
            stats.topPercent <= 10 ? '🏆 Top ' + stats.topPercent + '%' : 'Top ' + stats.topPercent + '%'
          ),
          React.createElement('div', { style: { fontSize: '14px', color: '#666', marginTop: '5px' } }, 
            'sur ' + stats.totalStudents + ' étudiants'
          ),
          React.createElement('div', { style: { fontSize: '12px', color: '#999', marginTop: '5px' } }, 
            'Rang #' + stats.rank + ' • Moyenne générale: ' + stats.averageViews + ' consultations'
          ),
          React.createElement('hr', { style: { margin: '20px 0', border: 'none', borderTop: '1px solid #eee' } }),
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' } },
            React.createElement('div', { style: { textAlign: 'center' } },
              React.createElement('div', { style: { fontSize: '32px', fontWeight: 'bold', color: '#1a1a2e' } }, stats.totalViews),
              React.createElement('div', { style: { fontSize: '12px', color: '#666' } }, 'ressources consultées')
            ),
            React.createElement('div', { style: { textAlign: 'center' } },
              React.createElement('div', { style: { fontSize: '32px', fontWeight: 'bold', color: '#1a1a2e' } }, stats.totalDownloads),
              React.createElement('div', { style: { fontSize: '12px', color: '#666' } }, 'téléchargements')
            )
          )
        )
      )
    ),

    React.createElement('div', { style: { background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } },
      React.createElement('h3', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#1a1a2e' } },
        React.createElement(FiClock, { size: 20 }), ' Ressources récemment consultées'
      ),
      (recentResources || []).length === 0 ? 
        React.createElement('div', { style: { textAlign: 'center', padding: '30px', color: '#999' } },
          React.createElement(FiEye, { size: 40, color: '#ccc' }),
          React.createElement('p', { style: { marginTop: '10px' } }, 'Aucune ressource consultée récemment.'),
          React.createElement('p', { style: { fontSize: '12px' } }, 'Explorez la bibliothèque pour découvrir des ressources !')
        ) :
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
          (recentResources || []).map(function(resource, index) {
            return React.createElement('div', { 
              key: resource.id || index, 
              style: { 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '10px',
                borderLeft: '3px solid #9b59b6'
              }
            },
              React.createElement('div', { style: { flex: 1 } },
                React.createElement('div', { style: { fontWeight: '500', marginBottom: '5px' } }, resource.title),
                React.createElement('div', { style: { fontSize: '12px', color: '#666' } }, resource.type || 'Ressource'),
                React.createElement('div', { style: { fontSize: '11px', color: '#999', marginTop: '3px' } }, 'Consulté le ' + (resource.date || new Date().toLocaleDateString('fr-FR')))
              ),
              React.createElement('div', { style: { display: 'flex', gap: '8px' } },
                React.createElement('button', { 
                  onClick: function() { handleViewResource(resource); },
                  style: { background: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }
                }, React.createElement(FiEye, { size: 12 }), ' Voir'),
                React.createElement('button', { 
                  onClick: function() { handleDownloadResource(resource); },
                  style: { background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }
                }, React.createElement(FiDownload, { size: 12 }), ' Télécharger')
              )
            );
          })
        )
    ),

    isEditing && React.createElement('div', { 
      style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
      onClick: function() { setIsEditing(false); }
    },
      React.createElement('div', { 
        style: { background: 'white', borderRadius: '20px', width: '500px', maxWidth: '90%', padding: '20px' },
        onClick: function(e) { e.stopPropagation(); }
      },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' } },
          React.createElement('h2', { style: { margin: 0 } }, 'Modifier le profil'),
          React.createElement('button', { onClick: function() { setIsEditing(false); }, style: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' } }, React.createElement(FiX, { size: 20 }))
        ),
        React.createElement('div', { style: { marginBottom: '15px' } },
          React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '500' } }, 'Nom complet'),
          React.createElement('input', {
            type: 'text',
            value: editedProfile?.name || '',
            onChange: function(e) { setEditedProfile({ ...editedProfile, name: e.target.value }); },
            style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }
          })
        ),
        React.createElement('div', { style: { marginBottom: '15px' } },
          React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '500' } }, 'Email'),
          React.createElement('input', {
            type: 'email',
            value: editedProfile?.email || '',
            onChange: function(e) { setEditedProfile({ ...editedProfile, email: e.target.value }); },
            style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }
          })
        ),
        React.createElement('div', { style: { marginBottom: '15px' } },
          React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '500' } }, 'Téléphone'),
          React.createElement('input', {
            type: 'text',
            value: editedProfile?.telephone || '',
            onChange: function(e) { setEditedProfile({ ...editedProfile, telephone: e.target.value }); },
            style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }
          })
        ),
        React.createElement('div', { style: { marginBottom: '15px' } },
          React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '500' } }, 'Adresse'),
          React.createElement('input', {
            type: 'text',
            value: editedProfile?.adresse || '',
            onChange: function(e) { setEditedProfile({ ...editedProfile, adresse: e.target.value }); },
            style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }
          })
        ),
        React.createElement('div', { style: { marginBottom: '15px' } },
          React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '500' } }, 'Filière'),
          React.createElement('input', {
            type: 'text',
            value: editedProfile?.filiere || '',
            onChange: function(e) { setEditedProfile({ ...editedProfile, filiere: e.target.value }); },
            style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }
          })
        ),
        React.createElement('div', { style: { marginBottom: '20px' } },
          React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '500' } }, 'Niveau'),
          React.createElement('select', {
            value: editedProfile?.niveau || 'L1',
            onChange: function(e) { setEditedProfile({ ...editedProfile, niveau: e.target.value }); },
            style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }
          },
            React.createElement('option', { value: 'L1' }, 'L1'),
            React.createElement('option', { value: 'L2' }, 'L2'),
            React.createElement('option', { value: 'L3' }, 'L3'),
            React.createElement('option', { value: 'M1' }, 'M1'),
            React.createElement('option', { value: 'M2' }, 'M2'),
            React.createElement('option', { value: 'Doctorat' }, 'Doctorat')
          )
        ),
        React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '10px' } },
          React.createElement('button', { onClick: function() { setIsEditing(false); }, style: { padding: '8px 16px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' } }, 'Annuler'),
          React.createElement('button', { onClick: handleSave, disabled: loading, style: { padding: '8px 16px', background: loading ? '#ccc' : 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' } }, React.createElement(FiSave, { size: 14 }), loading ? 'Sauvegarde...' : 'Sauvegarder')
        )
      )
    )
  );
};

export default Profile;