import React, { useState, useEffect } from 'react';
import { FiSearch, FiDownload, FiEye, FiBookmark, FiX, FiFilter, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import api from '../../services/api';

var SearchPage = function({ searchQuery = '' }) {
  var [searchTerm, setSearchTerm] = useState(searchQuery);
  var [results, setResults] = useState([]);
  var [loading, setLoading] = useState(false);
  var [filterType, setFilterType] = useState('all');
  var [sortBy, setSortBy] = useState('relevance');
  var [savedResources, setSavedResources] = useState([]);
  var [showFilters, setShowFilters] = useState(false);

  useEffect(function() {
    if (searchQuery) {
      performSearch();
    }
    loadSavedResources();
  }, []);

  var loadSavedResources = function() {
    var saved = localStorage.getItem('saved_resources');
    if (saved) {
      setSavedResources(JSON.parse(saved));
    }
  };

  var performSearch = async function() {
    if (searchTerm.length < 2) return;
    
    setLoading(true);
    try {
      var response = await api.get('/resources');
      var allResources = response.data.data || [];
      
      var filtered = allResources.filter(function(r) {
        var matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (r.tags && r.tags.some(function(t) { return t.toLowerCase().includes(searchTerm.toLowerCase()); }));
        
        var matchesType = filterType === 'all' || r.type.toLowerCase() === filterType;
        
        return matchesSearch && matchesType;
      });
      
      if (sortBy === 'date') {
        filtered.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
      } else if (sortBy === 'views') {
        filtered.sort(function(a, b) { return (b.views || 0) - (a.views || 0); });
      } else if (sortBy === 'downloads') {
        filtered.sort(function(a, b) { return (b.downloads || 0) - (a.downloads || 0); });
      }
      
      setResults(filtered);
    } catch (err) {
      console.error('Erreur:', err);
      setResults([
        { id: 1, title: 'Introduction à la Macroéconomie', type: 'PDF', tags: ['ÉCO', 'L1'], date: '12 Oct 2023', views: 1248, downloads: 342 },
        { id: 2, title: 'Analyse de cycle de vie', type: 'Vidéo', tags: ['EXAMEN', 'Environnement'], date: '08 Oct 2023', views: 856, downloads: 234 },
        { id: 3, title: 'Test de connaissances S1', type: 'Quiz', tags: ['EXAMEN', 'Évaluation'], date: '05 Oct 2023', views: 2104, downloads: 567 },
        { id: 4, title: 'Algorithmique avancée', type: 'PDF', tags: ['Algorithmique', 'L2'], date: '15 Nov 2023', views: 3421, downloads: 892 },
        { id: 5, title: 'Introduction au Machine Learning', type: 'Vidéo', tags: ['ML', 'IA'], date: '20 Nov 2023', views: 5678, downloads: 1234 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  var handleSaveResource = function(resource) {
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
  };

  var handleView = function(resource) {
    alert('Ouverture de: ' + resource.title);
  };

  var handleDownload = function(resource) {
    alert('Téléchargement de: ' + resource.title);
  };

  var handleKeyPress = function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  return React.createElement('div', { style: { padding: '20px', maxWidth: '1200px', margin: '0 auto' } },
    React.createElement('div', { style: { marginBottom: '30px' } },
      React.createElement('h1', { style: { fontSize: '24px', color: '#1a1a2e', marginBottom: '10px' } }, 'Recherche de ressources'),
      React.createElement('p', { style: { color: '#666' } }, 'Trouvez les ressources pédagogiques adaptées à vos besoins')
    ),
    
    React.createElement('div', { style: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' } },
      React.createElement('div', { style: { flex: 2, display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '12px 16px' } },
        React.createElement(FiSearch, { size: 20, color: '#999' }),
        React.createElement('input', {
          type: 'text',
          placeholder: 'Rechercher par titre, tag ou mot-clé...',
          value: searchTerm,
          onChange: function(e) { setSearchTerm(e.target.value); },
          onKeyPress: handleKeyPress,
          style: { flex: 1, border: 'none', outline: 'none', marginLeft: '10px', fontSize: '14px' }
        }),
        searchTerm && React.createElement('button', { 
          onClick: function() { setSearchTerm(''); setResults([]); },
          style: { background: 'none', border: 'none', cursor: 'pointer', color: '#999' }
        }, React.createElement(FiX, { size: 18 }))
      ),
      React.createElement('button', { 
        onClick: performSearch,
        style: { padding: '12px 24px', background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }
      }, 'Rechercher'),
      React.createElement('button', { 
        onClick: function() { setShowFilters(!showFilters); },
        style: { padding: '12px 20px', background: 'white', border: '1px solid #ddd', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }
      }, React.createElement(FiFilter, { size: 18 }), 'Filtres')
    ),
    
    showFilters && React.createElement('div', { style: { background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } },
      React.createElement('div', { style: { display: 'flex', gap: '20px', flexWrap: 'wrap' } },
        React.createElement('div', { style: { flex: 1 } },
          React.createElement('label', { style: { display: 'block', marginBottom: '8px', fontWeight: '500' } }, 'Type de ressource'),
          React.createElement('select', { 
            value: filterType, 
            onChange: function(e) { setFilterType(e.target.value); },
            style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }
          },
            React.createElement('option', { value: 'all' }, 'Tous'),
            React.createElement('option', { value: 'pdf' }, 'PDF'),
            React.createElement('option', { value: 'vidéo' }, 'Vidéo'),
            React.createElement('option', { value: 'quiz' }, 'Quiz')
          )
        ),
        React.createElement('div', { style: { flex: 1 } },
          React.createElement('label', { style: { display: 'block', marginBottom: '8px', fontWeight: '500' } }, 'Trier par'),
          React.createElement('select', { 
            value: sortBy, 
            onChange: function(e) { setSortBy(e.target.value); },
            style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }
          },
            React.createElement('option', { value: 'relevance' }, 'Pertinence'),
            React.createElement('option', { value: 'date' }, 'Date récente'),
            React.createElement('option', { value: 'views' }, 'Plus vues'),
            React.createElement('option', { value: 'downloads' }, 'Plus téléchargées')
          )
        )
      )
    ),
    
    loading && React.createElement('div', { style: { textAlign: 'center', padding: '40px' } },
      React.createElement('div', { style: { width: '40px', height: '40px', border: '3px solid rgba(155,89,182,0.2)', borderTopColor: '#9b59b6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' } }),
      React.createElement('p', null, 'Recherche en cours...')
    ),
    
    !loading && results.length === 0 && searchTerm && React.createElement('div', { style: { textAlign: 'center', padding: '60px', color: '#999' } },
      React.createElement(FiSearch, { size: 48, style: { marginBottom: '20px' } }),
      React.createElement('h3', null, 'Aucun résultat trouvé'),
      React.createElement('p', null, 'Essayez d\'autres mots-clés ou vérifiez l\'orthographe')
    ),
    
    !loading && results.length > 0 && React.createElement('div', null,
      React.createElement('div', { style: { marginBottom: '15px' } },
        React.createElement('p', null, results.length, ' résultat(s) trouvé(s)')
      ),
      React.createElement('div', { style: { display: 'grid', gap: '15px' } },
        results.map(function(resource) {
          var isSaved = savedResources.some(function(r) { return r.id === resource.id; });
          return React.createElement('div', { 
            key: resource.id, 
            style: { background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', transition: 'all 0.3s ease' }
          },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' } },
              React.createElement('span', { 
                style: { 
                  background: resource.type === 'PDF' ? '#fee2e2' : (resource.type === 'Vidéo' ? '#dbeafe' : '#d1fae5'),
                  color: resource.type === 'PDF' ? '#ef4444' : (resource.type === 'Vidéo' ? '#3b82f6' : '#10b981'),
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  fontSize: '11px', 
                  fontWeight: '600' 
                } 
              }, resource.type),
              React.createElement('button', {
                onClick: function() { handleSaveResource(resource); },
                style: { background: 'none', border: 'none', cursor: 'pointer', color: isSaved ? '#f59e0b' : '#ccc' }
              }, React.createElement(FiBookmark, { size: 18 }))
            ),
            React.createElement('h3', { style: { fontSize: '18px', marginBottom: '10px', color: '#1a1a2e' } }, resource.title),
            React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' } },
              resource.tags && resource.tags.map(function(tag) {
                return React.createElement('span', { key: tag, style: { background: '#f0f0f0', padding: '4px 10px', borderRadius: '15px', fontSize: '11px', color: '#666' } }, tag);
              })
            ),
            React.createElement('div', { style: { display: 'flex', gap: '20px', marginBottom: '15px', fontSize: '12px', color: '#999' } },
              React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '5px' } }, React.createElement(FiCalendar, { size: 14 }), resource.date || 'Date inconnue'),
              React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '5px' } }, React.createElement(FiTrendingUp, { size: 14 }), resource.views || 0, ' vues'),
              React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '5px' } }, '⬇️', resource.downloads || 0, ' téléch.')
            ),
            React.createElement('div', { style: { display: 'flex', gap: '10px', borderTop: '1px solid #f0f0f0', paddingTop: '15px' } },
              React.createElement('button', { 
                onClick: function() { handleView(resource); },
                style: { display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }
              }, React.createElement(FiEye, { size: 14 }), ' Consulter'),
              React.createElement('button', { 
                onClick: function() { handleDownload(resource); },
                style: { display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }
              }, React.createElement(FiDownload, { size: 14 }), ' Télécharger')
            )
          );
        })
      )
    )
  );
};

export default SearchPage;