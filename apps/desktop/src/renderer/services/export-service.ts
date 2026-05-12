// 导出服务

export async function exportChapterAsText(
  title: string,
  content: string,
  format: 'txt' | 'md'
): Promise<void> {
  let text: string
  if (format === 'md') {
    text = `# ${title}\n\n${content}`
  } else {
    // 去除Markdown标记
    text = `${title}\n\n${content.replace(/[#*_~`>]/g, '')}`
  }

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title}.${format}`
  a.click()
  URL.revokeObjectURL(url)
}
