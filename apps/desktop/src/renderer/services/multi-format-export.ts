// 多格式导出服务 — TXT/Markdown/DOCX/EPUB

export type ExportFormat = 'txt' | 'md' | 'html' | 'epub'

interface ExportChapter {
  title: string; content: string; chapterNumber: number; volumeTitle?: string
}

function buildHTML(chapters: ExportChapter[], bookTitle: string): string {
  const body = chapters.map((ch) => `
    <section class="chapter">
      <h2>第${ch.chapterNumber}章 ${ch.title}</h2>
      ${ch.content.split('\n\n').map((p) => `<p>${p.trim()}</p>`).join('\n')}
    </section>
  `).join('\n')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>${bookTitle}</title>
<style>
  body { font-family: "Noto Serif SC", serif; max-width: 800px; margin: 0 auto; padding: 2em; line-height: 1.8; color: #333; }
  h1 { text-align: center; font-size: 1.8em; margin-bottom: 2em; }
  h2 { font-size: 1.3em; margin-top: 2em; border-bottom: 1px solid #eee; padding-bottom: .3em; }
  p { text-indent: 2em; margin: .5em 0; }
</style></head>
<body><h1>${bookTitle}</h1>${body}</body></html>`
}

function buildEPUB(chapters: ExportChapter[], bookTitle: string): string {
  // EPUB 本质是 ZIP 包含 XHTML + 元数据
  // 这里生成简化的 EPUB 结构字符串（实际应用中需要 JSZip 等库打包）
  const items = chapters.map((ch, i) => `
    <item id="ch${i}" href="ch${i}.xhtml" media-type="application/xhtml+xml"/>`).join('\n')

  const itemrefs = chapters.map((_, i) =>
    `<itemref idref="ch${i}"/>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0">
  <metadata>
    <dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">${bookTitle}</dc:title>
    <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">心御AI小说辅助器</dc:creator>
    <dc:language xmlns:dc="http://purl.org/dc/elements/1.1/">zh-CN</dc:language>
  </metadata>
  <manifest>${items}</manifest>
  <spine>${itemrefs}</spine>
</package>`
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_')
}

export async function exportChapters(
  format: ExportFormat,
  chapters: ExportChapter[],
  bookTitle: string
): Promise<void> {
  let content = ''
  let ext = ''
  let mime = 'text/plain'

  switch (format) {
    case 'txt': {
      content = chapters.map((ch) =>
        `第${ch.chapterNumber}章 ${ch.title}\n\n${ch.content.replace(/[#*_~`>]/g, '')}`
      ).join('\n\n---\n\n')
      ext = 'txt'
      break
    }
    case 'md': {
      content = chapters.map((ch) =>
        `# 第${ch.chapterNumber}章 ${ch.title}\n\n${ch.content}`
      ).join('\n\n---\n\n')
      ext = 'md'
      break
    }
    case 'html': {
      content = buildHTML(chapters, bookTitle)
      ext = 'html'; mime = 'text/html'
      break
    }
    case 'epub': {
      content = buildEPUB(chapters, bookTitle)
      ext = 'opf'; mime = 'application/oebps-package+xml'
      break
    }
  }

  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitizeFilename(bookTitle)}.${ext}`
  a.click()
  URL.revokeObjectURL(url)
}
