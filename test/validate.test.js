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

  it('rejects more than 500 nodes', () => {
    const nodes = Array.from({ length: 501 }, (_, i) => ({
      id: String(i), name: `N${i}`, category: 'cat1', weight: 50
    }));
    const data = { ...validData, nodes };
    const result = validateData(data);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('500')));
  });

  it('detects circular references', () => {
    const nodes = [
      { id: '1', name: 'A', category: 'c', weight: 50 },
      { id: '2', name: 'B', category: 'c', weight: 50 },
      { id: '3', name: 'C', category: 'c', weight: 50 }
    ];
    const links = [
      { source: '1', target: '2', relation: 'r' },
      { source: '2', target: '3', relation: 'r' },
      { source: '3', target: '1', relation: 'r' }
    ];
    const data = { meta: {}, nodes, links, categories: ['c'] };
    const result = validateData(data);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('环形') || e.includes('circular')));
  });

  it('allows long chains without circular refs', () => {
    const nodes = Array.from({ length: 20 }, (_, i) => ({
      id: String(i + 1), name: `N${i + 1}`, category: 'c', weight: 50
    }));
    const links = nodes.slice(0, -1).map((_, i) => ({
      source: String(i + 1), target: String(i + 2), relation: 'r'
    }));
    const data = { meta: {}, nodes, links, categories: ['c'] };
    const result = validateData(data);
    assert.equal(result.valid, true);
  });
});
