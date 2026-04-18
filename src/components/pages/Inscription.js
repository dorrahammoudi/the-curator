import React, { useState } from 'react';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiCheckCircle, FiCalendar, FiPhone, FiMapPin, FiShield, FiSend } from 'react-icons/fi';
import api from '../../services/api';

var Inscription = function({ onRegister, onGoToLogin }) {
  var [showPassword, setShowPassword] = useState(false);
  var [showConfirmPassword, setShowConfirmPassword] = useState(false);
  var [step, setStep] = useState(1);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState('');
  var [verificationCode, setVerificationCode] = useState('');
  var [generatedCode, setGeneratedCode] = useState('');
  var [codeSent, setCodeSent] = useState(false);
  var [resendCount, setResendCount] = useState(0);
  
  var [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'ETUDIANT',
    filiere: '',
    niveau: 'L1',
    telephone: '',
    promo: '',
    credits: '',
    moyenne: '',
    dateNaissance: '',
    adresse: '',
    departement: '',
    specialite: '',
    titre: 'Maître de Conférences',
    bureau: '',
    heuresCours: '',
    adminEmail: '',
    establishment: ''
  });

  var isRnuEmail = function(email) {
    if (!email) return false;
    var domain = email.split('@')[1];
    if (!domain) return false;
    return domain.includes('.rnu');
  };

  var generateVerificationCode = function() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  var sendVerificationCode = function() {
    setLoading(true);
    var code = generateVerificationCode();
    setGeneratedCode(code);
    
    setTimeout(function() {
      setCodeSent(true);
      setLoading(false);
      alert('📧 Code de vérification envoyé à ' + formData.email + '\n\nCode: ' + code);
    }, 1000);
  };

  var verifyCode = function() {
    if (verificationCode === generatedCode) {
      setError('');
      return true;
    } else {
      setError('❌ Code de vérification incorrect.');
      return false;
    }
  };

  var resendCode = function() {
    if (resendCount >= 3) {
      setError('❌ Trop de tentatives.');
      return;
    }
    setResendCount(resendCount + 1);
    sendVerificationCode();
  };

  var handleChange = function(e) {
    var name = e.target.name;
    var value = e.target.value;
    setFormData({ ...formData, [name]: value });
  };

  var handleNext = function() {
    setError('');
    
    if (step === 2) {
      if (formData.role === 'ADMIN') {
        if (!isRnuEmail(formData.email)) {
          setError('❌ Les comptes administrateurs nécessitent un email avec .rnu');
          return;
        }
      } else if (formData.role === 'ENSEIGNANT') {
        if (!isRnuEmail(formData.email)) {
          setError('❌ Les enseignants doivent utiliser un email avec .rnu');
          return;
        }
        if (!formData.adminEmail) {
          setError('❌ Veuillez indiquer l\'email de l\'administrateur');
          return;
        }
        if (!isRnuEmail(formData.adminEmail)) {
          setError('❌ L\'email de l\'administrateur doit être un email .rnu');
          return;
        }
        if (!formData.establishment) {
          setError('❌ Veuillez indiquer votre établissement');
          return;
        }
      }
    }
    
    if (step === 1) {
      if (formData.password !== formData.confirmPassword) {
        alert('Les mots de passe ne correspondent pas');
        return;
      }
      if (formData.password.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
      if (!formData.nom || !formData.prenom || !formData.email) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
      }
    }
    
    if (step === 2 && formData.role === 'ETUDIANT' && !formData.filiere) {
      alert('Veuillez sélectionner une filière');
      return;
    }
    
    if (step === 2 && formData.role === 'ENSEIGNANT') {
      if (!formData.departement || !formData.specialite) {
        alert('Veuillez remplir département et spécialité');
        return;
      }
      setStep(step + 1);
      setCodeSent(false);
      setVerificationCode('');
      setGeneratedCode('');
      return;
    }
    
    setStep(step + 1);
  };
  var handleSubmit = async function(e) {
    e.preventDefault();
    
    if (formData.role === 'ENSEIGNANT' && !verifyCode()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    var creditsParts = formData.credits ? formData.credits.split('/') : ['112', '120'];
    
    try {
      const response = await api.post('/auth/register', {
        name: formData.prenom + ' ' + formData.nom,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        filiere: formData.filiere,      // ← AJOUTER LA FILIÈRE
        niveau: formData.niveau,        // ← AJOUTER LE NIVEAU
        specialite: formData.specialite // ← AJOUTER LA SPÉCIALITÉ
      });
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('current_user_id', user.id.toString());
        
        var completeUserData = {
          id: user.id,
          name: formData.prenom + ' ' + formData.nom,
          email: formData.email,
          role: formData.role,
          creditsObj: {
            current: parseInt(creditsParts[0]) || 112,
            total: parseInt(creditsParts[1]) || 120
          },
          average: parseFloat(formData.moyenne) || 16.4,
          program: formData.role === 'ETUDIANT' 
            ? 'Master II en ' + (formData.filiere || 'Intelligence Artificielle & Big Data')
            : (formData.role === 'ENSEIGNANT' 
              ? 'Enseignant en ' + (formData.departement || 'Informatique')
              : 'Administrateur'),
          promo: formData.promo || 'Promo 2024',
          telephone: formData.telephone,
          dateNaissance: formData.dateNaissance,
          adresse: formData.adresse,
          filiere: formData.filiere,           // ← AJOUTER LA FILIÈRE ICI
          niveau: formData.niveau,             // ← AJOUTER LE NIVEAU ICI
          specialite: formData.specialite,     // ← AJOUTER LA SPÉCIALITÉ ICI
          departement: formData.departement,
          titre: formData.titre,
          bureau: formData.bureau,
          heuresCours: formData.heuresCours,
          establishment: formData.establishment,
          adminEmail: formData.adminEmail
        };
        
        localStorage.setItem('user_data', JSON.stringify(completeUserData));
        
        var dashboardKey = 'dashboard_data_' + user.id;
        var dashboardData = {
          profile: {
            id: user.id,
            name: completeUserData.name,
            program: completeUserData.program,
            promo: completeUserData.promo,
            credits: completeUserData.creditsObj,
            average: completeUserData.average,
            email: completeUserData.email,
            telephone: completeUserData.telephone || '',
            dateNaissance: completeUserData.dateNaissance || '',
            adresse: completeUserData.adresse || '',
            filiere: completeUserData.filiere || '',        // ← AJOUTER LA FILIÈRE
            niveau: completeUserData.niveau || 'M2',       // ← AJOUTER LE NIVEAU
            specialite: completeUserData.specialite || '', // ← AJOUTER LA SPÉCIALITÉ
            role: completeUserData.role,
            topPercent: 5,
            departement: completeUserData.departement || '',
            titre: completeUserData.titre || '',
            bureau: completeUserData.bureau || '',
            heuresCours: completeUserData.heuresCours || '',
            establishment: completeUserData.establishment || '',
            adminEmail: completeUserData.adminEmail,
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
        
        localStorage.setItem(dashboardKey, JSON.stringify(dashboardData));
        localStorage.setItem('dashboard_data', JSON.stringify(dashboardData));
        
        // Sauvegarder dans la liste des utilisateurs
        var allUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
        allUsers.push({
          id: user.id,
          email: formData.email,
          name: completeUserData.name,
          role: formData.role,
          filiere: formData.filiere,      // ← AJOUTER LA FILIÈRE
          niveau: formData.niveau,        // ← AJOUTER LE NIVEAU
          specialite: formData.specialite,// ← AJOUTER LA SPÉCIALITÉ
          adminEmail: formData.adminEmail
        });
        localStorage.setItem('all_users', JSON.stringify(allUsers));
        
        setLoading(false);
        onRegister(completeUserData);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
      setLoading(false);
    }
  };

  var filieres = ['Sélectionner une filière', 'Informatique', 'Mathématiques', 'Physique', 'Chimie', 'Biologie', 'Économie', 'Gestion', 'Droit'];
  var departements = ['Sélectionner un département', 'Informatique', 'Mathématiques', 'Physique', 'Chimie', 'Biologie', 'Droit', 'Économie'];
  var titres = ['Professeur', 'Maître de Conférences', 'Assistant', 'Chercheur', 'Doctorant', 'Vacataire'];
  var niveaux = ['L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat'];

  var isVerificationStep = (step === 3 && formData.role === 'ENSEIGNANT');
  var normalStep = step === 3 && !isVerificationStep;

  return React.createElement('div', { 
    style: { 
      display: 'flex', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      overflowY: 'auto',
      overflowX: 'hidden'
    } 
  },
    React.createElement('div', { 
      style: { 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: '40px',
        color: 'white'
      } 
    },
      React.createElement('div', { style: { textAlign: 'center', marginBottom: '40px' } },
        React.createElement('h1', { style: { fontSize: '36px', marginBottom: '10px' } }, 'The Curator'),
        React.createElement('p', { style: { fontSize: '14px', letterSpacing: '2px', opacity: 0.8 } }, 'Rejoignez notre communauté académique')
      ),
      React.createElement('div', { style: { maxWidth: '400px', margin: '0 auto' } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' } },
          React.createElement(FiCheckCircle, { size: 24, color: '#10b981' }),
          React.createElement('div', null,
            React.createElement('h4', { style: { marginBottom: '5px' } }, 'Accès illimité'),
            React.createElement('p', { style: { fontSize: '13px', opacity: 0.8 } }, 'À toutes les ressources pédagogiques')
          )
        ),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' } },
          React.createElement(FiCheckCircle, { size: 24, color: '#10b981' }),
          React.createElement('div', null,
            React.createElement('h4', { style: { marginBottom: '5px' } }, 'Recommandations personnalisées'),
            React.createElement('p', { style: { fontSize: '13px', opacity: 0.8 } }, 'Basées sur vos centres d\'intérêt')
          )
        ),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' } },
          React.createElement(FiCheckCircle, { size: 24, color: '#10b981' }),
          React.createElement('div', null,
            React.createElement('h4', { style: { marginBottom: '5px' } }, 'Suivi de progression'),
            React.createElement('p', { style: { fontSize: '13px', opacity: 0.8 } }, 'Visualisez vos objectifs académiques')
          )
        )
      )
    ),
    React.createElement('div', { 
      style: { 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        background: 'white',
        padding: '40px 20px',
        overflowY: 'auto',
        maxHeight: '100vh'
      } 
    },
      React.createElement('div', { 
        style: { 
          width: '550px', 
          maxWidth: '100%', 
          padding: '30px', 
          background: 'white', 
          borderRadius: '20px', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          maxHeight: '90vh',
          overflowY: 'auto'
        } 
      },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '30px' } },
          React.createElement('div', { 
            style: { 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              background: step >= 1 ? 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)' : '#f0f0f0',
              color: step >= 1 ? 'white' : '#999',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 'bold' 
            } 
          }, '1'),
          React.createElement('div', { style: { width: '60px', height: '2px', background: step >= 2 ? '#9b59b6' : '#e0e0e0' } }),
          React.createElement('div', { 
            style: { 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              background: step >= 2 ? 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)' : '#f0f0f0',
              color: step >= 2 ? 'white' : '#999',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 'bold' 
            } 
          }, '2'),
          React.createElement('div', { style: { width: '60px', height: '2px', background: step >= 3 ? '#9b59b6' : '#e0e0e0' } }),
          React.createElement('div', { 
            style: { 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              background: step >= 3 ? 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)' : '#f0f0f0',
              color: step >= 3 ? 'white' : '#999',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 'bold' 
            } 
          }, formData.role === 'ENSEIGNANT' ? 'Code' : '3')
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
        
        React.createElement('form', { onSubmit: (step === 3 && !isVerificationStep) || (isVerificationStep && codeSent) ? handleSubmit : function(e) { e.preventDefault(); } },
          step === 1 && React.createElement('div', null,
            React.createElement('h2', { style: { textAlign: 'center', marginBottom: '20px', fontSize: '20px', color: '#1a1a2e' } }, 'Informations personnelles'),
            React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' } },
              React.createElement('div', { style: { position: 'relative' } },
                React.createElement(FiUser, { size: 18, style: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' } }),
                React.createElement('input', {
                  type: 'text',
                  name: 'nom',
                  placeholder: 'Nom *',
                  value: formData.nom,
                  onChange: handleChange,
                  required: true,
                  style: { width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
                })
              ),
              React.createElement('div', { style: { position: 'relative' } },
                React.createElement(FiUser, { size: 18, style: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' } }),
                React.createElement('input', {
                  type: 'text',
                  name: 'prenom',
                  placeholder: 'Prénom *',
                  value: formData.prenom,
                  onChange: handleChange,
                  required: true,
                  style: { width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
                })
              )
            ),
            React.createElement('div', { style: { position: 'relative', marginBottom: '15px' } },
              React.createElement(FiMail, { size: 18, style: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' } }),
              React.createElement('input', {
                type: 'email',
                name: 'email',
                placeholder: 'Email institutionnel *',
                value: formData.email,
                onChange: handleChange,
                required: true,
                style: { width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
              })
            ),
            React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' } },
              React.createElement('div', { style: { position: 'relative' } },
                React.createElement(FiPhone, { size: 18, style: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' } }),
                React.createElement('input', {
                  type: 'tel',
                  name: 'telephone',
                  placeholder: 'Téléphone',
                  value: formData.telephone,
                  onChange: handleChange,
                  style: { width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
                })
              ),
              React.createElement('div', { style: { position: 'relative' } },
                React.createElement(FiCalendar, { size: 18, style: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' } }),
                React.createElement('input', {
                  type: 'date',
                  name: 'dateNaissance',
                  placeholder: 'Date de naissance',
                  value: formData.dateNaissance,
                  onChange: handleChange,
                  style: { width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
                })
              )
            ),
            React.createElement('div', { style: { position: 'relative', marginBottom: '15px' } },
              React.createElement(FiMapPin, { size: 18, style: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' } }),
              React.createElement('input', {
                type: 'text',
                name: 'adresse',
                placeholder: 'Adresse',
                value: formData.adresse,
                onChange: handleChange,
                style: { width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
              })
            ),
            React.createElement('div', { style: { position: 'relative', marginBottom: '15px' } },
              React.createElement(FiLock, { size: 18, style: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' } }),
              React.createElement('input', {
                type: showPassword ? 'text' : 'password',
                name: 'password',
                placeholder: 'Mot de passe (min. 6 caractères) *',
                value: formData.password,
                onChange: handleChange,
                required: true,
                style: { width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
              }),
              React.createElement('button', {
                type: 'button',
                onClick: function() { setShowPassword(!showPassword); },
                style: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }
              }, showPassword ? React.createElement(FiEyeOff, { size: 18 }) : React.createElement(FiEye, { size: 18 }))
            ),
            React.createElement('div', { style: { position: 'relative', marginBottom: '15px' } },
              React.createElement(FiLock, { size: 18, style: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' } }),
              React.createElement('input', {
                type: showConfirmPassword ? 'text' : 'password',
                name: 'confirmPassword',
                placeholder: 'Confirmer le mot de passe *',
                value: formData.confirmPassword,
                onChange: handleChange,
                required: true,
                style: { width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
              }),
              React.createElement('button', {
                type: 'button',
                onClick: function() { setShowConfirmPassword(!showConfirmPassword); },
                style: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }
              }, showConfirmPassword ? React.createElement(FiEyeOff, { size: 18 }) : React.createElement(FiEye, { size: 18 }))
            )
          ),
          
          step === 2 && React.createElement('div', null,
            React.createElement('h2', { style: { textAlign: 'center', marginBottom: '20px', fontSize: '20px', color: '#1a1a2e' } }, 'Informations académiques'),
            React.createElement('div', { style: { display: 'flex', gap: '15px', marginBottom: '20px' } },
              React.createElement('button', {
                type: 'button',
                onClick: function() { setFormData({ ...formData, role: 'ETUDIANT' }); setError(''); },
                style: { 
                  flex: 1, 
                  padding: '12px', 
                  border: '2px solid ' + (formData.role === 'ETUDIANT' ? '#9b59b6' : '#ddd'),
                  background: formData.role === 'ETUDIANT' ? 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)' : 'white',
                  color: formData.role === 'ETUDIANT' ? 'white' : '#666',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }
              }, 'Étudiant'),
              React.createElement('button', {
                type: 'button',
                onClick: function() { setFormData({ ...formData, role: 'ENSEIGNANT' }); setError(''); },
                style: { 
                  flex: 1, 
                  padding: '12px', 
                  border: '2px solid ' + (formData.role === 'ENSEIGNANT' ? '#9b59b6' : '#ddd'),
                  background: formData.role === 'ENSEIGNANT' ? 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)' : 'white',
                  color: formData.role === 'ENSEIGNANT' ? 'white' : '#666',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }
              }, 'Enseignant'),
              React.createElement('button', {
                type: 'button',
                onClick: function() { setFormData({ ...formData, role: 'ADMIN' }); setError(''); },
                style: { 
                  flex: 1, 
                  padding: '12px', 
                  border: '2px solid ' + (formData.role === 'ADMIN' ? '#9b59b6' : '#ddd'),
                  background: formData.role === 'ADMIN' ? 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)' : 'white',
                  color: formData.role === 'ADMIN' ? 'white' : '#666',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }
              }, 'Admin')
            ),
            
            formData.role === 'ETUDIANT' && React.createElement('div', null,
              React.createElement('div', { style: { marginBottom: '15px' } },
                React.createElement('label', { style: { display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1a2e' } }, 'Filière *'),
                React.createElement('select', {
                  name: 'filiere',
                  value: formData.filiere,
                  onChange: handleChange,
                  required: true,
                  style: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
                },
                  filieres.map(function(f) {
                    return React.createElement('option', { key: f, value: f === 'Sélectionner une filière' ? '' : f }, f);
                  })
                )
              ),
              React.createElement('div', { style: { marginBottom: '15px' } },
                React.createElement('label', { style: { display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1a2e' } }, 'Niveau'),
                React.createElement('select', {
                  name: 'niveau',
                  value: formData.niveau,
                  onChange: handleChange,
                  style: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
                },
                  niveaux.map(function(n) {
                    return React.createElement('option', { key: n, value: n }, n);
                  })
                )
              ),
              React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' } },
                React.createElement('div', null,
                  React.createElement('label', { style: { display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1a2e' } }, 'Promotion'),
                  React.createElement('input', {
                    type: 'text',
                    name: 'promo',
                    placeholder: 'Ex: Promo 2024',
                    value: formData.promo,
                    onChange: handleChange,
                    style: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
                  })
                ),
                React.createElement('div', null,
                  React.createElement('label', { style: { display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1a2e' } }, 'Crédits ECTS'),
                  React.createElement('input', {
                    type: 'text',
                    name: 'credits',
                    placeholder: '112/120',
                    value: formData.credits,
                    onChange: handleChange,
                    style: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
                  })
                )
              ),
              React.createElement('div', { style: { marginBottom: '15px' } },
                React.createElement('label', { style: { display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1a2e' } }, 'Moyenne générale'),
                React.createElement('input', {
                  type: 'text',
                  name: 'moyenne',
                  placeholder: '14.5',
                  value: formData.moyenne,
                  onChange: handleChange,
                  style: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
                })
              )
            ),
            
            formData.role === 'ENSEIGNANT' && React.createElement('div', null,
              React.createElement('div', { style: { marginBottom: '15px' } },
                React.createElement('label', { style: { display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1a2e' } }, 'Établissement *'),
                React.createElement('input', {
                  type: 'text',
                  name: 'establishment',
                  placeholder: 'Ex: Université de Tunis',
                  value: formData.establishment,
                  onChange: handleChange,
                  required: true,
                  style: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
                })
              ),
              React.createElement('div', { style: { marginBottom: '15px' } },
                React.createElement('label', { style: { display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1a2e' } }, 'Email de l\'administrateur *'),
                React.createElement('div', { style: { position: 'relative' } },
                  React.createElement(FiShield, { size: 18, style: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' } }),
                  React.createElement('input', {
                    type: 'email',
                    name: 'adminEmail',
                    placeholder: 'admin@universite.rnu.tn',
                    value: formData.adminEmail,
                    onChange: handleChange,
                    required: true,
                    style: { width: '100%', padding: '12px 12px 12px 40px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
                  })
                )
              ),
              React.createElement('div', { style: { marginBottom: '15px' } },
                React.createElement('label', { style: { display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1a2e' } }, 'Département *'),
                React.createElement('select', {
                  name: 'departement',
                  value: formData.departement,
                  onChange: handleChange,
                  required: true,
                  style: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
                },
                  departements.map(function(d) {
                    return React.createElement('option', { key: d, value: d === 'Sélectionner un département' ? '' : d }, d);
                  })
                )
              ),
              React.createElement('div', { style: { marginBottom: '15px' } },
                React.createElement('label', { style: { display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1a2e' } }, 'Spécialité *'),
                React.createElement('input', {
                  type: 'text',
                  name: 'specialite',
                  placeholder: 'Ex: Intelligence Artificielle',
                  value: formData.specialite,
                  onChange: handleChange,
                  required: true,
                  style: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
                })
              ),
              React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' } },
                React.createElement('div', null,
                  React.createElement('label', { style: { display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1a2e' } }, 'Titre / Grade'),
                  React.createElement('select', {
                    name: 'titre',
                    value: formData.titre,
                    onChange: handleChange,
                    style: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
                  },
                    titres.map(function(t) {
                      return React.createElement('option', { key: t, value: t }, t);
                    })
                  )
                ),
                React.createElement('div', null,
                  React.createElement('label', { style: { display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1a2e' } }, 'Bureau'),
                  React.createElement('input', {
                    type: 'text',
                    name: 'bureau',
                    placeholder: 'Bâtiment A, bureau 12',
                    value: formData.bureau,
                    onChange: handleChange,
                    style: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
                  })
                )
              ),
              React.createElement('div', { style: { marginBottom: '15px' } },
                React.createElement('label', { style: { display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1a2e' } }, 'Heures de cours par semaine'),
                React.createElement('input', {
                  type: 'number',
                  name: 'heuresCours',
                  placeholder: '18',
                  value: formData.heuresCours,
                  onChange: handleChange,
                  style: { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }
                })
              ),
              React.createElement('div', { style: { background: '#dbeafe', padding: '15px', borderRadius: '12px', marginTop: '15px' } },
                React.createElement('p', { style: { color: '#1e40af', fontSize: '13px', margin: 0 } }, 
                  '📧 Un code de vérification sera envoyé par l\'administrateur.'
                )
              )
            ),
            
            formData.role === 'ADMIN' && React.createElement('div', { 
              style: { background: '#fef3c7', padding: '15px', borderRadius: '12px', marginTop: '15px' } 
            },
              React.createElement('p', { style: { color: '#92400e', fontSize: '13px', margin: 0 } }, 
                '🔐 Les comptes administrateurs nécessitent un email avec .rnu'
              )
            )
          ),
          
          isVerificationStep && React.createElement('div', null,
            React.createElement('h2', { style: { textAlign: 'center', marginBottom: '20px', fontSize: '20px', color: '#1a1a2e' } }, 
              React.createElement(FiShield, { size: 24, style: { display: 'inline-block', marginRight: '10px', verticalAlign: 'middle' } }),
              'Vérification requise'
            ),
            React.createElement('div', { style: { background: '#fef3c7', padding: '20px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' } },
              React.createElement(FiSend, { size: 48, color: '#d97706', style: { marginBottom: '15px' } }),
              React.createElement('p', { style: { color: '#92400e', fontSize: '14px', marginBottom: '10px' } },
                'Un code de vérification a été envoyé par l\'administrateur.'
              ),
              React.createElement('p', { style: { color: '#78350f', fontSize: '12px' } },
                'Email: ' + formData.email
              )
            ),
            
            !codeSent ? React.createElement('div', { style: { textAlign: 'center', marginBottom: '20px' } },
              React.createElement('button', {
                type: 'button',
                onClick: sendVerificationCode,
                disabled: loading,
                style: {
                  padding: '14px 24px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  width: '100%'
                }
              }, loading ? 'Envoi...' : '📨 Demander le code')
            ) : React.createElement('div', null,
              React.createElement('div', { style: { marginBottom: '20px' } },
                React.createElement('label', { style: { display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1a1a2e' } }, 'Code à 6 chiffres'),
                React.createElement('input', {
                  type: 'text',
                  placeholder: 'Entrez le code reçu',
                  value: verificationCode,
                  onChange: function(e) { setVerificationCode(e.target.value); setError(''); },
                  maxLength: 6,
                  style: { width: '100%', padding: '14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', textAlign: 'center', letterSpacing: '4px' }
                })
              ),
              React.createElement('button', {
                type: 'button',
                onClick: resendCode,
                style: {
                  background: 'none',
                  border: 'none',
                  color: '#9b59b6',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textDecoration: 'underline',
                  marginBottom: '20px',
                  display: 'block',
                  width: '100%'
                }
              }, 'Renvoyer le code', resendCount > 0 && ' (' + resendCount + '/3)')
            )
          ),
          
          normalStep && React.createElement('div', null,
            React.createElement('h2', { style: { textAlign: 'center', marginBottom: '20px', fontSize: '20px', color: '#1a1a2e' } }, 'Confirmation'),
            React.createElement('div', { style: { background: '#f8f9fa', borderRadius: '12px', padding: '15px', marginBottom: '20px' } },
              React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0' } },
                React.createElement('strong', null, 'Nom:'),
                React.createElement('span', null, formData.prenom + ' ' + formData.nom)
              ),
              React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0' } },
                React.createElement('strong', null, 'Email:'),
                React.createElement('span', null, formData.email)
              ),
              React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0' } },
                React.createElement('strong', null, 'Rôle:'),
                React.createElement('span', null, formData.role === 'ETUDIANT' ? 'Étudiant' : 'Administrateur')
              )
            ),
            React.createElement('p', { style: { fontSize: '12px', color: '#666', textAlign: 'center', marginBottom: '20px' } },
              'En créant un compte, vous acceptez nos conditions.'
            )
          ),
          
          React.createElement('div', { 
            style: { 
              display: 'flex', 
              gap: '15px', 
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '1px solid #e0e0e0'
            } 
          },
            step > 1 && React.createElement('button', { 
              type: 'button', 
              onClick: function() { setStep(step - 1); },
              style: { 
                flex: 1, 
                padding: '12px', 
                background: 'white', 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontWeight: '600', 
                color: '#666'
              }
            }, '← Retour'),
            
            !isVerificationStep && step < 3 && React.createElement('button', { 
              type: 'button', 
              onClick: handleNext,
              style: { 
                flex: 1, 
                padding: '12px', 
                background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontWeight: '600'
              }
            }, 'Suivant →'),
            
            isVerificationStep && codeSent && React.createElement('button', { 
              type: 'submit',
              disabled: loading || !verificationCode,
              style: { 
                flex: 1, 
                padding: '12px', 
                background: (loading || !verificationCode) ? '#ccc' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: (loading || !verificationCode) ? 'not-allowed' : 'pointer', 
                fontWeight: '600'
              }
            }, loading ? 'Vérification...' : '✅ Vérifier'),
            
            normalStep && React.createElement('button', { 
              type: 'submit',
              disabled: loading,
              style: { 
                flex: 1, 
                padding: '12px', 
                background: loading ? '#ccc' : 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                fontWeight: '600'
              }
            }, loading ? 'Création...' : 'Créer mon compte →')
          )
        ),
        
        React.createElement('div', { style: { textAlign: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e0e0e0' } },
          React.createElement('p', { style: { fontSize: '13px', color: '#666' } }, 'Déjà un compte ? '),
          React.createElement('a', { 
            href: '#', 
            onClick: function(e) { e.preventDefault(); onGoToLogin(); },
            style: { color: '#9b59b6', textDecoration: 'none', fontWeight: 'bold' }
          }, 'Se connecter')
        )
      )
    )
  );
};

export default Inscription;