// src/utils/userStats.js
var userStats = {
    // Sauvegarder une consultation
    addView: function(resourceId, resourceTitle, resourceType, fileUrl, teacherName) {
      var currentUserId = localStorage.getItem('current_user_id');
      if (!currentUserId) return;
      
      var key = 'recently_viewed_' + currentUserId;
      var viewedResources = JSON.parse(localStorage.getItem(key) || '[]');
      
      // Supprimer l'ancienne entrée si elle existe
      viewedResources = viewedResources.filter(function(r) { return r.id !== resourceId; });
      
      // Ajouter en tête
      viewedResources.unshift({
        id: resourceId,
        title: resourceTitle,
        type: resourceType,
        date: new Date().toLocaleDateString('fr-FR'),
        fileUrl: fileUrl,
        teacherName: teacherName
      });
      
      // Garder seulement les 20 derniers
      if (viewedResources.length > 20) {
        viewedResources = viewedResources.slice(0, 20);
      }
      
      localStorage.setItem(key, JSON.stringify(viewedResources));
      localStorage.setItem('recently_viewed', JSON.stringify(viewedResources));
      
      // Déclencher l'événement pour rafraîchir les graphiques
      window.dispatchEvent(new Event('storage'));
      
      return viewedResources.length;
    },
    
    // Sauvegarder un téléchargement
    addDownload: function(resourceId, resourceTitle, resourceType, fileUrl, teacherName) {
      var currentUserId = localStorage.getItem('current_user_id');
      if (!currentUserId) return;
      
      var key = 'downloaded_resources_' + currentUserId;
      var downloadedResources = JSON.parse(localStorage.getItem(key) || '[]');
      
      downloadedResources.unshift({
        id: resourceId,
        title: resourceTitle,
        type: resourceType,
        date: new Date().toISOString().split('T')[0],
        fileUrl: fileUrl,
        teacherName: teacherName
      });
      
      if (downloadedResources.length > 50) {
        downloadedResources = downloadedResources.slice(0, 50);
      }
      
      localStorage.setItem(key, JSON.stringify(downloadedResources));
      localStorage.setItem('downloaded_resources', JSON.stringify(downloadedResources));
      
      window.dispatchEvent(new Event('storage'));
      
      return downloadedResources.length;
    },
    
    // Récupérer les consultations d'un utilisateur
    getUserViews: function(userId) {
      var key = 'recently_viewed_' + userId;
      return JSON.parse(localStorage.getItem(key) || '[]');
    },
    
    // Récupérer les téléchargements d'un utilisateur
    getUserDownloads: function(userId) {
      var key = 'downloaded_resources_' + userId;
      return JSON.parse(localStorage.getItem(key) || '[]');
    },
    
    // Récupérer toutes les consultations de tous les étudiants (pour le classement)
    getAllStudentViews: function() {
      var allUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
      var students = allUsers.filter(function(u) { return u.role === 'ETUDIANT'; });
      
      return students.map(function(student) {
        var key = 'recently_viewed_' + student.id;
        var views = JSON.parse(localStorage.getItem(key) || '[]');
        return {
          id: student.id,
          name: student.name,
          views: views.length
        };
      });
    }
  };
  
  export default userStats;