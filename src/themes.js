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
    lineColor: 'rgba(100,180,255,0.35)',
    lineHighlight: 'rgba(0,212,255,0.85)'
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
    colors: ['#2d6a4f', '#e07a5f', '#3d405b', '#81b29a', '#f2cc8f', '#264653', '#e76f51', '#6d6875'],
    lineColor: 'rgba(45,106,79,0.3)',
    lineHighlight: 'rgba(45,106,79,0.75)'
  },
  'warm-sunset': {
    name: '暖阳落日',
    background: '#1a1420',
    cardBg: '#2a1f30',
    toolbarBg: '#2a1f30',
    textPrimary: '#fde8d0',
    textSecondary: '#c9a87c',
    borderColor: '#3d2a4a',
    buttonBg: '#3d2a4a',
    buttonHoverBg: '#5a3d6a',
    buttonActiveBg: '#f59e0b',
    tooltipBg: 'rgba(42,31,48,0.95)',
    colors: ['#fbbf24', '#f97316', '#ef4444', '#a855f7', '#ec4899', '#fcd34d', '#fb923c', '#8b5cf6'],
    lineColor: 'rgba(251,191,36,0.25)',
    lineHighlight: 'rgba(251,191,36,0.7)'
  },
  'ocean-deep': {
    name: '深海幽蓝',
    background: '#0b1a33',
    cardBg: '#0f2244',
    toolbarBg: '#0f2244',
    textPrimary: '#caf0f8',
    textSecondary: '#90e0ef',
    borderColor: '#023e8a',
    buttonBg: '#023e8a',
    buttonHoverBg: '#0077b6',
    buttonActiveBg: '#0096c7',
    tooltipBg: 'rgba(15,34,68,0.95)',
    colors: ['#48cae4', '#ff6b6b', '#ffd93d', '#00ff88', '#b388ff', '#f77f00', '#e0aaff', '#00d4ff'],
    lineColor: 'rgba(72,202,228,0.3)',
    lineHighlight: 'rgba(72,202,228,0.75)'
  }
};

function getTheme(name) {
  return themes[name] || themes['dark-tech'];
}

function getThemeNames() {
  return Object.keys(themes);
}

module.exports = { themes, getTheme, getThemeNames };