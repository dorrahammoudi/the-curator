import React, { useState, useEffect, useCallback } from 'react';
import { FiTrendingUp, FiX, FiEye, FiDownload, FiTag } from 'react-icons/fi';

var PopularTags = function({ tags, userInterests, onTagClick }) {
  var [popularTags, setPopularTags] = useState([]);
  var [selectedTag, setSelectedTag] = useState(null);
  var [tagResources, setTagResources] = useState([]);
  var [showModal, setShowModal] = useState(false);

  var getCurrentUserId = function() {
    return localStorage.getItem('current_user_id');
  };

  var loadPopularTags = useCallback(function() {
    var currentUserId = getCurrentUserId();
    if (!currentUserId) {
      setPopularTags([]);
      return;
    }
    
    // Utiliser les clés spécifiques à l'utilisateur
    var userViewKey = 'recently_viewed_' + currentUserId;
    var userDownloadKey = 'downloaded_resources_' + currentUserId;
    
    var viewedResources = JSON.parse(localStorage.getItem(userViewKey) || '[]');
    var downloadedResources = JSON.parse(localStorage.getItem(userDownloadKey) || '[]');
    var allResources = JSON.parse(localStorage.getItem('teacher_resources') || '[]');
    
    console.log('📊 PopularTags - User:', currentUserId);
    console.log('   Consultations:', viewedResources.length);
    console.log('   Téléchargements:', downloadedResources.length);
    
    var resourcesMap = {};
    allResources.forEach(function(r) {
      resourcesMap[r.id] = r;
    });
    
    var tagCount = {};
    var processedResources = {};
    
    // Compter les tags des ressources consultées
    viewedResources.forEach(function(viewed) {
      var resource = resourcesMap[viewed.id];
      if (resource && resource.tags && !processedResources[resource.id]) {
        processedResources[resource.id] = true;
        resource.tags.forEach(function(tag) {
          var normalizedTag = tag.toLowerCase();
          if (!tagCount[normalizedTag]) {
            tagCount[normalizedTag] = { name: tag, count: 0, resources: [] };
          }
          tagCount[normalizedTag].count++;
          if (!tagCount[normalizedTag].resources.some(function(r) { return r.id === resource.id; })) {
            tagCount[normalizedTag].resources.push(resource);
          }
        });
      }
    });
    
    // Compter les tags des ressources téléchargées (poids double)
    downloadedResources.forEach(function(downloaded) {
      var resource = resourcesMap[downloaded.id];
      if (resource && resource.tags && !processedResources[resource.id]) {
        processedResources[resource.id] = true;
        resource.tags.forEach(function(tag) {
          var normalizedTag = tag.toLowerCase();
          if (!tagCount[normalizedTag]) {
            tagCount[normalizedTag] = { name: tag, count: 0, resources: [] };
          }
          tagCount[normalizedTag].count += 2;
          if (!tagCount[normalizedTag].resources.some(function(r) { return r.id === resource.id; })) {
            tagCount[normalizedTag].resources.push(resource);
          }
        });
      }
    });
    
    // Ajouter les centres d'intérêt
    if (userInterests && userInterests.length > 0) {
      userInterests.forEach(function(interest) {
        var normalizedInterest = interest.toLowerCase();
        var hasResources = allResources.some(function(resource) {
          return resource.tags && resource.tags.some(function(t) {
            return t.toLowerCase() === normalizedInterest;
          });
        });
        
        if (hasResources) {
          if (!tagCount[normalizedInterest]) {
            tagCount[normalizedInterest] = { name: interest, count: 1, resources: [] };
            var matchingResources = allResources.filter(function(resource) {
              return resource.tags && resource.tags.some(function(t) {
                return t.toLowerCase() === normalizedInterest;
              });
            });
            tagCount[normalizedInterest].resources = matchingResources;
          } else {
            tagCount[normalizedInterest].count += 1;
          }
        }
      });
    }
    
    // Filtrer et trier
    var tagsWithResources = Object.values(tagCount).filter(function(tag) {
      return tag.resources && tag.resources.length > 0;
    });
    
    tagsWithResources.sort(function(a, b) { return b.count - a.count; });
    var topTags = tagsWithResources.slice(0, 3);
    
    // Sauvegarder les tags populaires pour cet utilisateur
    if (currentUserId) {
      var userTagsKey = 'popular_tags_' + currentUserId;
      localStorage.setItem(userTagsKey, JSON.stringify(topTags.map(function(t) {
        return { name: t.name, count: t.count };
      })));
    }
    
    setPopularTags(topTags);
  }, [userInterests]);

  useEffect(function() {
    loadPopularTags();
    
    var handleStorageChange = function(e) {
      if (e.key && (e.key.startsWith('recently_viewed_') || e.key.startsWith('downloaded_resources_'))) {
        loadPopularTags();
      }
      if (e.key === 'current_user_id') {
        loadPopularTags();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return function() {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadPopularTags]);

  var handleTagClick = function(tag) {
    setSelectedTag(tag);
    setTagResources(tag.resources || []);
    setShowModal(true);
  };

  var handleViewResource = function(resource) {
    var currentUserId = getCurrentUserId();
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
    loadPopularTags();
    
    if (resource.fileUrl) {
      window.open(resource.fileUrl, '_blank');
    } else {
      var blob = new Blob(["Contenu: " + resource.title], { type: 'application/pdf' });
      var url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    }
    setShowModal(false);
  };

  var handleDownloadResource = function(resource) {
    var currentUserId = getCurrentUserId();
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
    loadPopularTags();
    
    if (resource.fileUrl) {
      var anchor = document.createElement('a');
      anchor.href = resource.fileUrl;
      anchor.download = resource.title.replace(/[^a-z0-9]/gi, '_') + '.pdf';
      anchor.click();
    } else {
      var blob = new Blob(["Contenu: " + resource.title], { type: 'application/pdf' });
      var url = URL.createObjectURL(blob);
      var downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = resource.title.replace(/[^a-z0-9]/gi, '_') + '.pdf';
      downloadLink.click();
      URL.revokeObjectURL(url);
    }
    setShowModal(false);
  };

  // Si pas de tags populaires, afficher un message
  if (popularTags.length === 0) {
    return React.createElement('div', { style: { background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } },
      React.createElement('h3', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#1a1a2e' } },
        React.createElement(FiTrendingUp, { size: 20 }), ' Tags populaires'
      ),
      React.createElement('div', { style: { textAlign: 'center', padding: '30px', color: '#999' } },
        React.createElement(FiTag, { size: 40, color: '#ccc' }),
        React.createElement('p', { style: { marginTop: '10px' } }, 'Aucun tag pour le moment'),
        React.createElement('p', { style: { fontSize: '12px', marginTop: '5px' } }, 'Consultez des ressources pour voir vos tags populaires')
      )
    );
  }

  return React.createElement('div', { style: { background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } },
    React.createElement('h3', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#1a1a2e' } },
      React.createElement(FiTrendingUp, { size: 20 }), ' Vos tags populaires'
    ),
    React.createElement('p', { style: { fontSize: '12px', color: '#666', marginBottom: '15px' } },
      '💡 Basé sur vos consultations, téléchargements et centres d\'intérêt'
    ),
    React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '10px' } },
      popularTags.map(function(tag) {
        return React.createElement('button', { 
          key: tag.name,
          onClick: function() { handleTagClick(tag); },
          style: { 
            background: 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '25px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          },
          onMouseEnter: function(e) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)'; e.currentTarget.style.color = 'white'; },
          onMouseLeave: function(e) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)'; e.currentTarget.style.color = '#333'; }
        },
          React.createElement(FiTag, { size: 14 }),
          React.createElement('span', { style: { fontWeight: '500' } }, tag.name),
          React.createElement('span', { 
            style: { 
              background: 'rgba(0,0,0,0.1)', 
              padding: '2px 6px', 
              borderRadius: '12px', 
              fontSize: '11px',
              fontWeight: 'bold'
            } 
          }, tag.resources ? tag.resources.length : 0)
        );
      })
    ),
    
    // Modal pour afficher les ressources du tag
    showModal && React.createElement('div', { 
      style: { 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'rgba(0,0,0,0.5)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 1000 
      },
      onClick: function() { setShowModal(false); }
    },
      React.createElement('div', { 
        style: { 
          background: 'white', 
          borderRadius: '20px', 
          width: '600px', 
          maxWidth: '90%', 
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        },
        onClick: function(e) { e.stopPropagation(); }
      },
        React.createElement('div', { 
          style: { 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '20px', 
            borderBottom: '1px solid #e0e0e0',
            background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
            color: 'white'
          } 
        },
          React.createElement('h3', { style: { margin: 0, display: 'flex', alignItems: 'center', gap: '10px' } },
            React.createElement(FiTag, { size: 20 }),
            'Ressources avec le tag : ' + (selectedTag?.name || '')
          ),
          React.createElement('button', { 
            onClick: function() { setShowModal(false); }, 
            style: { background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontSize: '20px' } 
          }, React.createElement(FiX, { size: 20 }))
        ),
        React.createElement('div', { style: { padding: '20px', overflowY: 'auto', flex: 1 } },
          tagResources.length === 0 ? 
            React.createElement('div', { style: { textAlign: 'center', padding: '40px', color: '#999' } },
              React.createElement('p', null, 'Aucune ressource trouvée avec ce tag')
            ) :
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '15px' } },
              tagResources.map(function(resource) {
                return React.createElement('div', { 
                  key: resource.id, 
                  style: { 
                    padding: '15px', 
                    background: '#f8f9fa', 
                    borderRadius: '12px',
                    borderLeft: '3px solid #9b59b6'
                  } 
                },
                  React.createElement('div', { style: { fontWeight: '500', marginBottom: '8px', fontSize: '16px' } }, resource.title),
                  React.createElement('div', { style: { display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '12px', color: '#666', flexWrap: 'wrap' } },
                    React.createElement('span', { 
                      style: { 
                        background: resource.type === 'COURS' ? '#dbeafe' : (resource.type === 'EXERCICE' ? '#d1fae5' : '#fed7aa'),
                        color: resource.type === 'COURS' ? '#3b82f6' : (resource.type === 'EXERCICE' ? '#10b981' : '#d97706'),
                        padding: '2px 8px', 
                        borderRadius: '12px' 
                      } 
                    }, resource.type || 'Ressource'),
                    resource.teacherName && React.createElement('span', null, '👨‍🏫 ' + resource.teacherName),
                    resource.date && React.createElement('span', null, '📅 ' + resource.date)
                  ),
                  React.createElement('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' } },
                    resource.tags && resource.tags.slice(0, 3).map(function(tag, idx) {
                      var isCurrentTag = tag === selectedTag?.name;
                      return React.createElement('span', { 
                        key: idx, 
                        style: { 
                          background: isCurrentTag ? '#9b59b6' : '#e0e0e0',
                          color: isCurrentTag ? 'white' : '#666',
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontSize: '11px' 
                        } 
                      }, tag);
                    }),
                    resource.tags && resource.tags.length > 3 && React.createElement('span', { style: { fontSize: '11px', color: '#999' } }, '+' + (resource.tags.length - 3))
                  ),
                  React.createElement('div', { style: { display: 'flex', gap: '10px' } },
                    React.createElement('button', { 
                      onClick: function() { handleViewResource(resource); },
                      style: { display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }
                    }, React.createElement(FiEye, { size: 12 }), ' Voir'),
                    React.createElement('button', { 
                      onClick: function() { handleDownloadResource(resource); },
                      style: { display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }
                    }, React.createElement(FiDownload, { size: 12 }), ' Télécharger')
                  )
                );
              })
            )
        )
      )
    )
  );
};

export default PopularTags;