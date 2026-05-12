import { test, expect } from '@playwright/test'

test.describe('核心流程', () => {
  test('首页加载并显示创建按钮', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=心御')).toBeVisible()
    await expect(page.locator('text=创建作品')).toBeVisible()
  })

  test('创建设置页面可访问', async ({ page }) => {
    await page.goto('/#/settings')
    await expect(page.locator('text=模型配置')).toBeVisible()
    await expect(page.locator('text=添加模型')).toBeVisible()
  })

  test('仪表盘页面可访问', async ({ page }) => {
    await page.goto('/#/dashboard')
    await expect(page.locator('text=个人仪表盘')).toBeVisible()
  })
})

test.describe('工作台', () => {
  test('创建作品流程', async ({ page }) => {
    await page.goto('/')
    await page.click('text=创建作品')
    await expect(page.locator('text=创建新作品')).toBeVisible()
  })
})
