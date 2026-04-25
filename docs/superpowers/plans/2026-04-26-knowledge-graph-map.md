# Knowledge Graph Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dual-distribution knowledge graph visualization tool — an NPX CLI tool (`knowledge-graph-map`) and a Claude Code Skill (`/knowledge-graph`).

**Architecture:** Single repo with shared render engine. `render.js` is a pure function (JSON → HTML string) used by both CLI and Skill. CLI reads files and invokes render; Skill prompt embeds the render logic as HTML templates for Claude to output directly.

**Tech Stack:** Node.js (zero deps), ECharts 5.x + echarts-wordcloud (CDN), TailwindCSS 3.0+ (CDN), Font Awesome (CDN)

---

## File Structure

```
knowledge-graph-map/
├── src/
│   ├── validate.js           # Data schema validation
│   ├── themes.js             # 4 theme color configs
│   ├── layouts.js            # Force + radial layout configs
│   ├── render.js             # JSON → HTML string (pure function)
│   ├── markdown-parser.js    # Markdown → nodes/links/categories
│   └── cli.js                # CLI entry (bin)
├── templates/
│   └── index.html            # Full HTML template with embedded JS
├── test/
│   ├── validate.test.js
│   ├── markdown-parser.test.js
│   └── render.test.js
├── skill/
│   └── knowledge-graph.md    # Claude Code Skill prompt
├── package.json
├── .gitignore
└── README.md
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "knowledge-graph-map",
  "version": "1.0.0",
  "description": "Interactive knowledge graph visualization tool — CLI and Claude Code Skill",
  "bin": {
    "knowledge-graph-map": "./src/cli.js"
  },
  "files": [
    "src/",
    "templates/"
  ],
  "scripts": {
    "test": "node --test test/*.test.js"
  },
  "keywords": [
    "knowledge-graph",
    "wordcloud",
    "visualization",
    "echarts",
    "cli"
  ],
  "author": "江枫",
  "license": "MIT"
}
```

- [ ] **Step 2: Create .gitignore**

```
node_modules/
.superpowers/
*.html
!templates/*.html
```

- [ ] **Step 3: Create directory structure**

```bash
mkdir -p src templates test skill
```

- [ ] **Step 4: Commit**

```bash
git add package.json .gitignore
git commit -m "chore: scaffold project structure"
```

---

### Task 2: Data Validation Module

**Files:**
- Create: `src/validate.js`
- Create: `test/validate.test.js`

- [ ] **Step 1: Write the failing test**

Create `test/validate.test.js`:

```js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateData } = require('../src/validate');

const validData = {
  meta: { title: 'Test' },
  nodes: [
    { id: '1', name: 'A', category: 'cat1', weight: 80 },
    { id: '2', name: 'B', category: 'cat2', weight: 50 }
  ],
  links: [
    { source: '1', target: '2', relation: 'contains' }
  ],
  categories: ['cat1', 'cat2']
};

describe('validateData', () => {
  it('accepts valid data', () => {
    const result = validateData(validData);
    assert.equal(result.valid, true);
  });

  it('rejects data with no nodes', () => {
    const result = validateData({ nodes: [], links: [], categories: [] });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('至少')));
  });

  it('rejects duplicate node IDs', () => {
    const data = {
      ...validData,
      nodes: [
        { id: '1', name: 'A', category: 'cat1', weight: 80 },
        { id: '1', name: 'B', category: 'cat2', weight: 50 }
      ]
    };
    const result = validateData(data);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('唯一')));
  });

  it('rejects invalid source in links', () => {
    const data = {
      ...validData,
      links: [{ source: '99', target: '1', relation: 'x' }]
    };
    const result = validateData(data);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('source')));
  });

  it('rejects invalid target in links', () => {
    const data = {
      ...validData,
      links: [{ source: '1', target: '99', relation: 'x' }]
    };
    const result = validateData(data);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('target')));
  });

  it('rejects weight out of range (0)', () => {
    const data = {
      ...validData,
      nodes: [
        { id: '1', name: 'A', category: 'cat1', weight: 0 },
        { id: '2', name: 'B', category: 'cat2', weight: 50 }
      ]
    };
    const result = validateData(data);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('1-100')));
  });

  it('rejects weight out of range (101)', () => {
    const data = {
      ...validData,
      nodes: [
        { id: '1', name: 'A', category: 'cat1', weight: 101 },
        { id: '2', name: 'B', category: 'cat2', weight: 50 }
      ]
    };
    const result = validateData(data);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('1-100')));
  });

  it('rejects more than 200 nodes', () => {
    const nodes = Array.from({ length: 201 }, (_, i) => ({
      id: String(i), name: `N${i}`, category: 'cat1', weight: 50
    }));
    const data = { ...validData, nodes };
    const result = validateData(data);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('200')));
  });

  it('detects circular references beyond maxDepth', () => {
    const nodes = [
      { id: '1', name: 'A', category: 'c', weight: 50 },
      { id: '2', name: 'B', category: 'c', weight: 50 },
      { id: '3', name: 'C', category: 'c', weight: 50 },
      { id: '4', name: 'D', category: 'c', weight: 50 },
      { id: '5', name: 'E', category: 'c', weight: 50 },
      { id: '6', name: 'F', category: 'c', weight: 50 }
    ];
    const links = [
      { source: '1', target: '2', relation: 'r' },
      { source: '2', target: '3', relation: 'r' },
      { source: '3', target: '4', relation: 'r' },
      { source: '4', target: '5', relation: 'r' },
      { source: '5', target: '6', relation: 'r' },
      { source: '6', target: '1', relation: 'r' }
    ];
    const data = { meta: {}, nodes, links, categories: ['c'] };
    const result = validateData(data);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('环形') || e.includes('circular')));
  });

  it('allows chains within maxDepth=5', () => {
    const nodes = Array.from({ length: 5 }, (_, i) => ({
      id: String(i + 1), name: `N${i + 1}`, category: 'c', weight: 50
    }));
    const links = [
      { source: '1', target: '2', relation: 'r' },
      { source: '2', target: '3', relation: 'r' },
      { source: '3', target: '4', relation: 'r' },
      { source: '4', target: '5', relation: 'r' }
    ];
    const data = { meta: {}, nodes, links, categories: ['c'] };
    const result = validateData(data);
    assert.equal(result.valid, true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/validate.test.js
```

Expected: FAIL — `validate.js` does not exist.

- [ ] **Step 3: Write implementation**

Create `src/validate.js`:

```js
'use strict';

function detectCircular(links, maxDepth) {
  const adj = {};
  for (const l of links) {
    if (!adj[l.source]) adj[l.source] = [];
    adj[l.source].push(l.target);
  }

  function dfs(node, visited, depth) {
    if (depth > maxDepth) return true;
    const neighbors = adj[node] || [];
    for (const next of neighbors) {
      if (visited.has(next)) return true;
      visited.add(next);
      if (dfs(next, visited, depth + 1)) return true;
      visited.delete(next);
    }
    return false;
  }

  for (const l of links) {
    const visited = new Set([l.source]);
    if (dfs(l.source, visited, 1)) return true;
  }
  return false;
}

function validateData(data) {
  const errors = [];

  if (!data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
    errors.push('nodes 数组不能为空，至少需要 1 个节点');
    return { valid: false, errors };
  }

  if (data.nodes.length > 200) {
    errors.push(`节点数量 ${data.nodes.length} 超过上限 200`);
  }

  const ids = new Set();
  for (const node of data.nodes) {
    if (ids.has(node.id)) {
      errors.push(`节点 ID "${node.id}" 重复，每个 ID 必须唯一`);
    }
    ids.add(node.id);
    if (typeof node.weight !== 'number' || node.weight < 1 || node.weight > 100) {
      errors.push(`节点 "${node.name || node.id}" 的 weight 值必须在 1-100 范围内，当前: ${node.weight}`);
    }
  }

  const links = data.links || [];
  for (const link of links) {
    if (!ids.has(String(link.source))) {
      errors.push(`link 的 source "${link.source}" 不存在于节点 ID 中`);
    }
    if (!ids.has(String(link.target))) {
      errors.push(`link 的 target "${link.target}" 不存在于节点 ID 中`);
    }
  }

  if (detectCircular(links, 5)) {
    errors.push('检测到环形引用（深度超过 maxDepth=5）');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateData };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test test/validate.test.js
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/validate.js test/validate.test.js
git commit -m "feat: add data validation with node ID uniqueness, weight range, circular reference checks"
```

---

### Task 3: Themes Configuration

**Files:**
- Create: `src/themes.js`

- [ ] **Step 1: Write themes module**

Create `src/themes.js`:

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add src/themes.js
git commit -m "feat: add 4 theme configs (dark-tech, nature-fresh, warm-sunset, ocean-deep)"
```

---

### Task 4: Layouts Configuration

**Files:**
- Create: `src/layouts.js`

- [ ] **Step 1: Write layouts module**

Create `src/layouts.js`:

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts.js
git commit -m "feat: add force-directed and radial layout configs for ECharts graph"
```

---

### Task 5: HTML Template

**Files:**
- Create: `templates/index.html`

This is the largest file — a self-contained HTML page with embedded ECharts config, theme/layout switching, toolbar, and interactions.

- [ ] **Step 1: Write the complete HTML template**

Create `templates/index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}} - 知识图谱</title>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3/dist/tailwind.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6/css/all.min.css" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; transition: background 0.5s ease; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn 0.6s ease-out; }

    .toolbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; border-bottom: 1px solid var(--border); transition: background 0.4s ease; }
    .toolbar h1 { font-size: 18px; font-weight: 700; }
    .toolbar-controls { display: flex; gap: 8px; align-items: center; }

    .btn { padding: 6px 14px; border-radius: 6px; border: 1px solid var(--border); cursor: pointer; font-size: 13px; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 6px; }
    .btn:hover { transform: scale(1.05); }
    .btn.active { font-weight: 600; }

    .chart-container { width: 100%; height: calc(100vh - 100px); }

    .footer-tips { padding: 8px 24px; border-top: 1px solid var(--border); font-size: 12px; text-align: center; transition: background 0.4s ease; }

    select.ctrl-select { padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); font-size: 13px; cursor: pointer; transition: all 0.2s ease; }
    select.ctrl-select:hover { transform: scale(1.03); }
  </style>
</head>
<body>
  <div class="toolbar fade-in" id="toolbar">
    <h1 id="pageTitle"><i class="fas fa-project-diagram" style="margin-right:8px;"></i>{{TITLE}}</h1>
    <div class="toolbar-controls">
      <button class="btn" id="btnForce" onclick="switchLayout('force')"><i class="fas fa-project-diagram"></i> 力导向</button>
      <button class="btn" id="btnRadial" onclick="switchLayout('radial')"><i class="fas fa-bullseye"></i> 辐射状</button>
      <select class="ctrl-select" id="themeSelect" onchange="switchTheme(this.value)">
        <option value="dark-tech">暗色科技</option>
        <option value="nature-fresh">自然清新</option>
        <option value="warm-sunset">暖阳落日</option>
        <option value="ocean-deep">深海幽蓝</option>
      </select>
    </div>
  </div>

  <div class="chart-container fade-in" id="chart"></div>

  <div class="footer-tips fade-in" id="footer">
    <i class="fas fa-info-circle"></i> 操作提示：悬停查看详情 &nbsp;|&nbsp; 点击高亮关联节点 &nbsp;|&nbsp; 拖拽调整布局 &nbsp;|&nbsp; 滚轮缩放
  </div>

  <script>
    /*__THEMES__*/
    /*__LAYOUTS__*/
    /*__DATA__*/

    let currentTheme = '__INITIAL_THEME__';
    let currentLayout = '__INITIAL_LAYOUT__';
    let chart = null;

    function applyCSS(theme) {
      const t = themes[theme];
      document.body.style.background = t.background;
      document.body.style.color = t.textPrimary;
      const toolbar = document.getElementById('toolbar');
      toolbar.style.background = t.toolbarBg;
      toolbar.style.borderColor = t.borderColor;
      const footer = document.getElementById('footer');
      footer.style.background = t.toolbarBg;
      footer.style.borderColor = t.borderColor;
      footer.style.color = t.textSecondary;
      document.querySelectorAll('.btn').forEach(btn => {
        btn.style.background = t.buttonBg;
        btn.style.color = t.textPrimary;
        btn.style.borderColor = t.borderColor;
      });
      document.querySelectorAll('.btn.active').forEach(btn => {
        btn.style.background = t.buttonActiveBg;
      });
      document.querySelectorAll('.ctrl-select').forEach(sel => {
        sel.style.background = t.buttonBg;
        sel.style.color = t.textPrimary;
        sel.style.borderColor = t.borderColor;
      });
    }

    function buildOption(layoutName) {
      const t = themes[currentTheme];
      const layoutCfg = layouts[layoutName].echarts;

      const categoryMap = {};
      graphData.categories.forEach((cat, i) => {
        categoryMap[cat] = i;
      });

      const seriesData = graphData.nodes.map(n => ({
        id: n.id,
        name: n.name,
        value: n.weight,
        category: categoryMap[n.category] !== undefined ? categoryMap[n.category] : 0,
        symbolSize: Math.max(20, n.weight * 0.6 + 15),
        label: {
          show: true,
          fontSize: Math.max(10, n.weight * 0.12 + 8),
          color: t.textPrimary
        },
        itemStyle: {
          color: t.colors[categoryMap[n.category] % t.colors.length],
          borderColor: t.borderColor,
          borderWidth: 2
        }
      }));

      const seriesLinks = graphData.links.map(l => ({
        source: String(l.source),
        target: String(l.target),
        lineStyle: {
          color: t.lineColor,
          width: 1.5,
          curveness: 0.1
        }
      }));

      return {
        tooltip: {
          trigger: 'item',
          backgroundColor: t.tooltipBg,
          borderColor: t.borderColor,
          textStyle: { color: t.textPrimary, fontSize: 13 },
          formatter: function(params) {
            if (params.dataType === 'node') {
              const d = params.data;
              const cat = graphData.categories[d.category] || '';
              const linkCount = graphData.links.filter(l => String(l.source) === d.id || String(l.target) === d.id).length;
              return '<b>' + d.name + '</b><br/>分类: ' + cat + '<br/>权重: ' + d.value + '<br/>关联数: ' + linkCount;
            }
            if (params.dataType === 'edge') {
              const rel = graphData.links.find(l => String(l.source) === params.data.source && String(l.target) === params.data.target);
              return (rel ? rel.relation : '');
            }
            return '';
          }
        },
        legend: {
          data: graphData.categories.map((cat, i) => ({ name: cat, itemStyle: { color: t.colors[i % t.colors.length] } })),
          textStyle: { color: t.textSecondary, fontSize: 12 },
          bottom: 50,
          left: 'center',
          selectedMode: true
        },
        animationDuration: 800,
        animationEasingUpdate: 'quinticInOut',
        series: [{
          type: 'graph',
          ...layoutCfg,
          data: seriesData,
          links: seriesLinks,
          categories: graphData.categories.map((cat, i) => ({ name: cat })),
          emphasis: {
            focus: 'adjacency',
            lineStyle: { width: 3, color: t.lineHighlight },
            itemStyle: { borderWidth: 4, shadowBlur: 20 }
          },
          label: { show: true, position: 'right' },
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: [4, 10],
          lineStyle: { opacity: 0.6, curveness: 0.1 }
        }]
      };
    }

    function initChart() {
      chart = echarts.init(document.getElementById('chart'));
      updateChart();
      window.addEventListener('resize', () => chart.resize());
    }

    function updateChart() {
      const option = buildOption(currentLayout);
      chart.setOption(option, true);
    }

    function switchLayout(name) {
      currentLayout = name;
      document.getElementById('btnForce').classList.toggle('active', name === 'force');
      document.getElementById('btnRadial').classList.toggle('active', name === 'radial');
      updateChart();
    }

    function switchTheme(name) {
      currentTheme = name;
      applyCSS(name);
      updateChart();
    }

    // Init
    document.addEventListener('DOMContentLoaded', function() {
      applyCSS(currentTheme);
      document.getElementById('themeSelect').value = currentTheme;
      switchLayout(currentLayout);
      initChart();
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add templates/index.html
git commit -m "feat: add HTML template with ECharts graph, toolbar, theme/layout switching, and interactions"
```

---

### Task 6: Render Engine

**Files:**
- Create: `src/render.js`
- Create: `test/render.test.js`

- [ ] **Step 1: Write the failing test**

Create `test/render.test.js`:

```js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { render } = require('../src/render');

const sampleData = {
  meta: { title: '测试图谱', layout: 'force', theme: 'dark-tech' },
  nodes: [
    { id: '1', name: '机器学习', category: '核心', weight: 100 },
    { id: '2', name: '深度学习', category: '方法', weight: 80 }
  ],
  links: [
    { source: '1', target: '2', relation: '包含' }
  ],
  categories: ['核心', '方法']
};

describe('render', () => {
  it('returns a non-empty string', () => {
    const html = render(sampleData);
    assert.ok(typeof html === 'string' && html.length > 0);
  });

  it('contains the title', () => {
    const html = render(sampleData);
    assert.ok(html.includes('测试图谱'));
  });

  it('contains node names', () => {
    const html = render(sampleData);
    assert.ok(html.includes('机器学习'));
    assert.ok(html.includes('深度学习'));
  });

  it('contains link relation', () => {
    const html = render(sampleData);
    assert.ok(html.includes('包含'));
  });

  it('contains ECharts CDN', () => {
    const html = render(sampleData);
    assert.ok(html.includes('echarts'));
  });

  it('uses the specified theme', () => {
    const html = render(sampleData);
    assert.ok(html.includes("dark-tech"));
  });

  it('uses the specified layout', () => {
    const html = render(sampleData);
    assert.ok(html.includes('force'));
  });

  it('uses custom theme when specified', () => {
    const data = { ...sampleData, meta: { ...sampleData.meta, theme: 'ocean-deep' } };
    const html = render(data);
    assert.ok(html.includes('ocean-deep'));
  });

  it('uses custom layout when specified', () => {
    const data = { ...sampleData, meta: { ...sampleData.meta, layout: 'radial' } };
    const html = render(data);
    assert.ok(html.includes('radial'));
  });

  it('validates data and throws on invalid input', () => {
    const badData = { nodes: [], links: [], categories: [] };
    assert.throws(() => render(badData), /验证失败/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/render.test.js
```

Expected: FAIL — `render.js` does not exist.

- [ ] **Step 3: Write implementation**

Create `src/render.js`:

```js
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

  html = html.replace('{{TITLE}}', title);
  html = html.replace('/*__THEMES__*/', 'const themes = ' + themesJSON + ';');
  html = html.replace('/*__LAYOUTS__*/', 'const layouts = ' + layoutsJSON + ';');
  html = html.replace('/*__DATA__*/', 'const graphData = ' + dataJSON + ';');
  html = html.replace("'__INITIAL_THEME__'", "'" + themeName + "'");
  html = html.replace("'__INITIAL_LAYOUT__'", "'" + layoutName + "'");

  return html;
}

module.exports = { render };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test test/render.test.js
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/render.js test/render.test.js
git commit -m "feat: add render engine that injects validated data into HTML template"
```

---

### Task 7: Markdown Parser

**Files:**
- Create: `src/markdown-parser.js`
- Create: `test/markdown-parser.test.js`

- [ ] **Step 1: Write the failing test**

Create `test/markdown-parser.test.js`:

```js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseMarkdown } = require('../src/markdown-parser');

describe('parseMarkdown', () => {
  it('extracts h1 as core node with highest weight', () => {
    const md = '# 机器学习\n\n## 深度学习\n\n### CNN';
    const result = parseMarkdown(md, '机器学习');
    const h1 = result.nodes.find(n => n.name === '机器学习');
    assert.ok(h1);
    assert.ok(h1.weight >= 90);
  });

  it('extracts h2 as sub-category nodes', () => {
    const md = '# 机器学习\n\n## 深度学习\n\n## 监督学习';
    const result = parseMarkdown(md, '机器学习');
    const dl = result.nodes.find(n => n.name === '深度学习');
    const sl = result.nodes.find(n => n.name === '监督学习');
    assert.ok(dl);
    assert.ok(sl);
    assert.ok(dl.weight > 0);
    assert.ok(dl.weight < (result.nodes.find(n => n.name === '机器学习').weight));
  });

  it('extracts bold text as nodes', () => {
    const md = '# 机器学习\n\n**反向传播**是一种重要算法。\n\n**梯度下降**优化参数。';
    const result = parseMarkdown(md, '机器学习');
    assert.ok(result.nodes.find(n => n.name === '反向传播'));
    assert.ok(result.nodes.find(n => n.name === '梯度下降'));
  });

  it('creates links between parent and child headings', () => {
    const md = '# 机器学习\n\n## 深度学习';
    const result = parseMarkdown(md, '机器学习');
    const ml = result.nodes.find(n => n.name === '机器学习');
    const dl = result.nodes.find(n => n.name === '深度学习');
    const link = result.links.find(l => l.source === ml.id && l.target === dl.id);
    assert.ok(link);
  });

  it('generates categories from heading levels', () => {
    const md = '# 机器学习\n\n## 深度学习\n\n## 监督学习';
    const result = parseMarkdown(md, '机器学习');
    assert.ok(result.categories.length > 0);
  });

  it('sets meta with provided title', () => {
    const md = '# 机器学习';
    const result = parseMarkdown(md, 'AI知识图谱');
    assert.equal(result.meta.title, 'AI知识图谱');
  });

  it('defaults to h1 text when no title provided', () => {
    const md = '# 机器学习';
    const result = parseMarkdown(md);
    assert.equal(result.meta.title, '机器学习');
  });

  it('handles empty markdown gracefully', () => {
    const result = parseMarkdown('');
    assert.ok(result.nodes.length === 0);
    assert.ok(result.links.length === 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/markdown-parser.test.js
```

Expected: FAIL — `markdown-parser.js` does not exist.

- [ ] **Step 3: Write implementation**

Create `src/markdown-parser.js`:

```js
'use strict';

function parseMarkdown(md, title) {
  const nodes = [];
  const links = [];
  const categorySet = new Set();
  let idCounter = 0;

  const headingStack = []; // { id, level }

  const lines = md.split('\n');
  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const name = headingMatch[2].trim();
      const category = level === 1 ? '核心' : level === 2 ? '子类' : '细节';
      const weight = Math.max(10, Math.round(110 - level * 20));

      const id = String(++idCounter);
      nodes.push({ id, name, category, weight });
      categorySet.add(category);

      // Pop stack to find parent (lower heading level)
      while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
        headingStack.pop();
      }
      if (headingStack.length > 0) {
        const parent = headingStack[headingStack.length - 1];
        links.push({ source: parent.id, target: id, relation: '包含' });
      }

      headingStack.push({ id, level });
      continue;
    }

    // Extract bold text as nodes under current heading
    const boldRegex = /\*\*(.+?)\*\*/g;
    let match;
    while ((match = boldRegex.exec(line)) !== null) {
      const name = match[1].trim();
      const id = String(++idCounter);
      const category = '关键词';
      const weight = 30;
      nodes.push({ id, name, category, weight });
      categorySet.add(category);

      if (headingStack.length > 0) {
        const parent = headingStack[headingStack.length - 1];
        links.push({ source: parent.id, target: id, relation: '关联' });
      }
    }
  }

  return {
    meta: {
      title: title || (nodes.length > 0 ? nodes[0].name : '知识图谱'),
      layout: 'force',
      theme: 'dark-tech'
    },
    nodes,
    links,
    categories: Array.from(categorySet)
  };
}

module.exports = { parseMarkdown };
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test test/markdown-parser.test.js
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/markdown-parser.js test/markdown-parser.test.js
git commit -m "feat: add markdown parser that extracts headings and bold text to graph nodes/links"
```

---

### Task 8: CLI Tool

**Files:**
- Create: `src/cli.js`

- [ ] **Step 1: Write the CLI entry point**

Create `src/cli.js`:

```js
#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { render } = require('./render');
const { parseMarkdown } = require('./markdown-parser');
const { validateData } = require('./validate');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-f' || arg === '--file') { args.file = argv[++i]; }
    else if (arg === '--title') { args.title = argv[++i]; }
    else if (arg === '-l' || arg === '--layout') { args.layout = argv[++i]; }
    else if (arg === '--theme') { args.theme = argv[++i]; }
    else if (arg === '-o' || arg === '--output') { args.output = argv[++i]; }
    else if (arg === '--no-open') { args.noOpen = true; }
    else if (arg === '-h' || arg === '--help') { args.help = true; }
    else { args._.push(arg); }
  }
  return args;
}

function printHelp() {
  console.log(`
knowledge-graph-map - 交互式知识图谱可视化工具

Usage:
  npx knowledge-graph-map -f <file> [options]

Options:
  -f, --file <path>       输入 JSON 或 Markdown 文件路径
  --title <string>        图谱标题（默认取文件名）
  -l, --layout <type>     布局: force | radial (默认: force)
  --theme <name>          主题: dark-tech | nature-fresh | warm-sunset | ocean-deep (默认: dark-tech)
  -o, --output <path>     输出 HTML 文件路径 (默认: ./knowledge-graph.html)
  --no-open               不自动打开浏览器
  -h, --help              显示帮助

Examples:
  npx knowledge-graph-map -f data.json
  npx knowledge-graph-map -f notes.md --layout radial --theme ocean-deep
  npx knowledge-graph-map -f data.json -o output.html --no-open
`);
}

function openFile(filePath) {
  const cmd = process.platform === 'win32' ? 'start'
    : process.platform === 'darwin' ? 'open'
    : 'xdg-open';
  exec(`${cmd} "${filePath}"`, (err) => {
    if (err) console.error('无法自动打开浏览器，请手动打开: ' + filePath);
  });
}

function main() {
  const args = parseArgs(process.argv);

  if (args.help) { printHelp(); process.exit(0); }
  if (!args.file) { console.error('错误: 请使用 -f 指定输入文件路径'); printHelp(); process.exit(1); }

  const filePath = path.resolve(args.file);
  if (!fs.existsSync(filePath)) { console.error('错误: 文件不存在: ' + filePath); process.exit(1); }

  const ext = path.extname(filePath).toLowerCase();
  const content = fs.readFileSync(filePath, 'utf-8');

  let data;
  if (ext === '.json') {
    data = JSON.parse(content);
  } else if (ext === '.md' || ext === '.markdown') {
    const defaultTitle = path.basename(filePath, ext);
    data = parseMarkdown(content, args.title || defaultTitle);
  } else {
    console.error('错误: 不支持的文件格式: ' + ext + '，请使用 .json 或 .md 文件');
    process.exit(1);
  }

  // Apply CLI overrides
  if (args.title) data.meta.title = args.title;
  if (args.layout) data.meta.layout = args.layout;
  if (args.theme) data.meta.theme = args.theme;
  if (!data.meta.layout) data.meta.layout = 'force';
  if (!data.meta.theme) data.meta.theme = 'dark-tech';

  const validation = validateData(data);
  if (!validation.valid) {
    console.error('数据验证失败:');
    validation.errors.forEach(e => console.error('  - ' + e));
    process.exit(1);
  }

  let html;
  try {
    html = render(data);
  } catch (err) {
    console.error('渲染失败: ' + err.message);
    process.exit(1);
  }

  const outputPath = args.output ? path.resolve(args.output) : path.join(process.cwd(), 'knowledge-graph.html');
  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log('图谱已生成: ' + outputPath);

  if (!args.noOpen) {
    openFile(outputPath);
  }
}

main();
```

- [ ] **Step 2: Test CLI with a sample JSON file**

Create a test fixture `test/fixtures/sample.json`:

```json
{
  "meta": { "title": "测试图谱", "layout": "force", "theme": "dark-tech" },
  "nodes": [
    { "id": "1", "name": "机器学习", "category": "核心", "weight": 100 },
    { "id": "2", "name": "深度学习", "category": "方法", "weight": 80 },
    { "id": "3", "name": "CNN", "category": "模型", "weight": 60 }
  ],
  "links": [
    { "source": "1", "target": "2", "relation": "包含" },
    { "source": "2", "target": "3", "relation": "实例" }
  ],
  "categories": ["核心", "方法", "模型"]
}
```

Run: `node src/cli.js -f test/fixtures/sample.json --no-open`
Expected: File `knowledge-graph.html` created in current directory.

- [ ] **Step 3: Test CLI with a sample Markdown file**

Create a test fixture `test/fixtures/sample.md`:

```markdown
# 机器学习

## 深度学习

**反向传播**是一种核心算法。

### CNN

## 监督学习

**线性回归**是最基础的模型。
```

Run: `node src/cli.js -f test/fixtures/sample.md -l radial --theme ocean-deep --no-open`
Expected: File generated with radial layout and ocean-deep theme.

- [ ] **Step 4: Commit**

```bash
git add src/cli.js test/fixtures/
git commit -m "feat: add CLI entry with JSON/Markdown input, theme/layout options, and browser auto-open"
```

---

### Task 9: Claude Code Skill

**Files:**
- Create: `skill/knowledge-graph.md`

- [ ] **Step 1: Write the skill prompt**

Create `skill/knowledge-graph.md`:

```markdown
---
name: knowledge-graph
description: 生成知识图谱可视化。输入主题词或 Markdown 文档，输出交互式 HTML 图谱。支持力导向/辐射状布局和 4 套主题。
---

# 知识图谱标签关系生成专家

## 角色

你是一个知识图谱可视化专家。根据用户提供的主题词或 Markdown 文档，生成结构化的知识图谱数据，并渲染为可交互的 HTML 页面。

## 输入处理

### 主题词输入
当用户提供主题词时：
1. 围绕该主题生成 15-50 个相关概念节点
2. 按概念类型分为 3-6 个分类
3. 为每个节点计算权重（1-100，核心概念更高）
4. 建立节点间的关系链接，标注关系类型

### Markdown 文档输入
当用户提供 Markdown 文档时：
1. h1 标题 → 核心节点（权重 80-100）
2. h2 标题 → 子类节点（权重 50-79）
3. h3-h4 标题 → 细节节点（权重 20-49）
4. **加粗文本** → 关键词节点（权重 10-30）
5. 标题嵌套关系 → 节点间链接
6. 标题层级 → 分类

## 数据 Schema

生成的数据必须严格遵循以下格式：

```json
{
  "meta": {
    "title": "图谱标题",
    "layout": "force",
    "theme": "dark-tech"
  },
  "nodes": [
    { "id": "1", "name": "概念名称", "category": "分类名", "weight": 85 }
  ],
  "links": [
    { "source": "1", "target": "2", "relation": "关系类型" }
  ],
  "categories": ["分类1", "分类2"]
}
```

### 约束
- 节点数量不超过 200
- 每个 node 的 id 必须唯一
- link 的 source/target 必须引用已存在的节点 id
- weight 值域: 1-100
- 不允许深度超过 5 的环形引用
- 每个节点必须属于 categories 中的某个分类

## 输出

直接输出完整的 HTML 代码块。用户将其保存为 .html 文件即可在浏览器中打开。

## 主题选项

| 主题 | 说明 | 适用场景 |
|------|------|----------|
| dark-tech | 深蓝黑底 + 霓虹色 | 技术主题（默认） |
| nature-fresh | 浅绿白底 + 绿色渐变 | 教育/科普 |
| warm-sunset | 暖黄底 + 红橙金 | 人文社科 |
| ocean-deep | 深海蓝 + 青蓝渐变 | 学术/科研 |

## 布局选项

| 布局 | 说明 |
|------|------|
| force | 力导向布局，节点自然散开（默认） |
| radial | 辐射状布局，核心居中层层展开 |

## 渲染模板

以下是需要输出的完整 HTML 模板。将数据注入模板中的标记位置后输出：

- 将 `graphData` 替换为生成的 nodes/links/categories JSON
- 将 `__TITLE__` 替换为图谱标题
- 将 `__THEME__` 替换为选中的主题名
- 将 `__LAYOUT__` 替换为选中的布局方式

然后输出替换后的完整 HTML。

询问用户想要使用哪个主题和布局，如果用户未指定则使用默认值（dark-tech + force）。

HTML 模板文件路径: `templates/index.html`

读取该模板文件，将上述标记替换为实际值，然后直接输出完整的 HTML 代码块。
```

- [ ] **Step 2: Commit**

```bash
git add skill/knowledge-graph.md
git commit -m "feat: add Claude Code Skill prompt for knowledge graph visualization"
```

---

### Task 10: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Create `README.md`:

```markdown
# Knowledge Graph Map

交互式知识图谱可视化工具，支持 CLI 和 Claude Code Skill 双模式。

## 快速开始

### CLI 模式

```bash
# 从 JSON 文件生成
npx knowledge-graph-map -f data.json

# 从 Markdown 文件生成
npx knowledge-graph-map -f notes.md

# 指定布局和主题
npx knowledge-graph-map -f data.json --layout radial --theme ocean-deep

# 指定输出路径
npx knowledge-graph-map -f data.json -o my-graph.html
```

### Claude Code Skill

在 Claude Code 中使用 `/knowledge-graph` 命令或自然语言触发：

```
> /knowledge-graph 机器学习
> 生成一个关于人工智能的知识图谱
> 把这个 markdown 文档可视化为知识图谱
```

## 输入格式

### JSON 格式

```json
{
  "meta": { "title": "图谱标题", "layout": "force", "theme": "dark-tech" },
  "nodes": [
    { "id": "1", "name": "概念", "category": "分类", "weight": 80 }
  ],
  "links": [
    { "source": "1", "target": "2", "relation": "关系" }
  ],
  "categories": ["分类1", "分类2"]
}
```

### Markdown 格式

```markdown
# 核心概念
## 子概念
### 细节
**关键词** 会自动提取为节点
```

## 主题

| 主题 | 说明 |
|------|------|
| dark-tech | 暗色科技风（默认） |
| nature-fresh | 自然清新风 |
| warm-sunset | 暖阳落日风 |
| ocean-deep | 深海幽蓝风 |

## 布局

| 布局 | 说明 |
|------|------|
| force | 力导向布局（默认） |
| radial | 辐射状布局 |

## CLI 参数

```
-f, --file <path>       输入 JSON 或 Markdown 文件路径
--title <string>        图谱标题
-l, --layout <type>     布局: force | radial
--theme <name>          主题
-o, --output <path>     输出路径
--no-open               不自动打开浏览器
```

## License

MIT
```

- [ ] **Step 2: Run all tests**

```bash
node --test test/*.test.js
```

Expected: All tests PASS.

- [ ] **Step 3: Final commit**

```bash
git add README.md
git commit -m "docs: add README with CLI usage, input formats, and theme/layout options"
```

---

## Self-Review

**1. Spec coverage:**
- Project structure → Task 1
- Data validation → Task 2
- 4 themes → Task 3
- 2 layouts → Task 4
- HTML template with interactions → Task 5
- Render engine → Task 6
- Markdown parser → Task 7
- CLI with all params → Task 8
- Claude Code Skill → Task 9
- README → Task 10
- All sections covered.

**2. Placeholder scan:** No TBD/TODO found. All code blocks contain complete implementations.

**3. Type consistency:**
- `validateData()` returns `{ valid: boolean, errors: string[] }` — used consistently in render.js and cli.js
- `parseMarkdown()` returns `{ meta, nodes, links, categories }` — matches schema
- `render()` takes data object with same schema — consistent
- Theme/layout names: 'dark-tech', 'nature-fresh', 'warm-sunset', 'ocean-deep' and 'force', 'radial' — consistent across all files
