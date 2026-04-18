import React, { useState } from 'react';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../../services/api';
import cleanup from '../../utils/cleanup';

var Login = function({ onLogin, onGoToRegister }) {
  var [showPassword, setShowPassword] = useState(false);
  var [email, setEmail] = useState('');
  var [password, setPassword] = useState('');
  var [selectedRole, setSelectedRole] = useState('');
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState('');

  var handleSubmit = async function(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      cleanup.cleanSession();
      
      const response = await api.post('/auth/login', {
        email: email,
        password: password,
        role: selectedRole || undefined
      });
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('current_user_id', user.id.toString());
        localStorage.setItem('user_data', JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }));
        
        var dashboardKey = 'dashboard_data_' + user.id;
        var existingDashboard = localStorage.getItem(dashboardKey);
        
        if (!existingDashboard) {
          var defaultDashboard = {
            profile: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              program: user.role === 'ENSEIGNANT' ? 'Enseignant en Informatique' : 'Master en IA',
              promo: 'Promo 2024',
              credits: { current: 112, total: 120 },
              average: 16.4,
              topPercent: 5,
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
          localStorage.setItem(dashboardKey, JSON.stringify(defaultDashboard));
        }
        
        localStorage.setItem('dashboard_data', localStorage.getItem(dashboardKey));
        
        onLogin(user);
      }
    } catch (err) {
      console.error('Erreur:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Erreur de connexion. Vérifiez vos identifiants.');
      }
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { 
    style: { 
      display: 'flex', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      alignItems: 'center',
      justifyContent: 'center'
    } 
  },
    React.createElement('div', { 
      style: { 
        background: 'white', 
        borderRadius: '20px', 
        padding: '40px', 
        width: '450px', 
        maxWidth: '90%',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
      } 
    },
      React.createElement('div', { style: { textAlign: 'center', marginBottom: '30px' } },
        React.createElement('h1', { style: { fontSize: '28px', color: '#1a1a2e', marginBottom: '10px' } }, 'The Curator'),
        React.createElement('p', { style: { color: '#666' } }, 'Connectez-vous à votre compte')
      ),
      
      error && React.createElement('div', { 
        style: { 
          background: '#fee2e2', 
          color: '#ef4444', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          fontSize: '13px',
          textAlign: 'center'
        } 
      }, error),
      
      React.createElement('form', { onSubmit: handleSubmit },
        React.createElement('div', { style: { marginBottom: '15px' } },
          React.createElement('label', { style: { display: 'block', marginBottom: '5px', fontWeight: '500', color: '#1a1a2e' } }, 'Rôle *'),
          React.createElement('select', {
            value: selectedRole,
            onChange: function(e) { setSelectedRole(e.target.value); setError(''); },
            required: true,
            style: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
          },
            React.createElement('option', { value: '' }, 'Sélectionnez votre rôle'),
            React.createElement('option', { value: 'ETUDIANT' }, 'Étudiant'),
            React.createElement('option', { value: 'ENSEIGNANT' }, 'Enseignant'),
            React.createElement('option', { value: 'ADMIN' }, 'Administrateur')
          )
        ),
        React.createElement('div', { style: { position: 'relative', marginBottom: '20px' } },
          React.createElement(FiMail, { size: 18, style: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' } }),
          React.createElement('input', {
            type: 'email',
            placeholder: 'Email institutionnel',
            value: email,
            onChange: function(e) { setEmail(e.target.value); },
            required: true,
            style: { width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
          })
        ),
        React.createElement('div', { style: { position: 'relative', marginBottom: '20px' } },
          React.createElement(FiLock, { size: 18, style: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' } }),
          React.createElement('input', {
            type: showPassword ? 'text' : 'password',
            placeholder: 'Mot de passe',
            value: password,
            onChange: function(e) { setPassword(e.target.value); },
            required: true,
            style: { width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
          }),
          React.createElement('button', {
            type: 'button',
            onClick: function() { setShowPassword(!showPassword); },
            style: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }
          }, showPassword ? React.createElement(FiEyeOff, { size: 18 }) : React.createElement(FiEye, { size: 18 }))
        ),
        React.createElement('button', { 
          type: 'submit', 
          disabled: loading,
          style: { 
            width: '100%', 
            padding: '12px', 
            background: loading ? '#ccc' : 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer'
          } 
        }, loading ? 'Connexion...' : 'Se connecter')
      ),
      React.createElement('div', { style: { textAlign: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e0e0e0' } },
        React.createElement('p', { style: { fontSize: '13px', color: '#666' } }, 'Pas encore de compte ? '),
        React.createElement('a', { 
          href: '#', 
          onClick: function(e) { e.preventDefault(); onGoToRegister(); },
          style: { color: '#9b59b6', textDecoration: 'none', fontWeight: 'bold' }
        }, 'S\'inscrire')
      )
    )
  );
};

export default Login;