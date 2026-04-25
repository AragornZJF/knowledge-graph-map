# Knowledge Graph Map - 设计文档

**日期**: 2026-04-26
**版本**: 1.0
**状态**: 已确认

## 概述

将知识图谱词云工具发布为双重形态：
1. **Claude Code Skill** — 用户通过 `/knowledge-graph` 或自然语言触发，Claude 生成数据 + 渲染 HTML
2. **NPX/CLI 工具** — 发布到 npm + GitHub，用户通过 `npx knowledge-graph-map` 纯渲染可视化

## 项目结构

```
knowledge-graph-map/
├── src/
│   ├── render.js            # 核心渲染引擎：JSON → HTML 字符串
│   ├── themes.js            # 4 套主题配置
│   ├── layouts.js           # 力导向 / 辐射状布局配置
│   ├── markdown-parser.js   # Markdown → nodes/links/categories
│   └── cli.js               # CLI 入口
├── skill/
│   └── knowledge-graph.md   # Claude Code Skill prompt 定义
├── templates/
│   └── index.html           # HTML 模板骨架（ECharts + wordcloud CDN）
├── package.json             # name: knowledge-graph-map, bin: cli.js
├── README.md
└── .gitignore
```

## 双入口调用流

```
CLI:    cli.js → parse args(-f/-t/-l/--theme/-o) → read file → parse data → render.js → HTML file → open browser
Skill:  knowledge-graph.md → Claude 生成 JSON → 内嵌渲染模板 → 输出 HTML 代码块
```

## 数据 Schema

CLI 和 Skill 统一使用以下 JSON 格式：

```json
{
  "meta": {
    "title": "机器学习知识图谱",
    "layout": "force",
    "theme": "dark-tech"
  },
  "nodes": [
    { "id": "1", "name": "机器学习", "category": "核心", "weight": 100 },
    { "id": "2", "name": "深度学习", "category": "方法", "weight": 80 }
  ],
  "links": [
    { "source": "1", "target": "2", "relation": "包含" }
  ],
  "categories": ["核心", "方法"]
}
```

### 校验规则

- 节点 ID 唯一性检查
- source/target 必须引用已存在的节点 ID
- weight 值域 1-100
- 环形引用检测 maxDepth=5
- 单次最多 200 个节点

## 渲染引擎 (render.js)

纯函数：输入 JSON 配置 → 输出 HTML 字符串。

处理步骤：
1. 校验数据（schema + 业务规则）
2. 从 themes.js 取主题配色
3. 从 layouts.js 取布局配置
4. 序列化 ECharts option 注入 HTML 模板
5. 返回完整 HTML 字符串

## Markdown 解析器 (markdown-parser.js)

- 标题层级 → 节点分类（h1=核心, h2=子类, h3=细节）
- 标题/加粗文本 → 关键词节点
- 标题嵌套关系 → links
- 层级深度 → weight 计算

## CLI 工具

**包名**: `knowledge-graph-map`
**命令**: `npx knowledge-graph-map`
**依赖**: 零运行时依赖，仅使用 Node.js 内置模块

### 参数

```
-f, --file <path>       输入 JSON 或 Markdown 文件路径
-t, --title <string>    图谱标题（默认取文件名）
-l, --layout <type>     布局: force | radial（默认: force）
--theme <name>          主题: dark-tech | nature-fresh | warm-sunset | ocean-deep（默认: dark-tech）
-o, --output <path>     输出路径（默认: ./knowledge-graph.html）
--no-open               不自动打开浏览器
-h, --help              帮助
```

### 执行流程

1. 解析参数
2. 读取文件（.json 直接解析，.md 走 markdown-parser）
3. 校验数据 schema
4. render.js 生成 HTML
5. 写入文件
6. open 命令打开浏览器（除非 --no-open）

## Claude Code Skill

**文件**: `skill/knowledge-graph.md`
**触发**: `/knowledge-graph` 斜杠命令 + 自然语言（"生成词云"、"知识图谱"、"可视化图谱"）

### Prompt 结构

1. **角色定义** — 知识图谱可视化专家
2. **数据生成规则** — schema 定义、权重计算、校验规则
3. **渲染模板** — 内嵌 HTML 模板 + ECharts 配置 + 主题配置（不依赖本地文件）
4. **输出格式** — 完整 HTML 代码块

### 设计要点

- Skill prompt 内嵌渲染模板，安装即用，无需本地文件依赖
- 主题/布局由用户对话中指定，Claude 动态选择配置
- 与 CLI 渲染效果一致（同一套 ECharts 配置逻辑）

## 主题系统

内置 4 套主题：

| 主题 | 背景 | 配色 | 适用场景 |
|------|------|------|----------|
| dark-tech | 深蓝黑 | 霓虹青/紫/红/金 | 技术主题 |
| nature-fresh | 浅绿白 | 绿色渐变 | 教育/科普 |
| warm-sunset | 暖黄 | 红/橙/金渐变 | 人文社科 |
| ocean-deep | 深海蓝 | 青蓝渐变 | 学术/科研 |

## 布局系统

### 力导向 (force)

- 节点自然散开，类似星系
- 强调关系网络拓扑结构
- 支持拖拽节点重新排列

### 辐射状 (radial)

- 核心概念居中，关联概念层层展开
- 强调层级和主次关系
- 适合教学演示

## 页面交互功能

### 节点交互

- **悬停**: 高亮节点 + tooltip（名称、分类、权重、关联数）
- **点击**: 高亮直接关联节点，其余变暗
- **拖拽**: 力导向布局下可拖动节点

### 工具栏

```
┌──────────────────────────────────────────────┐
│  图谱标题          [力导向|辐射状]  [主题切换]  │
├──────────────────────────────────────────────┤
│              ECharts 图表区域                 │
├──────────────────────────────────────────────┤
│  操作提示：悬停查看详情 | 点击高亮关联 | 拖拽调整  │
└──────────────────────────────────────────────┘
```

### 图例面板

右侧/底部显示分类图例，点击分类可筛选高亮该类节点。

### 微交互

- 按钮悬停放大 + 颜色变化
- 页面加载淡入动画
- 布局/主题切换平滑过渡

## 技术栈

- **ECharts 5.x** + **echarts-wordcloud** (CDN)
- **TailwindCSS 3.0+** (CDN) — 美化工具栏等非 ECharts 元素
- **Font Awesome** (CDN) — 图标
- Node.js 内置模块 — CLI（零外部依赖）

## 发布

- **npm**: `npm publish` → 用户 `npx knowledge-graph-map`
- **GitHub**: 开源仓库，支持 `npx github:user/repo`
- **Claude Code Skill**: 通过 skill 目录定义，可发布到 skill 仓库或用户手动安装
