import React from 'react';
import '../../styles/common.css';

const BarChart = ({ data }) => {
  // Vérifier si les données existent
  if (!data || data.length === 0) {
    return React.createElement('div', { className: 'bar-chart-container' },
      React.createElement('p', null, 'Aucune donnée disponible')
    );
  }

  // Trouver la valeur maximale pour l'échelle
  const maxValue = Math.max(
    ...data.flatMap(item => [item.consultations || 0, item.telechargements || 0])
  );

  const getBarHeight = (value) => {
    if (maxValue === 0) return 0;
    return (value / maxValue) * 100;
  };

  return React.createElement('div', { className: 'bar-chart-container' },
    React.createElement('div', { className: 'bar-chart' },
      data.map((item, index) => 
        React.createElement('div', { key: index, className: 'bar-group' },
          React.createElement('div', { className: 'bars' },
            React.createElement('div', {
              className: 'bar bar-consultations',
              style: { height: `${getBarHeight(item.consultations)}%` }
            },
              React.createElement('span', { className: 'bar-value' }, item.consultations || 0)
            ),
            React.createElement('div', {
              className: 'bar bar-telechargements',
              style: { height: `${getBarHeight(item.telechargements)}%` }
            },
              React.createElement('span', { className: 'bar-value' }, item.telechargements || 0)
            )
          ),
          React.createElement('div', { className: 'bar-label' }, item.label)
        )
      )
    ),
    React.createElement('div', { className: 'legend' },
      React.createElement('div', { className: 'legend-item' },
        React.createElement('div', { className: 'legend-color consultations-color' }),
        React.createElement('span', null, 'Consultations')
      ),
      React.createElement('div', { className: 'legend-item' },
        React.createElement('div', { className: 'legend-color telechargements-color' }),
        React.createElement('span', null, 'Téléchargements')
      )
    )
  );
};

export default BarChart;