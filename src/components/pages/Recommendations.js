import React, { useState, useEffect } from 'react';
import { FiBookmark, FiDownload, FiEye, FiShare2, FiCalendar, FiAlertCircle, FiUser, FiTag, FiShield } from 'react-icons/fi';
import userStats from '../../utils/userStats';

var Recommendations = function({ userRole, userData, onNavigate }) {
  var [filter, setFilter] = useState('all');
  var [recommendations, setRecommendations] = useState([]);
  var [loading, setLoading] = useState(true);
  var [savedItems, setSavedItems] = useState([]);
  var [userInterests, setUserInterests] = useState([]);
  var [userDepartment, setUserDepartment] = useState('');
  var [currentUserId, setCurrentUserId] = useState(null);
  var [currentAdminEmail, setCurrentAdminEmail] = useState('');
  var [adminResources, setAdminResources] = useState([]);

  var loadCurrentUser = function() {
    var userInfo = JSON.parse(localStorage.getItem('user_data') || '{}');
    var dashboardData = JSON.parse(localStorage.getItem('dashboard_data') || '{}');
    
    setCurrentUserId(userInfo.id);
    var adminEmail = userInfo.adminEmail || dashboardData.profile?.adminEmail;
    setCurrentAdminEmail(adminEmail);
    setUserDepartment(dashboardData.profile?.departement || userInfo.departement || '');
  };

  var loadUserInterests = function() {
    var userInfo = JSON.parse(localStorage.getItem('user_data') || '{}');
    var dashboardData = JSON.parse(localStorage.getItem('dashboard_data') || '{}');
    var interests = userInfo.interests || dashboardData.profile?.interests || [];
    setUserInterests(interests);
  };

  var loadUserDepartment = function() {
    var dashboardData = JSON.parse(localStorage.getItem('dashboard_data') || '{}');
    var department = dashboardData.profile?.departement || '';
    setUserDepartment(department);
  };

  var loadSavedResources = function() {
    var saved = localStorage.getItem('saved_resources');
    if (saved) {
      var savedIds = JSON.parse(saved).map(function(r) { return r.id; });
      setSavedItems(savedIds);
    }
  };

  var loadAdminResources = function() {
    if (!currentAdminEmail) {
      setAdminResources([]);
      return;
    }
    
    var specificKey = 'admin_resources_' + currentAdminEmail;
    var specificResources = JSON.parse(localStorage.getItem(specificKey) || '[]');
    var globalResources = JSON.parse(localStorage.getItem('admin_resources') || '[]');
    var filteredGlobal = globalResources.filter(function(r) {
      return r.adminEmail === currentAdminEmail;
    });
    
    var allResources = [...specificResources, ...filteredGlobal];
    var uniqueIds = {};
    var uniqueResources = allResources.filter(function(r) {
      if (!uniqueIds[r.id]) {
        uniqueIds[r.id] = true;
        return true;
      }
      return false;
    });
    
    setAdminResources(uniqueResources);
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
  var loadRecommendations = function() {
    setLoading(true);
    setTimeout(function() {
      var allResources = JSON.parse(localStorage.getItem('teacher_resources') || '[]');
      
      if (userRole === 'ENSEIGNANT') {
        // 1. EXCLURE SES PROPRES RESSOURCES
        var otherResources = allResources.filter(function(resource) {
          return String(resource.teacherId) !== String(currentUserId);
        });
        
        console.log('📚 Ressources des autres enseignants:', otherResources.length);
        console.log('🚫 Mes ressources exclues:', allResources.length - otherResources.length);
        
        // 2. RESSOURCES DES AUTRES ENSEIGNANTS DU MÊME DÉPARTEMENT
        var sameDepartmentResources = otherResources.filter(function(resource) {
          var hasSameDept = resource.departement && resource.departement.toLowerCase() === userDepartment.toLowerCase();
          if (hasSameDept) {
            console.log('✅ Ressource du même département:', resource.title, '(par', resource.teacherName, ')');
          }
          return hasSameDept;
        });
        
        console.log('📚 Ressources du même département (hors moi):', sameDepartmentResources.length);
        
        var resourcesWithScores = sameDepartmentResources.map(function(resource) {
          var score = calculateMatchScore(resource.tags || [], userInterests);
          var matchLevel = score >= 70 ? '⭐ Excellente correspondance' : (score >= 40 ? '👍 Bonne correspondance' : '📚 Ressource recommandée');
          return { ...resource, matchScore: score, matchLevel: matchLevel, source: 'department' };
        });
        
        resourcesWithScores.sort(function(a, b) { return b.matchScore - a.matchScore; });
        
        // 3. RESSOURCES DE L'ADMINISTRATION
        var adminFormatted = adminResources.map(function(r) {
          return {
            ...r,
            id: r.id,
            title: r.title,
            type: r.typeLabel || r.type || 'RESSOURCE_ADMIN',
            tags: r.tags || [],
            description: r.description,
            date: r.date,
            fileUrl: r.fileUrl,
            teacherName: r.adminName || 'Administration',
            source: 'admin',
            matchScore: 100,
            matchLevel: '🏛️ Ressource officielle',
            isFromAdmin: true
          };
        });
        
        var allRecommendations = [...adminFormatted, ...resourcesWithScores];
        
        console.log('📊 Recommandations totales:', allRecommendations.length);
        console.log('   - Administration:', adminFormatted.length);
        console.log('   - Même département (hors moi):', resourcesWithScores.length);
        
        setRecommendations(allRecommendations);
        
      } else {
        // VUE ÉTUDIANT - Filtrer par centres d'intérêt (tags)
        if (!userInterests || userInterests.length === 0) {
          setRecommendations([]);
          setLoading(false);
          return;
        }
        
        // Filtrer les ressources dont les TAGS correspondent aux intérêts de l'étudiant
        var matchingResources = allResources.filter(function(resource) {
          if (!resource.tags || resource.tags.length === 0) return false;
          
          return resource.tags.some(function(tag) {
            return userInterests.some(function(interest) {
              if (!tag || !interest) return false;
              var tagLower = tag.toLowerCase();
              var interestLower = interest.toLowerCase();
              return tagLower.includes(interestLower) || interestLower.includes(tagLower);
            });
          });
        });
        
        console.log('🎯 Ressources matching par intérêts:', matchingResources.length);
        
        resourcesWithScores = matchingResources.map(function(resource) {
          var score = calculateMatchScore(resource.tags || [], userInterests);
          var matchLevel = score >= 70 ? '⭐ Excellente correspondance' : (score >= 40 ? '👍 Bonne correspondance' : '📚 Ressource recommandée');
          return { ...resource, matchScore: score, matchLevel: matchLevel };
        });
        
        resourcesWithScores.sort(function(a, b) { return b.matchScore - a.matchScore; });
        setRecommendations(resourcesWithScores);
      }
      
      setLoading(false);
    }, 500);
  };

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
      var fileUrlBlob = URL.createObjectURL(blob);
      window.open(fileUrlBlob, '_blank');
      setTimeout(function() { URL.revokeObjectURL(fileUrlBlob); }, 1000);
    }
  };

  var downloadFile = function(fileUrl, title) {
    if (fileUrl && fileUrl !== '/files/undefined' && fileUrl !== 'null') {
      var downloadLink = document.createElement('a');
      downloadLink.href = fileUrl;
      downloadLink.download = title.replace(/[^a-z0-9]/gi, '_') + '.pdf';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } else {
      var content = `<h1>${title}</h1><p>Document téléchargé depuis The Curator</p>`;
      var blob = new Blob([content], { type: 'application/pdf' });
      var fileUrlBlob = URL.createObjectURL(blob);
      var downloadAnchor = document.createElement('a');
      downloadAnchor.href = fileUrlBlob;
      downloadAnchor.download = title.replace(/[^a-z0-9]/gi, '_') + '.pdf';
      downloadAnchor.click();
      setTimeout(function() { URL.revokeObjectURL(fileUrlBlob); }, 1000);
    }
  };


var handleView = function(item) {
  // 1. Incrémenter les vues globales de la ressource
  var allResources = JSON.parse(localStorage.getItem('teacher_resources') || '[]');
  var updatedResources = allResources.map(function(r) {
    if (r.id === item.id && item.source !== 'admin') {
      return { ...r, views: (r.views || 0) + 1 };
    }
    return r;
  });
  localStorage.setItem('teacher_resources', JSON.stringify(updatedResources));
  
  // 2. Sauvegarder dans l'historique de l'utilisateur
   userStats.addView(item.id, item.title, item.type, item.fileUrl, item.teacherName);
  
  // 3. Ouvrir le fichier
  openFile(item.fileUrl, item.title);
};

var handleDownload = function(item) {
  // 1. Incrémenter les téléchargements globaux de la ressource
  var allResources = JSON.parse(localStorage.getItem('teacher_resources') || '[]');
  var updatedResources = allResources.map(function(r) {
    if (r.id === item.id && item.source !== 'admin') {
      return { ...r, downloads: (r.downloads || 0) + 1 };
    }
    return r;
  });
  localStorage.setItem('teacher_resources', JSON.stringify(updatedResources));
  
  // 2. Sauvegarder dans l'historique de l'utilisateur
  userStats.addDownload(item.id, item.title, item.type, item.fileUrl, item.teacherName);
  
  // 3. Télécharger le fichier
  downloadFile(item.fileUrl, item.title);
};

  var handleSave = function(id, item) {
    var saved = localStorage.getItem('saved_resources');
    var savedResources = saved ? JSON.parse(saved) : [];
    if (savedItems.includes(id)) {
      localStorage.setItem('saved_resources', JSON.stringify(savedResources.filter(function(r) { return r.id !== id; })));
      setSavedItems(savedItems.filter(function(i) { return i !== id; }));
      alert('Ressource retirée des favoris');
    } else {
      localStorage.setItem('saved_resources', JSON.stringify([...savedResources, { 
        id: id, 
        title: item.title, 
        type: item.type, 
        date: item.date, 
        fileUrl: item.fileUrl,
        teacherName: item.teacherName
      }]));
      setSavedItems([...savedItems, id]);
      alert('Ressource sauvegardée !');
    }
  };

  var handleShare = function(title) {
    navigator.clipboard.writeText(title + ' - The Curator');
    alert('Lien copié dans le presse-papier !');
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(function() {
    loadCurrentUser();
    loadUserInterests();
    loadUserDepartment();
    loadSavedResources();
  }, []);

  useEffect(function() {
    if (currentAdminEmail) {
      loadAdminResources();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAdminEmail]);

  useEffect(function() {
    if (userRole === 'ENSEIGNANT' && currentUserId) {
      loadRecommendations();
    } else if (userRole === 'ETUDIANT') {
      loadRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInterests, userDepartment, adminResources, currentUserId, userRole]);

  if (loading) {
    return React.createElement('div', { style: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' } },
      React.createElement('div', { style: { width: '40px', height: '40px', border: '3px solid rgba(155,89,182,0.2)', borderTopColor: '#9b59b6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' } })
    );
  }

  // VUE ENSEIGNANT
  if (userRole === 'ENSEIGNANT') {
    return React.createElement('div', { style: { padding: '20px', maxWidth: '1200px', margin: '0 auto' } },
      React.createElement('div', { style: { marginBottom: '30px' } },
        React.createElement('h1', { style: { fontSize: '24px', color: '#1a1a2e', marginBottom: '10px' } }, 'Recommandations pour enseignants'),
        React.createElement('p', { style: { color: '#666' } }, 
          userDepartment 
            ? `📌 Ressources partagées par votre administration et par d'autres enseignants du département "${userDepartment}"`
            : '📌 Ressources partagées par votre administration et par d\'autres enseignants'
        )
      ),
      
      recommendations.length === 0 ? 
        React.createElement('div', { style: { background: '#f8f9fa', borderRadius: '20px', padding: '60px 20px', textAlign: 'center' } },
          React.createElement(FiAlertCircle, { size: 60, color: '#ccc' }),
          React.createElement('h3', { style: { color: '#666', marginTop: '20px' } }, 'Aucune recommandation'),
          React.createElement('p', { style: { color: '#999', marginBottom: '20px' } }, 
            !userDepartment 
              ? 'Votre département n\'est pas défini. Veuillez mettre à jour votre profil.'
              : 'Aucune ressource d\'autres enseignants ou de votre administration n\'est disponible pour le moment.'
          )
        ) :
        React.createElement('div', { style: { display: 'grid', gap: '20px' } },
          recommendations.map(function(item) {
            var isSaved = savedItems.includes(item.id);
            var isFromAdmin = item.source === 'admin';
            return React.createElement('div', { key: item.id, style: { background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderLeft: isFromAdmin ? '4px solid #f59e0b' : (item.matchScore >= 70 ? '4px solid #10b981' : (item.matchScore >= 40 ? '4px solid #3b82f6' : 'none')) } },
              React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' } },
                React.createElement('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
                  isFromAdmin ? 
                    React.createElement('span', { style: { background: '#fef3c7', color: '#d97706', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' } }, 
                      React.createElement(FiShield, { size: 12, style: { marginRight: '4px' } }), 'ADMINISTRATION'
                    ) :
                    React.createElement('span', { style: { background: '#dbeafe', color: '#3b82f6', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' } }, 
                      item.type || 'RESSOURCE'
                    ),
                  item.matchScore > 0 && !isFromAdmin && React.createElement('span', { 
                    style: { 
                      background: item.matchScore >= 70 ? '#10b981' : (item.matchScore >= 40 ? '#3b82f6' : '#6c757d'),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    } 
                  }, item.matchLevel)
                ),
                React.createElement('div', { style: { display: 'flex', gap: '5px' } },
                  React.createElement('button', { 
                    style: { background: 'none', border: 'none', cursor: 'pointer', color: isSaved ? '#f59e0b' : '#ccc' },
                    onClick: function() { handleSave(item.id, item); }
                  }, React.createElement(FiBookmark, { size: 18 })),
                  React.createElement('button', { 
                    style: { background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' },
                    onClick: function() { handleShare(item.title); }
                  }, React.createElement(FiShare2, { size: 18 }))
                )
              ),
              React.createElement('h3', { style: { fontSize: '18px', marginBottom: '10px', color: '#1a1a2e' } }, item.title),
              React.createElement('p', { style: { color: '#666', marginBottom: '15px', lineHeight: '1.5', fontSize: '13px' } }, item.description || 'Aucune description'),
              React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '15px', fontSize: '12px', color: '#999' } },
                React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '4px' } }, React.createElement(FiUser, { size: 12 }), item.teacherName || (isFromAdmin ? 'Administration' : 'Enseignant')),
                item.date && React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '4px' } }, React.createElement(FiCalendar, { size: 12 }), item.date),
                !isFromAdmin && React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '4px' } }, React.createElement(FiEye, { size: 12 }), (item.views || 0), ' vues'),
                !isFromAdmin && React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '4px' } }, React.createElement(FiDownload, { size: 12 }), (item.downloads || 0), ' téléch.')
              ),
              React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' } },
                item.tags && item.tags.map(function(tag) {
                  var isMatched = userInterests && userInterests.some(function(interest) {
                    return tag && interest && (tag.toLowerCase().includes(interest.toLowerCase()) || interest.toLowerCase().includes(tag.toLowerCase()));
                  });
                  return React.createElement('span', { 
                    key: tag, 
                    style: { 
                      background: isMatched ? '#dbeafe' : '#f0f0f0',
                      padding: '4px 10px',
                      borderRadius: '15px',
                      fontSize: '11px',
                      color: isMatched ? '#3b82f6' : '#666',
                      fontWeight: isMatched ? 'bold' : 'normal'
                    } 
                  }, React.createElement(FiTag, { size: 10, style: { marginRight: '4px' } }), tag + (isMatched ? ' ✓' : ''));
                })
              ),
              React.createElement('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid #f0f0f0', paddingTop: '15px' } },
                React.createElement('button', { 
                  onClick: function() { handleView(item); }, 
                  style: { display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' } 
                }, React.createElement(FiEye, { size: 14 }), ' Consulter'),
                React.createElement('button', { 
                  onClick: function() { handleDownload(item); }, 
                  style: { display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' } 
                }, React.createElement(FiDownload, { size: 14 }), ' Télécharger'),
                React.createElement('button', { 
                  onClick: function() { handleShare(item.title); }, 
                  style: { display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' } 
                }, React.createElement(FiShare2, { size: 14 }), ' Partager')
              )
            );
          })
        )
    );
  }

  // VUE ÉTUDIANT
  return React.createElement('div', { style: { padding: '20px', maxWidth: '1200px', margin: '0 auto' } },
    React.createElement('div', { style: { marginBottom: '30px' } },
      React.createElement('h1', { style: { fontSize: '24px', color: '#1a1a2e', marginBottom: '10px' } }, 'Recommandations personnalisées'),
      React.createElement('p', { style: { color: '#666' } }, 
        userInterests && userInterests.length > 0 
          ? '📌 Basé sur vos centres d\'intérêt : ' + userInterests.join(', ')
          : '💡 Ajoutez vos centres d\'intérêt dans votre tableau de bord pour des recommandations personnalisées !'
      )
    ),
    
    userInterests.length === 0 ? 
      React.createElement('div', { style: { background: '#f8f9fa', borderRadius: '20px', padding: '60px 20px', textAlign: 'center' } },
        React.createElement(FiAlertCircle, { size: 60, color: '#ccc' }),
        React.createElement('h3', { style: { color: '#666', marginTop: '20px' } }, 'Aucune recommandation'),
        React.createElement('p', { style: { color: '#999', marginBottom: '20px' } }, 
          'Pour recevoir des recommandations personnalisées, veuillez d\'abord ajouter vos centres d\'intérêt dans votre tableau de bord.'
        ),
        React.createElement('button', { 
          onClick: function() { onNavigate && onNavigate('dashboard'); }, 
          style: { padding: '10px 24px', background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer' } 
        }, 'Aller au tableau de bord →')
      ) :
      recommendations.length === 0 ?
        React.createElement('div', { style: { background: '#f8f9fa', borderRadius: '20px', padding: '60px 20px', textAlign: 'center' } },
          React.createElement(FiAlertCircle, { size: 60, color: '#ccc' }),
          React.createElement('h3', { style: { color: '#666', marginTop: '20px' } }, 'Aucune ressource trouvée'),
          React.createElement('p', { style: { color: '#999', marginBottom: '20px' } }, 
            'Aucune ressource ne correspond à vos centres d\'intérêt pour le moment.'
          )
        ) :
        React.createElement('div', null,
          React.createElement('div', { style: { display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' } },
            React.createElement('button', { onClick: function() { setFilter('all'); }, style: { padding: '8px 20px', background: filter === 'all' ? '#9b59b6' : 'white', color: filter === 'all' ? 'white' : '#666', border: '1px solid #ddd', borderRadius: '25px', cursor: 'pointer' } }, 'Tous'),
            React.createElement('button', { onClick: function() { setFilter('cours'); }, style: { padding: '8px 20px', background: filter === 'cours' ? '#9b59b6' : 'white', color: filter === 'cours' ? 'white' : '#666', border: '1px solid #ddd', borderRadius: '25px', cursor: 'pointer' } }, 'Cours'),
            React.createElement('button', { onClick: function() { setFilter('article'); }, style: { padding: '8px 20px', background: filter === 'article' ? '#9b59b6' : 'white', color: filter === 'article' ? 'white' : '#666', border: '1px solid #ddd', borderRadius: '25px', cursor: 'pointer' } }, 'Articles'),
            React.createElement('button', { onClick: function() { setFilter('exercice'); }, style: { padding: '8px 20px', background: filter === 'exercice' ? '#9b59b6' : 'white', color: filter === 'exercice' ? 'white' : '#666', border: '1px solid #ddd', borderRadius: '25px', cursor: 'pointer' } }, 'Exercices')
          ),
          React.createElement('div', { style: { display: 'grid', gap: '20px' } },
            recommendations.filter(function(r) {
              if (filter === 'all') return true;
              return r.type && r.type.toLowerCase().includes(filter);
            }).map(function(item) {
              var isSaved = savedItems.includes(item.id);
              return React.createElement('div', { key: item.id, style: { background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } },
                React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' } },
                  React.createElement('div', { style: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' } },
                    React.createElement('span', { style: { background: '#f0f0f0', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', color: '#666' } }, item.type || 'Ressource'),
                    item.matchScore > 0 && React.createElement('span', { 
                      style: { 
                        background: item.matchScore >= 70 ? '#10b981' : (item.matchScore >= 40 ? '#f59e0b' : '#6c757d'),
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      } 
                    }, item.matchLevel)
                  ),
                  React.createElement('div', { style: { display: 'flex', gap: '5px' } },
                    React.createElement('button', { 
                      style: { background: 'none', border: 'none', cursor: 'pointer', color: isSaved ? '#f59e0b' : '#ccc' },
                      onClick: function() { handleSave(item.id, item); }
                    }, '★'),
                    React.createElement('button', { 
                      style: { background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' },
                      onClick: function() { handleShare(item.title); }
                    }, '📤')
                  )
                ),
                React.createElement('h3', { style: { fontSize: '18px', marginBottom: '10px', color: '#1a1a2e' } }, item.title),
                React.createElement('p', { style: { color: '#666', marginBottom: '15px', lineHeight: '1.5' } }, item.description || 'Aucune description'),
                React.createElement('div', { style: { display: 'flex', gap: '15px', marginBottom: '15px', fontSize: '12px', color: '#999', flexWrap: 'wrap' } },
                  React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '4px' } }, React.createElement(FiUser, { size: 12 }), item.teacherName || 'Enseignant'),
                  React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '4px' } }, React.createElement(FiEye, { size: 12 }), (item.views || 0), ' vues'),
                  React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '4px' } }, React.createElement(FiDownload, { size: 12 }), (item.downloads || 0), ' téléch.'),
                  item.date && React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '4px' } }, '📅', item.date)
                ),
                React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' } },
                  item.tags && item.tags.map(function(tag) {
                    var isMatched = userInterests.some(function(interest) {
                      return tag && interest && (tag.toLowerCase().includes(interest.toLowerCase()) || interest.toLowerCase().includes(tag.toLowerCase()));
                    });
                    return React.createElement('span', { 
                      key: tag, 
                      style: { 
                        background: isMatched ? '#dbeafe' : '#f0f0f0',
                        padding: '4px 10px',
                        borderRadius: '15px',
                        fontSize: '11px',
                        color: isMatched ? '#3b82f6' : '#666',
                        fontWeight: isMatched ? 'bold' : 'normal'
                      } 
                    }, tag + (isMatched ? ' ✓' : ''));
                  })
                ),
                React.createElement('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid #f0f0f0', paddingTop: '15px' } },
                  React.createElement('button', { 
                    onClick: function() { handleView(item); },
                    style: { display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
                  }, React.createElement(FiEye, { size: 14 }), ' Consulter'),
                  React.createElement('button', { 
                    onClick: function() { handleDownload(item); },
                    style: { display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
                  }, React.createElement(FiDownload, { size: 14 }), ' Télécharger')
                )
              );
            })
          )
        )
  );
};

export default Recommendations;