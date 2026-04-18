import React, { useState, useEffect } from 'react';
import { FiBookOpen, FiDownload, FiEye, FiTrendingUp, FiClock } from 'react-icons/fi';

var TeacherDashboard = function({ user }) {
  var [stats, setStats] = useState({
    totalResources: 0,
    totalViews: 0,
    totalDownloads: 0
  });
  var [recentResources, setRecentResources] = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    loadTeacherData();
    
    var handleStorageChange = function(e) {
      if (e.key === 'teacher_resources' || e.key === 'recently_viewed') {
        loadTeacherData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return function() { window.removeEventListener('storage', handleStorageChange); };
  }, []);

  var loadTeacherData = function() {
    setLoading(true);
    
    var currentUserId = localStorage.getItem('current_user_id');
    var userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    var teacherId = currentUserId || userData.id;
    
    // 1. Récupérer les ressources CRÉÉES par cet enseignant
    var allResources = JSON.parse(localStorage.getItem('teacher_resources') || '[]');
    var myResources = allResources.filter(function(resource) {
      return resource.teacherId == teacherId || resource.teacherId === userData.id;
    });
    
    // 2. Calculer les statistiques (vues et téléchargements de SES ressources)
    var totalViews = myResources.reduce(function(sum, r) { return sum + (r.views || 0); }, 0);
    var totalDownloads = myResources.reduce(function(sum, r) { return sum + (r.downloads || 0); }, 0);
    
    setStats({
      totalResources: myResources.length,
      totalViews: totalViews,
      totalDownloads: totalDownloads
    });
    
    // 3. Récupérer les ressources CONSULTÉES par l'enseignant (ressources d'autres enseignants)
    var viewedResources = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
    
    // Filtrer pour ne pas montrer ses propres ressources
    var othersResources = viewedResources.filter(function(viewed) {
      // Trouver la ressource originale
      var originalResource = allResources.find(function(r) { return r.id == viewed.id; });
      // Ne montrer que les ressources qui ne sont pas les siennes
      return originalResource && originalResource.teacherId != teacherId && originalResource.teacherId !== userData.id;
    });
    
    // Enrichir avec les informations complètes
    var enrichedOthers = othersResources.map(function(viewed) {
      var originalResource = allResources.find(function(r) { return r.id == viewed.id; });
      return {
        id: viewed.id,
        title: viewed.title,
        type: viewed.type,
        teacherName: originalResource ? originalResource.teacherName : viewed.teacherName,
        date: viewed.date,
        views: originalResource ? originalResource.views : 0,
        downloads: originalResource ? originalResource.downloads : 0
      };
    });
    
    setRecentResources(enrichedOthers.slice(0, 5));
    setLoading(false);
  };

  if (loading) {
    return React.createElement('div', { style: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' } },
      React.createElement('div', { style: { width: '40px', height: '40px', border: '3px solid rgba(155, 89, 182, 0.2)', borderTopColor: '#9b59b6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' } })
    );
  }

  return React.createElement('div', { style: { padding: '20px', maxWidth: '1200px', margin: '0 auto' } },
    React.createElement('div', { style: { marginBottom: '30px' } },
      React.createElement('h1', { style: { fontSize: '24px', color: '#1a1a2e', marginBottom: '10px' } }, 'Tableau de bord enseignant'),
      React.createElement('p', { style: { color: '#666' } }, 'Bienvenue ' + (user?.name || 'Enseignant') + ', voici un aperçu de vos ressources pédagogiques.')
    ),
    
    // 3 blocs de statistiques
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' } },
      // Bloc 1: Nombre de ressources créées
      React.createElement('div', { style: { background: 'white', borderRadius: '15px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderTop: '4px solid #9b59b6' } },
        React.createElement(FiBookOpen, { size: 40, color: '#9b59b6' }),
        React.createElement('div', { style: { fontSize: '32px', fontWeight: 'bold', marginTop: '10px', color: '#1a1a2e' } }, stats.totalResources),
        React.createElement('div', { style: { color: '#666', fontSize: '13px' } }, 'ressources créées')
      ),
      // Bloc 2: Nombre total de vues sur SES ressources
      React.createElement('div', { style: { background: 'white', borderRadius: '15px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderTop: '4px solid #3b82f6' } },
        React.createElement(FiEye, { size: 40, color: '#3b82f6' }),
        React.createElement('div', { style: { fontSize: '32px', fontWeight: 'bold', marginTop: '10px', color: '#1a1a2e' } }, stats.totalViews.toLocaleString()),
        React.createElement('div', { style: { color: '#666', fontSize: '13px' } }, 'vues totales')
      ),
      // Bloc 3: Nombre total de téléchargements sur SES ressources
      React.createElement('div', { style: { background: 'white', borderRadius: '15px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderTop: '4px solid #10b981' } },
        React.createElement(FiDownload, { size: 40, color: '#10b981' }),
        React.createElement('div', { style: { fontSize: '32px', fontWeight: 'bold', marginTop: '10px', color: '#1a1a2e' } }, stats.totalDownloads.toLocaleString()),
        React.createElement('div', { style: { color: '#666', fontSize: '13px' } }, 'téléchargements')
      )
    ),
    
    // Ressources récemment consultées (ressources d'autres enseignants)
    React.createElement('div', { style: { background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } },
      React.createElement('h3', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#1a1a2e' } },
        React.createElement(FiClock, { size: 18 }), ' Ressources récemment consultées'
      ),
      React.createElement('p', { style: { fontSize: '12px', color: '#666', marginBottom: '15px' } }, 
        '📚 Ressources consultées par vous chez d\'autres enseignants'
      ),
      
      recentResources.length === 0 ? 
        React.createElement('div', { style: { textAlign: 'center', padding: '40px', color: '#999' } },
          React.createElement(FiEye, { size: 40, color: '#ccc' }),
          React.createElement('p', { style: { marginTop: '10px' } }, 'Aucune ressource consultée récemment'),
          React.createElement('p', { style: { fontSize: '12px' } }, 'Explorez la bibliothèque pour découvrir des ressources d\'autres enseignants !')
        ) :
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
          recentResources.map(function(res) {
            return React.createElement('div', { 
              key: res.id, 
              style: { 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '10px',
                borderLeft: '3px solid #f59e0b'
              }
            },
              React.createElement('div', { style: { flex: 1 } },
                React.createElement('div', { style: { fontWeight: '500', marginBottom: '5px' } }, res.title),
                React.createElement('div', { style: { display: 'flex', gap: '15px', fontSize: '12px', color: '#666', flexWrap: 'wrap' } },
                  React.createElement('span', null, '📄 ' + (res.type || 'Ressource')),
                  React.createElement('span', null, '👨‍🏫 ' + (res.teacherName || 'Enseignant')),
                  React.createElement('span', null, '📅 ' + (res.date || 'Date inconnue'))
                )
              ),
              React.createElement('div', { style: { display: 'flex', gap: '8px' } },
                React.createElement('span', { style: { background: '#e0e0e0', padding: '4px 8px', borderRadius: '12px', fontSize: '11px' } }, '👁️ ' + (res.views || 0) + ' vues'),
                React.createElement('span', { style: { background: '#e0e0e0', padding: '4px 8px', borderRadius: '12px', fontSize: '11px' } }, '⬇️ ' + (res.downloads || 0) + ' téléch.')
              )
            );
          })
        )
    ),
    
    // Message d'information si l'enseignant n'a pas encore créé de ressources
    stats.totalResources === 0 && React.createElement('div', { style: { marginTop: '20px', background: '#dbeafe', borderRadius: '10px', padding: '15px', textAlign: 'center' } },
      React.createElement('p', { style: { color: '#1e40af', fontSize: '13px', margin: 0 } }, 
        '💡 Vous n\'avez pas encore créé de ressources. Allez dans la section "Librairie" pour ajouter vos premiers supports pédagogiques !'
      )
    )
  );
};

export default TeacherDashboard;