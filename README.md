# 心御AI小说辅助器 (MindForge Novel Studio)

> AI 驱动的网文创作辅助桌面应用，以"智能交流中枢"为核心交互范式，覆盖创作全流程。

## 技术栈

- **前端**: React 18 + TypeScript + Tailwind CSS
- **桌面**: Electron
- **移动端（规划中）**: Capacitor (Android + HarmonyOS)
- **AI 编排**: 自研模型路由层，支持多模型接入
- **构建**: Vite + pnpm workspace (monorepo)

## 项目结构

```
├── apps/desktop/          # Electron 桌面应用
├── packages/
│   ├── core/              # 核心业务逻辑
│   ├── shared/            # 共享类型定义
│   └── ui/                # 共享 UI 组件
├── docs/                  # 项目文档
└── scripts/               # 构建/工具脚本
```

## 开发

```bash
pnpm install
pnpm dev          # 启动开发服务器
pnpm electron:dev # 启动 Electron
```

## 协议

MIT
