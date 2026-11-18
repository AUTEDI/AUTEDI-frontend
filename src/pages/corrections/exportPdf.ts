const READY_TIMEOUT_MS = 20000
const READY_SELECTOR = '[data-export-photo]'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// PDF 라이브러리는 PDF가 필요할 때만 받는다. 같은 import는 한 번만 받으므로 미리 불러 둘 수 있다.
const loadLibraries = () => Promise.all([import('html-to-image'), import('jspdf')])

/** 검토 화면에 들어올 때 PDF 라이브러리를 미리 받아 둔다(실패해도 PDF를 만들 때 다시 받는다). */
export function preloadPdfLibraries() {
  loadLibraries().catch(() => {})
}

/** root 안의 학습지 사진(첨삭 표시 포함)이 모두 다 그려질 때까지 기다린다. */
async function waitForPhotos(root: HTMLElement, count: number) {
  const started = Date.now()
  for (;;) {
    const photos = [...root.querySelectorAll<HTMLElement>(READY_SELECTOR)]
    if (photos.length === count && photos.every((photo) => photo.dataset.ready === 'true')) return photos
    if (Date.now() - started > READY_TIMEOUT_MS) throw new Error('학습지 사진을 불러오지 못해 PDF를 만들 수 없어요.')
    await sleep(100)
  }
}

/** root 안에 페이지별로 그려 둔 학습지(첨삭 표시 포함)를 이미지로 떠서 A4 PDF 파일로 만든다. */
export async function buildPdf(root: HTMLElement, pageCount: number): Promise<Blob> {
  const [{ toCanvas }, { jsPDF }] = await loadLibraries()
  const photos = await waitForPhotos(root, pageCount)
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10

  for (const [index, photo] of photos.entries()) {
    // 화면보다 2배 촘촘하게 떠서 인쇄해도 글씨가 흐려지지 않게 한다.
    const canvas = await toCanvas(photo, { pixelRatio: 2, backgroundColor: '#ffffff' })
    // 비율을 지키며 여백 안에 가장 크게 넣는다.
    const scale = Math.min((pageWidth - margin * 2) / canvas.width, (pageHeight - margin * 2) / canvas.height)
    const width = canvas.width * scale
    const height = canvas.height * scale
    if (index > 0) pdf.addPage()
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height)
  }
  return pdf.output('blob')
}

/** 만들어 둔 PDF를 내려받는다. 파일 이름은 학습지 파일 이름에서 확장자만 바꾼다. */
export function downloadPdf(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName.replace(/\.[^.]+$/, '') || '첨삭 결과'}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
