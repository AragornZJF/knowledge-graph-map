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
