# 心御AI小说辅助器 — 移动端

## 技术栈
- Capacitor 6 (跨平台容器)
- React 18 (与桌面端共享代码)
- Android + HarmonyOS

## 开发
```bash
pnpm --filter @mindforge/mobile dev     # 启动Web开发服务器
pnpm --filter @mindforge/mobile build   # 构建+同步原生项目
```

## 构建移动端
1. 确保桌面端已构建: `pnpm --filter @mindforge/desktop build`
2. 构建并同步: `pnpm --filter @mindforge/mobile build`
3. Android: 用 Android Studio 打开 `android/` 目录
4. HarmonyOS: 用 DevEco Studio 打开 `harmonyos/` 目录

## 与桌面端共享
- UI组件: packages/ui
- 业务逻辑: packages/core
- 类型定义: packages/shared
- 平台适配: 通过 Capacitor Plugins 或 Web API
