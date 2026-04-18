// src/utils/cleanup.js
var cleanup = {
  // Nettoyer uniquement les données de session (garde les comptes ET les ressources)
  cleanSession: function() {
    var keysToKeep = [
      'all_users',                    // Liste des utilisateurs
      'teacher_resources',            // Ressources des enseignants
      'admin_resources',              // Ressources des admins
      'admin_resources_',             // Ressources admin par email (préfixe)
      'dashboard_data_',              // Données dashboard par utilisateur
      'interests_' ,                   // Centres d'intérêt par utilisateur
      'recently_viewed_', 
      'downloaded_resources_'
    ];
    
    var allKeys = Object.keys(localStorage);
    var deletedCount = 0;
    
    allKeys.forEach(function(key) {
      var shouldKeep = keysToKeep.some(function(keepKey) {
        return key === keepKey || key.startsWith(keepKey);
      });
      
      if (!shouldKeep) {
        localStorage.removeItem(key);
        deletedCount++;
      }
    });
    
    console.log('🧹 Session nettoyée: ' + deletedCount + ' clés supprimées, ressources préservées');
  },
  
  getAllUsers: function() {
    var users = localStorage.getItem('all_users');
    return users ? JSON.parse(users) : [];
  },
  
  deleteUser: function(userId) {
    var users = this.getAllUsers();
    var updatedUsers = users.filter(function(u) { return u.id !== userId; });
    localStorage.setItem('all_users', JSON.stringify(updatedUsers));
    localStorage.removeItem('dashboard_data_' + userId);
    localStorage.removeItem('interests_' + userId);
    console.log('🗑️ Compte ' + userId + ' supprimé');
  },
  
  userExists: function(email) {
    var users = this.getAllUsers();
    return users.some(function(u) { return u.email === email; });
  },
  
  resetAll: function() {
    var teacherResources = localStorage.getItem('teacher_resources');
    var adminResources = localStorage.getItem('admin_resources');
    localStorage.clear();
    if (teacherResources) localStorage.setItem('teacher_resources', teacherResources);
    if (adminResources) localStorage.setItem('admin_resources', adminResources);
    console.log('🔄 Réinitialisation complète');
  }
};

export default cleanup;