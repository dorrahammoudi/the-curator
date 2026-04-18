import { useState, useEffect } from 'react';
import api from '../services/api';

var defaultData = {
  profile: {
    id: null,
    name: 'Utilisateur',
    program: 'Master II en Intelligence Artificielle & Big Data',
    promo: 'Promo LUMIÈRE 2024',
    credits: { current: 112, total: 120 },
    average: 16.4,
    topPercent: 5,
    role: 'ETUDIANT',
    email: '',
    interests: []
  },
  academicActivity: {
    months: ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN'],
    consultations: [45, 52, 68, 71, 85, 92],
    telechargements: [12, 18, 24, 28, 35, 42]
  },
  objectives: [
    { id: 1, label: 'PROJET DE FIN D\'ÉTUDES', percentage: 75 },
    { id: 2, label: 'RECHERCHE BIBLIOGRAPHIQUE', percentage: 40 }
  ],
  popularTags: [
    { id: 1, name: 'Generative AI', count: 840 },
    { id: 2, name: 'Neuro-Symbolic', count: 120 },
    { id: 3, name: 'Graph Theory', count: 350 }
  ],
  interests: []
};

export const useDashboardData = function() {
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [data, setData] = useState(defaultData);

  var loadData = function() {
    try {
      setLoading(true);
      
      var currentUserId = localStorage.getItem('current_user_id');
      
      if (!currentUserId) {
        setLoading(false);
        return;
      }
      
      var dashboardKey = 'dashboard_data_' + currentUserId;
      var savedDashboardData = localStorage.getItem(dashboardKey);
      
      var newData = JSON.parse(JSON.stringify(defaultData));
      
      if (savedDashboardData) {
        newData = JSON.parse(savedDashboardData);
      }
      
      var userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      if (userData && userData.id == currentUserId) {
        newData.profile = {
          ...newData.profile,
          id: userData.id,
          name: userData.name || newData.profile.name,
          role: userData.role || newData.profile.role,
          email: userData.email || ''
        };
      }
      
      var interestsKey = 'interests_' + currentUserId;
      var savedInterests = localStorage.getItem(interestsKey);
      if (savedInterests) {
        newData.interests = JSON.parse(savedInterests);
        newData.profile.interests = newData.interests;
      }
      
      localStorage.setItem('dashboard_data', JSON.stringify(newData));
      
      setData(newData);
      setLoading(false);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des données');
      setLoading(false);
    }
  };

  useEffect(function() {
    loadData();
    
    var handleStorageChange = function(e) {
      if (e.key === 'current_user_id') {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return function() { window.removeEventListener('storage', handleStorageChange); };
  }, []);

  var saveToLocalStorage = function(newData) {
    var currentUserId = localStorage.getItem('current_user_id');
    if (currentUserId) {
      localStorage.setItem('dashboard_data_' + currentUserId, JSON.stringify(newData));
      localStorage.setItem('dashboard_data', JSON.stringify(newData));
    }
  };

  var updateProfile = function(updatedProfile) {
    var newData = JSON.parse(JSON.stringify(data));
    newData.profile = { ...newData.profile, ...updatedProfile };
    setData(newData);
    saveToLocalStorage(newData);
  };

  var updateObjective = function(id, percentage) {
    var newData = JSON.parse(JSON.stringify(data));
    newData.objectives = newData.objectives.map(function(obj) {
      return obj.id === id ? { ...obj, percentage: percentage } : obj;
    });
    setData(newData);
    saveToLocalStorage(newData);
  };

  var addInterest = function(tag) {
    if (!data.interests.includes(tag)) {
      var newData = JSON.parse(JSON.stringify(data));
      newData.interests.push(tag);
      newData.profile.interests = newData.interests;
      setData(newData);
      saveToLocalStorage(newData);
      
      var currentUserId = localStorage.getItem('current_user_id');
      localStorage.setItem('interests_' + currentUserId, JSON.stringify(newData.interests));
    }
  };

  var removeInterest = function(tag) {
    var newData = JSON.parse(JSON.stringify(data));
    newData.interests = newData.interests.filter(function(t) { return t !== tag; });
    newData.profile.interests = newData.interests;
    setData(newData);
    saveToLocalStorage(newData);
    
    var currentUserId = localStorage.getItem('current_user_id');
    localStorage.setItem('interests_' + currentUserId, JSON.stringify(newData.interests));
  };

  var refreshData = function() {
    loadData();
  };

  return {
    loading: loading,
    error: error,
    data: data,
    updateProfile: updateProfile,
    updateObjective: updateObjective,
    addInterest: addInterest,
    removeInterest: removeInterest,
    refreshData: refreshData
  };
};