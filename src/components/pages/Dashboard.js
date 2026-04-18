import React from 'react';
import ProfileHeader from '../dashboard/ProfileHeader';
import AcademicActivity from '../dashboard/AcademicActivity';
import Objectives from '../dashboard/Objectives';
import PopularTags from '../dashboard/PopularTags';
import Interests from '../dashboard/Interests';
import '../../styles/dashboard.css';

var Dashboard = function({ 
  profile, 
  academicData, 
  objectives, 
  popularTags, 
  interests,
  onUpdateProfile,
  onUpdateObjective,
  onAddInterest,
  onRemoveInterest
}) {
  return React.createElement('div', { className: 'dashboard-content' },
    React.createElement(ProfileHeader, { profile: profile, onUpdate: onUpdateProfile }),
    React.createElement(AcademicActivity, { data: academicData }),
    React.createElement('div', { className: 'grid-2cols' },
      React.createElement(Objectives, { objectives: objectives, onUpdateObjective: onUpdateObjective }),
      React.createElement(PopularTags, { tags: popularTags })
    ),
    React.createElement('div', { className: 'grid-2cols' },
      React.createElement(Interests, { 
        interests: interests,
        onAddInterest: onAddInterest,
        onRemoveInterest: onRemoveInterest
      })
    )
  );
};

export default Dashboard;