// Vite 会把 worker 打包为独立资源，避免在主线程解析 PDF
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

async function parsePdf(file: File): Promise<string> {
  // 动态加载，仅在用户上传 PDF 时才下载解析引擎
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages: string[] = []
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    pages.push(text.replace(/[ \t]+/g, ' ').trim())
  }
  return pages.filter(Boolean).join('\n\n')
}

async function parseDocx(file: File): Promise<string> {
  // 动态引入浏览器版 bundle，避免把 Node 相关代码打进主包
  const mammoth = (await import('mammoth/mammoth.browser')).default
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

export interface ParseResult {
  text: string
  fileName: string
  fileType: string
}

export async function extractResumeText(file: File): Promise<ParseResult> {
  const isPdf =
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  const isDocx =
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.toLowerCase().endsWith('.docx')

  let text: string
  if (isPdf) {
    text = await parsePdf(file)
  } else if (isDocx) {
    text = await parseDocx(file)
  } else {
    throw new Error('暂不支持该文件格式，请上传 PDF 或 Word（.docx）简历')
  }

  const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  if (cleaned.length < 20) {
    throw new Error('未从文件中提取到有效文本，该简历可能是扫描件/图片版 PDF')
  }
  return { text: cleaned, fileName: file.name, fileType: isPdf ? 'PDF' : 'DOCX' }
}
