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
