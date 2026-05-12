// 平台发布工具包 — 起点/纵横/番茄格式化导出

export type Platform = 'qidian' | 'zongheng' | 'fanqie' | 'qimao'

const PLATFORM_CONFIG: Record<Platform, {
  name: string
  chapterTitleFormat: (n: number, title: string) => string
  paragraphIndent: string
  lineBreak: string
  volumeSeparator: string
  requirements: string[]
}> = {
  qidian: {
    name: '起点中文网',
    chapterTitleFormat: (n, t) => `第${n}章 ${t}`,
    paragraphIndent: '　　', // 全角空格
    lineBreak: '\n',
    volumeSeparator: '\n\n--- 卷分隔 ---\n\n',
    requirements: ['章节2000-5000字', '段落首行缩进', '章节末尾需有悬念/钩子', '无敏感政治/色情内容']
  },
  zongheng: {
    name: '纵横中文网',
    chapterTitleFormat: (n, t) => `第${n}章 ${t}`,
    paragraphIndent: '　　',
    lineBreak: '\n',
    volumeSeparator: '\n\n=== 新卷 ===\n\n',
    requirements: ['章节2000字以上', '段落首行缩进', '分卷结构清晰', '无违禁内容']
  },
  fanqie: {
    name: '番茄小说',
    chapterTitleFormat: (n, t) => `第${n}章 ${t}`,
    paragraphIndent: '　　',
    lineBreak: '\n\n',
    volumeSeparator: '\n\n---\n\n',
    requirements: ['章节1500-4000字', '段落间空行', '适合手机阅读的短段落', '无敏感内容']
  },
  qimao: {
    name: '七猫小说',
    chapterTitleFormat: (n, t) => `第${n}章 ${t}`,
    paragraphIndent: '',
    lineBreak: '\n\n',
    volumeSeparator: '\n\n***\n\n',
    requirements: ['章节2000字以上', '段落间空行', '无敏感内容', '适合移动端阅读']
  }
}

export interface ExportOptions {
  platform: Platform
  chapters: Array<{ title: string; content: string; chapterNumber: number; volumeTitle?: string }>
}

export interface PublishChecklist {
  item: string
  passed: boolean
  note: string
}

export function formatForPlatform(options: ExportOptions): string {
  const config = PLATFORM_CONFIG[options.platform]
  const parts: string[] = []
  let lastVolume = ''

  for (const ch of options.chapters) {
    // 卷分隔
    if (ch.volumeTitle && ch.volumeTitle !== lastVolume) {
      parts.push(config.volumeSeparator + ch.volumeTitle + config.volumeSeparator)
      lastVolume = ch.volumeTitle
    }

    // 章节标题
    parts.push(config.chapterTitleFormat(ch.chapterNumber, ch.title))
    parts.push('')

    // 正文格式化
    const paragraphs = ch.content.split(/\n\n+/).filter((p) => p.trim())
    for (const para of paragraphs) {
      parts.push(config.paragraphIndent + para.trim())
    }
    parts.push(config.lineBreak)
  }

  return parts.join('\n')
}

export function generatePublishChecklist(
  chapters: ExportOptions['chapters'],
  sensitiveMatches: number
): PublishChecklist[] {
  const totalWords = chapters.reduce((sum, c) => sum + c.content.length, 0)
  const avgWords = chapters.length > 0 ? totalWords / chapters.length : 0

  const checklist: PublishChecklist[] = [
    { item: '总字数达标(>2万字)', passed: totalWords > 20000, note: totalWords > 20000 ? `✅ ${totalWords}字` : `❌ 仅${totalWords}字` },
    { item: '章节均字数(2000-5000)', passed: avgWords >= 2000 && avgWords <= 5000, note: `均${Math.round(avgWords)}字/章` },
    { item: '每章有结尾钩子', passed: true, note: '⚠ 需人工确认' },
    { item: '段落首行缩进', passed: true, note: '✅ 已自动添加' },
    { item: '无敏感词', passed: sensitiveMatches === 0, note: sensitiveMatches === 0 ? '✅ 通过' : `❌ ${sensitiveMatches}处敏感词` },
  ]

  return checklist
}

export function getPlatformOptions() {
  return Object.entries(PLATFORM_CONFIG).map(([key, val]) => ({
    value: key as Platform,
    label: val.name,
    requirements: val.requirements
  }))
}
