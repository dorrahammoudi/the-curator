import React, { useState, useEffect } from 'react';
import { FiTarget, FiCheckCircle, FiPlus, FiX, FiTrendingUp, FiAward } from 'react-icons/fi';

var Objectives = function({ objectives, onUpdateObjective }) {
  var [localObjectives, setLocalObjectives] = useState([]);
  var [showAddInput, setShowAddInput] = useState(false);
  var [newObjective, setNewObjective] = useState({
    label: '',
    tag: '',
    level: 'DEBUTANT'
  });
  var [availableTags, setAvailableTags] = useState([]);
  var [studentLevel, setStudentLevel] = useState('DEBUTANT');

  var levelMultipliers = {
    'DEBUTANT': 1,
    'INTERMEDIAIRE': 1.5,
    'AVANCE': 2,
    'EXPERT': 3
  };

  var levelLabels = {
    'DEBUTANT': '🌱 Débutant',
    'INTERMEDIAIRE': '📚 Intermédiaire',
    'AVANCE': '🚀 Avancé',
    'EXPERT': '🏆 Expert'
  };

  useEffect(function() {
    loadAvailableTags();
    loadStudentLevel();
    loadObjectives();
  }, []);

  var loadAvailableTags = function() {
    var allResources = JSON.parse(localStorage.getItem('teacher_resources') || '[]');
    var tagsSet = {};
    
    allResources.forEach(function(resource) {
      if (resource.tags && Array.isArray(resource.tags)) {
        resource.tags.forEach(function(tag) {
          if (tag && typeof tag === 'string') {
            tagsSet[tag.trim()] = true;
          }
        });
      }
    });
    
    setAvailableTags(Object.keys(tagsSet));
  };

  var loadStudentLevel = function() {
    var dashboardData = JSON.parse(localStorage.getItem('dashboard_data') || '{}');
    var niveau = dashboardData.profile?.niveau || 'L1';
    
    if (niveau === 'L1' || niveau === 'L2') {
      setStudentLevel('DEBUTANT');
    } else if (niveau === 'L3') {
      setStudentLevel('INTERMEDIAIRE');
    } else if (niveau === 'M1' || niveau === 'M2') {
      setStudentLevel('AVANCE');
    } else {
      setStudentLevel('EXPERT');
    }
  };

  var calculateObjectiveProgress = function(tag, objectiveLevel) {
    if (!tag || typeof tag !== 'string') return 0;
    
    var currentUserId = localStorage.getItem('current_user_id');
    if (!currentUserId) return 0;
    
    var viewedResources = JSON.parse(localStorage.getItem('recently_viewed_' + currentUserId) || '[]');
    var allResources = JSON.parse(localStorage.getItem('teacher_resources') || '[]');
    
    var resourcesMap = {};
    allResources.forEach(function(r) {
      resourcesMap[r.id] = r;
    });
    
    var relevantViews = 0;
    var targetLevelMultiplier = levelMultipliers[objectiveLevel] || 1;
    
    viewedResources.forEach(function(viewed) {
      var resource = resourcesMap[viewed.id];
      if (resource && resource.tags && Array.isArray(resource.tags)) {
        var hasTag = resource.tags.some(function(t) {
          if (!t || typeof t !== 'string') return false;
          var tagLower = tag.toLowerCase();
          var tLower = t.toLowerCase();
          return tLower.includes(tagLower) || tagLower.includes(tLower);
        });
        
        if (hasTag) {
          var resourceLevel = resource.level || 'DEBUTANT';
          var resourceMultiplier = levelMultipliers[resourceLevel] || 1;
          var points = resourceMultiplier * targetLevelMultiplier;
          relevantViews += points;
        }
      }
    });
    
    var maxPoints = 10 * targetLevelMultiplier;
    var percentage = Math.min(100, Math.round((relevantViews / maxPoints) * 100));
    
    return percentage;
  };

  var loadObjectives = function() {
    var savedObjectives = localStorage.getItem('student_objectives');
    if (savedObjectives) {
      var parsed = JSON.parse(savedObjectives);
      var updatedObjectives = parsed.map(function(obj) {
        var progress = calculateObjectiveProgress(obj.tag, obj.level);
        return { ...obj, percentage: progress };
      });
      setLocalObjectives(updatedObjectives);
      localStorage.setItem('student_objectives', JSON.stringify(updatedObjectives));
      if (onUpdateObjective) {
        updatedObjectives.forEach(function(obj) {
          onUpdateObjective(obj.id, obj.percentage);
        });
      }
    } else if (objectives && objectives.length > 0) {
      var initialObjectives = objectives.map(function(obj) {
        var progress = calculateObjectiveProgress(obj.tag, obj.level);
        return { ...obj, percentage: progress };
      });
      setLocalObjectives(initialObjectives);
      localStorage.setItem('student_objectives', JSON.stringify(initialObjectives));
    }
  };

  var recalculateAllProgress = function() {
    var updatedObjectives = localObjectives.map(function(obj) {
      var newProgress = calculateObjectiveProgress(obj.tag, obj.level);
      return { ...obj, percentage: newProgress };
    });
    setLocalObjectives(updatedObjectives);
    localStorage.setItem('student_objectives', JSON.stringify(updatedObjectives));
    
    if (onUpdateObjective) {
      updatedObjectives.forEach(function(obj) {
        onUpdateObjective(obj.id, obj.percentage);
      });
    }
  };

  useEffect(function() {
    var handleStorageChange = function(e) {
      if (e.key && e.key.startsWith('recently_viewed_')) {
        recalculateAllProgress();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    var interval = setInterval(function() {
      recalculateAllProgress();
    }, 5000);
    
    return function() {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [localObjectives.length]);

  var addNewObjective = function() {
    if (!newObjective.label || !newObjective.tag) {
      alert('Veuillez remplir le titre et le tag');
      return;
    }
    
    var newId = Date.now();
    var initialProgress = calculateObjectiveProgress(newObjective.tag, newObjective.level);
    
    var updatedObjectives = [...localObjectives, {
      id: newId,
      label: newObjective.label.toUpperCase(),
      tag: newObjective.tag,
      level: newObjective.level,
      percentage: initialProgress,
      createdAt: new Date().toISOString()
    }];
    
    setLocalObjectives(updatedObjectives);
    localStorage.setItem('student_objectives', JSON.stringify(updatedObjectives));
    
    setNewObjective({ label: '', tag: '', level: 'DEBUTANT' });
    setShowAddInput(false);
  };

  var deleteObjective = function(id) {
    if (window.confirm('Supprimer cet objectif ?')) {
      var updatedObjectives = localObjectives.filter(function(obj) { return obj.id !== id; });
      setLocalObjectives(updatedObjectives);
      localStorage.setItem('student_objectives', JSON.stringify(updatedObjectives));
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

  var getLevelColor = function(level) {
    switch(level) {
      case 'DEBUTANT': return { bg: '#d1fae5', color: '#10b981' };
      case 'INTERMEDIAIRE': return { bg: '#dbeafe', color: '#3b82f6' };
      case 'AVANCE': return { bg: '#fed7aa', color: '#d97706' };
      case 'EXPERT': return { bg: '#fef3c7', color: '#92400e' };
      default: return { bg: '#f0f0f0', color: '#666' };
    }
  };

  var getProgressMessage = function(percentage, level) {
    if (percentage >= 100) return '🏆 Objectif atteint ! Félicitations !';
    if (percentage >= 70) return '🎉 Excellente progression ! Continuez ainsi !';
    if (percentage >= 40) return '📈 Bonne progression, persévérez !';
    if (percentage >= 20) return '🌱 Bon début, continuez à consulter des ressources !';
    return '💪 Commencez à consulter des ressources sur ce sujet !';
  };

  return React.createElement('div', { style: { background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } },
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' } },
      React.createElement('h3', { style: { display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: '#1a1a2e' } },
        React.createElement(FiTarget, { size: 20 }), ' Objectifs personnalisés'
      ),
      React.createElement('button', { 
        onClick: function() { setShowAddInput(!showAddInput); },
        style: { background: 'none', border: 'none', cursor: 'pointer', color: '#9b59b6', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }
      }, React.createElement(FiPlus, { size: 14 }), ' Ajouter')
    ),
    
    React.createElement('p', { style: { fontSize: '12px', color: '#666', marginBottom: '15px' } },
      '💡 Chaque consultation de ressource avec le tag correspondant fait progresser votre objectif. ' +
      'Les ressources de niveau supérieur rapportent plus de points !'
    ),
    
    showAddInput && React.createElement('div', { style: { marginBottom: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '10px' } },
      React.createElement('div', { style: { marginBottom: '10px' } },
        React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px' } }, 'Titre de l\'objectif'),
        React.createElement('input', {
          type: 'text',
          placeholder: 'Ex: Maîtriser Python',
          value: newObjective.label,
          onChange: function(e) { setNewObjective({ ...newObjective, label: e.target.value }); },
          style: { width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }
        })
      ),
      React.createElement('div', { style: { marginBottom: '10px' } },
        React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px' } }, 'Tag associé'),
        React.createElement('select', {
          value: newObjective.tag,
          onChange: function(e) { setNewObjective({ ...newObjective, tag: e.target.value }); },
          style: { width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }
        },
          React.createElement('option', { value: '' }, 'Sélectionnez un tag'),
          availableTags.map(function(tag) {
            return React.createElement('option', { key: tag, value: tag }, tag);
          })
        ),
        availableTags.length === 0 && React.createElement('small', { style: { display: 'block', marginTop: '5px', color: '#999' } }, 
          'Aucun tag disponible. Les enseignants doivent d\'abord ajouter des ressources avec des tags.'
        )
      ),
      React.createElement('div', { style: { marginBottom: '10px' } },
        React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px' } }, 'Niveau de difficulté visé'),
        React.createElement('select', {
          value: newObjective.level,
          onChange: function(e) { setNewObjective({ ...newObjective, level: e.target.value }); },
          style: { width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }
        },
          React.createElement('option', { value: 'DEBUTANT' }, '🌱 Débutant'),
          React.createElement('option', { value: 'INTERMEDIAIRE' }, '📚 Intermédiaire'),
          React.createElement('option', { value: 'AVANCE' }, '🚀 Avancé'),
          React.createElement('option', { value: 'EXPERT' }, '🏆 Expert')
        ),
        React.createElement('small', { style: { display: 'block', marginTop: '5px', color: '#999', fontSize: '11px' } }, 
          'Plus le niveau est élevé, plus la progression est rapide (les ressources de haut niveau rapportent plus)'
        )
      ),
      React.createElement('div', { style: { display: 'flex', gap: '10px', justifyContent: 'flex-end' } },
        React.createElement('button', { 
          onClick: function() { setShowAddInput(false); },
          style: { padding: '6px 12px', background: 'white', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }
        }, 'Annuler'),
        React.createElement('button', { 
          onClick: addNewObjective,
          style: { padding: '6px 12px', background: '#9b59b6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }
        }, 'Créer l\'objectif')
      )
    ),
    
    localObjectives.length === 0 ? 
      React.createElement('div', { style: { textAlign: 'center', padding: '30px', color: '#999' } },
        React.createElement(FiTarget, { size: 30, color: '#ccc' }),
        React.createElement('p', { style: { marginTop: '10px', fontSize: '13px' } }, 'Aucun objectif défini.'),
        React.createElement('p', { style: { fontSize: '11px' } }, 'Cliquez sur "Ajouter" pour créer votre premier objectif !')
      ) :
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } },
        localObjectives.map(function(obj) {
          var percentage = obj.percentage || 0;
          var levelStyle = getLevelColor(obj.level);
          var progressMessage = getProgressMessage(percentage, obj.level);
          
          return React.createElement('div', { key: obj.id, style: { borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' } },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' } },
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' } },
                React.createElement('span', { style: { fontSize: '14px', fontWeight: '600', color: '#1a1a2e' } }, obj.label),
                React.createElement('span', { style: { background: '#f0f0f0', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', color: '#666' } }, '🏷️ ' + obj.tag),
                React.createElement('span', { 
                  style: { 
                    background: levelStyle.bg, 
                    color: levelStyle.color, 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    fontSize: '10px',
                    fontWeight: '500'
                  } 
                }, getLevelIcon(obj.level) + ' ' + levelLabels[obj.level])
              ),
              React.createElement('button', { 
                onClick: function() { deleteObjective(obj.id); },
                style: { background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '16px' }
              }, '×')
            ),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' } },
              React.createElement('div', { style: { flex: 1, height: '10px', background: '#f0f0f0', borderRadius: '5px', overflow: 'hidden' } },
                React.createElement('div', { 
                  style: { 
                    width: percentage + '%', 
                    height: '100%', 
                    background: percentage === 100 ? '#10b981' : 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
                    borderRadius: '5px',
                    transition: 'width 0.5s ease'
                  } 
                })
              ),
              React.createElement('span', { style: { fontSize: '14px', fontWeight: '600', color: '#1a1a2e', minWidth: '45px' } }, percentage + '%'),
              percentage === 100 && React.createElement(FiCheckCircle, { size: 18, color: '#10b981' })
            ),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
              React.createElement('span', { style: { fontSize: '11px', color: progressMessage.includes('🏆') ? '#10b981' : '#666' } }, progressMessage),
              React.createElement('div', { style: { display: 'flex', gap: '15px', fontSize: '11px', color: '#999' } },
                React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '3px' } }, 
                  React.createElement(FiTrendingUp, { size: 10 }), 
                  'Progression: ' + (percentage >= 100 ? 'Terminé !' : (percentage >= 70 ? 'Rapide' : (percentage >= 40 ? 'Bon rythme' : 'Début')))
                )
              )
            )
          );
        })
      )
  );
};

export default Objectives;