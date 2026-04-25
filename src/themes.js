'use strict';

const themes = {
  'dark-tech': {
    name: '暗色科技',
    background: '#0a0e27',
    cardBg: '#111638',
    toolbarBg: '#111638',
    textPrimary: '#e0e0ff',
    textSecondary: '#8888aa',
    borderColor: '#1e2250',
    buttonBg: '#1a1f4e',
    buttonHoverBg: '#2a2f6e',
    buttonActiveBg: '#3a3f8e',
    tooltipBg: 'rgba(17,22,56,0.95)',
    colors: ['#00d4ff', '#7b2ff7', '#ff6b6b', '#ffd93d', '#00ff88', '#ff8c42', '#b388ff', '#64ffda'],
    lineColor: 'rgba(0,212,255,0.3)',
    lineHighlight: 'rgba(0,212,255,0.8)'
  },
  'nature-fresh': {
    name: '自然清新',
    background: '#f0f7ee',
    cardBg: '#ffffff',
    toolbarBg: '#ffffff',
    textPrimary: '#1b4332',
    textSecondary: '#52796f',
    borderColor: '#d8f3dc',
    buttonBg: '#d8f3dc',
    buttonHoverBg: '#b7e4c7',
    buttonActiveBg: '#95d5b2',
    tooltipBg: 'rgba(255,255,255,0.95)',
    colors: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#b7e4c7', '#1b4332', '#8d99ae'],
    lineColor: 'rgba(45,106,79,0.25)',
    lineHighlight: 'rgba(45,106,79,0.7)'
  },
  'warm-sunset': {
    name: '暖阳落日',
    background: '#fef3e2',
    cardBg: '#fff8ed',
    toolbarBg: '#fff8ed',
    textPrimary: '#3d2c1e',
    textSecondary: '#8b6914',
    borderColor: '#fde68a',
    buttonBg: '#fde68a',
    buttonHoverBg: '#fbbf24',
    buttonActiveBg: '#f59e0b',
    tooltipBg: 'rgba(255,248,237,0.95)',
    colors: ['#d62828', '#f77f00', '#fcbf49', '#bc6c25', '#e85d04', '#dc2f02', '#ffba08', '#9d0208'],
    lineColor: 'rgba(214,40,40,0.2)',
    lineHighlight: 'rgba(214,40,40,0.6)'
  },
  'ocean-deep': {
    name: '深海幽蓝',
    background: '#0b1a33',
    cardBg: '#0f2244',
    toolbarBg: '#0f2244',
    textPrimary: '#caf0f8',
    textSecondary: '#48cae4',
    borderColor: '#023e8a',
    buttonBg: '#023e8a',
    buttonHoverBg: '#0077b6',
    buttonActiveBg: '#0096c7',
    tooltipBg: 'rgba(15,34,68,0.95)',
    colors: ['#48cae4', '#0096c7', '#0077b6', '#90e0ef', '#ade8f4', '#00b4d8', '#caf0f8', '#023e8a'],
    lineColor: 'rgba(72,202,228,0.25)',
    lineHighlight: 'rgba(72,202,228,0.7)'
  }
};

function getTheme(name) {
  return themes[name] || themes['dark-tech'];
}

function getThemeNames() {
  return Object.keys(themes);
}

module.exports = { themes, getTheme, getThemeNames };