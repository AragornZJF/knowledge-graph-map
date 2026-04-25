'use strict';

const fs = require('fs');
const path = require('path');
const { validateData } = require('./validate');
const { themes, getTheme, getThemeNames } = require('./themes');
const { layouts, getLayout, getLayoutNames } = require('./layouts');

const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'index.html');

function render(data) {
  const validation = validateData(data);
  if (!validation.valid) {
    throw new Error('数据验证失败:\n' + validation.errors.join('\n'));
  }

  const meta = data.meta || {};
  const title = meta.title || '知识图谱';
  const themeName = meta.theme || 'dark-tech';
  const layoutName = meta.layout || 'force';

  let html = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  const themesJSON = JSON.stringify(themes);
  const layoutsJSON = JSON.stringify(layouts);
  const dataJSON = JSON.stringify({
    nodes: data.nodes,
    links: data.links,
    categories: data.categories
  });

  html = html.replaceAll('{{TITLE}}', title);
  html = html.replace('/*__THEMES__*/', 'const themes = ' + themesJSON + ';');
  html = html.replace('/*__LAYOUTS__*/', 'const layouts = ' + layoutsJSON + ';');
  html = html.replace('/*__DATA__*/', 'const graphData = ' + dataJSON + ';');
  html = html.replace("'__INITIAL_THEME__'", "'" + themeName + "'");
  html = html.replace("'__INITIAL_LAYOUT__'", "'" + layoutName + "'");

  return html;
}

module.exports = { render };
