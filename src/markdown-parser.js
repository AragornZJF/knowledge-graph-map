'use strict';

function parseMarkdown(md, title) {
  const nodes = [];
  const links = [];
  const categorySet = new Set();
  let idCounter = 0;

  const headingStack = [];

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
