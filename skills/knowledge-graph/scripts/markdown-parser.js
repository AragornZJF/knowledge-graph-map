'use strict';

function cleanName(text) {
  let s = text.trim();
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/`{1,3}[^`]*`{1,3}/g, '');
  s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  s = s.replace(/[*_~#|>]/g, '');
  s = s.trim();
  return s;
}

function parseMarkdown(md, title) {
  const nodes = [];
  const links = [];
  const categorySet = new Set();
  let idCounter = 0;

  const headingStack = [];
  let lastHeading = null;

  const lines = md.split('\n');
  let inCodeBlock = false;
  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Detect <font> wrapped section headings (e.g. <font style="color:rgb(255,129,36);">一、背景</font>)
    const fontHeadingMatch = line.trim().match(/^<font[^>]*>([一二三四五六七八九十]+[、．.].+?)<\/font>$/);
    if (fontHeadingMatch) {
      const name = fontHeadingMatch[1].trim();
      if (name) {
        const level = 2;
        const category = '核心';
        const weight = 90;

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
        lastHeading = { id, level };
        continue;
      }
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      const rawLevel = headingMatch[1].length;
      const name = cleanName(headingMatch[2].trim());
      if (!name) continue;

      const isRoot = headingStack.length === 0;
      const level = isRoot ? 1 : rawLevel;
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
      lastHeading = { id, level };
      continue;
    }

    const boldRegex = /\*\*(.+?)\*\*/g;
    let match;
    while ((match = boldRegex.exec(line)) !== null) {
      const rawName = match[1].trim();
      const name = cleanName(rawName);
      if (!name) continue;

      // Check if this looks like a section heading (starts with number like "1.", "2.1", etc.)
      const isSectionHeading = /^\d+[\.\s]/.test(name);

      if (isSectionHeading) {
        const level = /^\d+\.\d+\s/.test(name) ? 3 : 2;
        const category = level === 2 ? '子类' : '细节';
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
        lastHeading = { id, level };
      } else {
        const id = String(++idCounter);
        const category = '关键词';
        const weight = 30;
        nodes.push({ id, name, category, weight });
        categorySet.add(category);

        const parent = headingStack.length > 0 ? headingStack[headingStack.length - 1] : lastHeading;
        if (parent) {
          links.push({ source: parent.id, target: id, relation: '关联' });
        }
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
