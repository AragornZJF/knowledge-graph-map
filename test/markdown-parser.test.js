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
