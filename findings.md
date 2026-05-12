# 企业级审查发现

> 日期: 2026-05-12 | 技能: UI/UX Pro Max + superpowers + Planning with Files

## Critical (3)

1. **API Key明文存localStorage** — model-config.ts:44, 任何进程可读
2. **SQL注入风险** — database.ts:52, table参数未校验
3. **双重LLM调用浪费** — extraction-service.ts:13-61, 每次提取多花一次API费用

## High (9)

4. 全局颜色对比度不足 (text-white/30 ~2.3:1)
5. 图标按钮缺少aria-label
6. 桌面端触摸目标36px<44px
7. 无结构化日志系统
8. 角色Store与DB不同步
9. DB路径暴露给渲染进程
10. DB错误信息返回渲染进程
11. 渲染进程sandbox禁用
12. prefers-reduced-motion缺失

## Medium (8)
13-20. focus-visible缺失/z-index无体系/聊天输入无label/静默catch块/未使用import/API Key可能在错误中泄露/聊天未加密/无CSP

## Low (4)
21-24. emoji残留/EmptyState重新导出/版本号泄露/进度条动画超时
