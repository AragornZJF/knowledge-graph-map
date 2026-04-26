'use strict';

const layouts = {
  force: {
    name: '力导向',
    icon: 'fa-project-diagram',
    echarts: {
      layout: 'force',
      force: {
        repulsion: 300,
        gravity: 0.1,
        edgeLength: [80, 200],
        friction: 0.6
      },
      roam: true,
      draggable: true
    }
  },
  radial: {
    name: '辐射状',
    icon: 'fa-bullseye',
    echarts: {
      layout: 'circular',
      circular: {
        rotateLabel: true
      },
      roam: true,
      draggable: true
    }
  }
};

function getLayout(name) {
  return layouts[name] || layouts.force;
}

function getLayoutNames() {
  return Object.keys(layouts);
}

module.exports = { layouts, getLayout, getLayoutNames };