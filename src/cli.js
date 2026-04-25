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
