import React, { useState, useEffect, useCallback } from 'react';
import { FiTrendingUp, FiDownload, FiEye } from 'react-icons/fi';
import userStats from '../../utils/userStats';

var AcademicActivity = function({ data }) {
  var [stats, setStats] = useState({
    months: ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN'],
    consultations: [0, 0, 0, 0, 0, 0],
    telechargements: [0, 0, 0, 0, 0, 0]
  });
  var [totalViews, setTotalViews] = useState(0);
  var [totalDownloads, setTotalDownloads] = useState(0);

  var parseFrenchDate = function(dateStr) {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
      var parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
    } else if (dateStr.includes('-')) {
      return new Date(dateStr);
    }
    return new Date(dateStr);
  };

  var calculateRealStats = useCallback(function() {
    var currentUserId = localStorage.getItem('current_user_id');
    if (!currentUserId) return;
    
    var viewedResources = userStats.getUserViews(currentUserId);
    var downloadedResources = userStats.getUserDownloads(currentUserId);
    
    console.log('📊 Activité - Utilisateur:', currentUserId);
    console.log('   Consultations:', viewedResources.length);
    console.log('   Téléchargements:', downloadedResources.length);
    
    var months = [];
    var currentDate = new Date();
    
    for (var i = 5; i >= 0; i--) {
      var date = new Date();
      date.setMonth(currentDate.getMonth() - i);
      var monthNames = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];
      months.push(monthNames[date.getMonth()]);
    }
    
    var consultations = [0, 0, 0, 0, 0, 0];
    var telechargements = [0, 0, 0, 0, 0, 0];
    
    var today = new Date();
    var sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    
    viewedResources.forEach(function(resource) {
      if (resource.date) {
        var resourceDate = parseFrenchDate(resource.date);
        if (resourceDate && !isNaN(resourceDate.getTime()) && resourceDate >= sixMonthsAgo && resourceDate <= today) {
          var monthDiff = (resourceDate.getFullYear() - sixMonthsAgo.getFullYear()) * 12 + 
                          (resourceDate.getMonth() - sixMonthsAgo.getMonth());
          if (monthDiff >= 0 && monthDiff < 6) {
            consultations[monthDiff]++;
          }
        }
      }
    });
    
    downloadedResources.forEach(function(resource) {
      if (resource.date) {
        var resourceDate = parseFrenchDate(resource.date);
        if (resourceDate && !isNaN(resourceDate.getTime()) && resourceDate >= sixMonthsAgo && resourceDate <= today) {
          var monthDiff = (resourceDate.getFullYear() - sixMonthsAgo.getFullYear()) * 12 + 
                          (resourceDate.getMonth() - sixMonthsAgo.getMonth());
          if (monthDiff >= 0 && monthDiff < 6) {
            telechargements[monthDiff]++;
          }
        }
      }
    });
    
    setStats({
      months: months,
      consultations: consultations,
      telechargements: telechargements
    });
    
    setTotalViews(viewedResources.length);
    setTotalDownloads(downloadedResources.length);
  }, []);

  useEffect(function() {
    calculateRealStats();
    
    var handleStorageChange = function(e) {
      calculateRealStats();
    };
    window.addEventListener('storage', handleStorageChange);
    
    return function() {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [calculateRealStats]);

  var maxValue = Math.max(...stats.consultations, ...stats.telechargements, 5);
  var chartHeight = 120;

  return React.createElement('div', { style: { background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } },
    React.createElement('h3', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#1a1a2e' } },
      React.createElement(FiTrendingUp, { size: 20 }), ' Activité Académique'
    ),
    React.createElement('p', { style: { color: '#666', marginBottom: '20px', fontSize: '13px' } }, 
      'Suivi des consultations et téléchargements sur 6 mois'
    ),
    React.createElement('div', { style: { marginBottom: '30px' } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' } },
        React.createElement('div', { style: { fontSize: '12px', color: '#9b59b6', fontWeight: '500' } }, '📖 Consultations'),
        React.createElement('div', { style: { fontSize: '12px', color: '#3b82f6', fontWeight: '500' } }, '⬇️ Téléchargements')
      ),
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: chartHeight + 30 + 'px' } },
        stats.months.map(function(month, index) {
          var consultHeight = (stats.consultations[index] / maxValue) * chartHeight;
          var downloadHeight = (stats.telechargements[index] / maxValue) * chartHeight;
          return React.createElement('div', { key: month, style: { textAlign: 'center', width: '45px' } },
            React.createElement('div', { style: { display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'flex-end', height: chartHeight + 'px' } },
              React.createElement('div', { 
                style: { 
                  width: '14px', 
                  height: Math.max(consultHeight, 4) + 'px', 
                  background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.5s ease'
                } 
              }),
              React.createElement('div', { 
                style: { 
                  width: '14px', 
                  height: Math.max(downloadHeight, 4) + 'px', 
                  background: '#3b82f6',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.5s ease'
                } 
              })
            ),
            React.createElement('div', { style: { marginTop: '8px', fontSize: '11px', color: '#666', fontWeight: '500' } }, month),
            React.createElement('div', { style: { fontSize: '9px', color: '#999', marginTop: '2px' } }, 
              stats.consultations[index] + ' / ' + stats.telechargements[index]
            )
          );
        })
      )
    ),
    React.createElement('div', { style: { display: 'flex', gap: '20px', paddingTop: '15px', borderTop: '1px solid #f0f0f0' } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1, background: '#f8f9fa', padding: '10px', borderRadius: '10px' } },
        React.createElement(FiEye, { size: 24, color: '#9b59b6' }),
        React.createElement('div', null,
          React.createElement('div', { style: { fontSize: '20px', fontWeight: 'bold', color: '#1a1a2e' } }, totalViews),
          React.createElement('div', { style: { fontSize: '11px', color: '#666' } }, 'ressources consultées')
        )
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1, background: '#f8f9fa', padding: '10px', borderRadius: '10px' } },
        React.createElement(FiDownload, { size: 24, color: '#3b82f6' }),
        React.createElement('div', null,
          React.createElement('div', { style: { fontSize: '20px', fontWeight: 'bold', color: '#1a1a2e' } }, totalDownloads),
          React.createElement('div', { style: { fontSize: '11px', color: '#666' } }, 'téléchargements')
        )
      )
    )
  );
};

export default AcademicActivity;