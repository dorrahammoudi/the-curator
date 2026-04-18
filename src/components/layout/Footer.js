import React from 'react';

var Footer = function() {
  var currentYear = new Date().getFullYear();
  
  return React.createElement('footer', { className: 'main-footer' },
    React.createElement('div', { className: 'footer-content' },
      React.createElement('p', null, '© ' + currentYear + ' The Curator - Academic Portal. Tous droits réservés.')
    )
  );
};

export default Footer;