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
