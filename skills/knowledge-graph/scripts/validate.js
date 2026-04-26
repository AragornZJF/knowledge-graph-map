'use strict';

function detectCircular(links) {
  const adj = {};
  for (const l of links) {
    if (!adj[l.source]) adj[l.source] = [];
    adj[l.source].push(l.target);
  }

  function dfs(node, visited, path) {
    if (path.has(node)) return true;
    if (visited.has(node)) return false;
    visited.add(node);
    path.add(node);
    const neighbors = adj[node] || [];
    for (const next of neighbors) {
      if (dfs(next, visited, path)) return true;
    }
    path.delete(node);
    return false;
  }

  const visited = new Set();
  for (const l of links) {
    if (dfs(l.source, visited, new Set())) return true;
  }
  return false;
}

function validateData(data) {
  const errors = [];

  if (!data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
    errors.push('nodes 数组不能为空，至少需要 1 个节点');
    return { valid: false, errors };
  }

  if (data.nodes.length > 500) {
    errors.push(`节点数量 ${data.nodes.length} 超过上限 500`);
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

  if (detectCircular(links)) {
    errors.push('检测到环形引用');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateData };
