import { useState, useRef } from 'react'
import { motion } from 'motion/react'
import { FileText, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { saveAs } from 'file-saver'
import { cn } from '../lib/utils'

type Status = 'idle' | 'processing' | 'success' | 'error'

// hwp.js 버전에 따라 구조가 다를 수 있어 방어적으로 텍스트 추출
function extractLines(doc: any): string[] {
  const lines: string[] = []
  const root = doc?.body ?? doc
  const sections: any[] = root?.sections ?? root?.section ?? doc?.sections ?? []

  for (const section of sections) {
    const paragraphs: any[] = section?.content ?? section?.paragraphs ?? []
    for (const para of paragraphs) {
      let text = ''
      if (typeof para?.text === 'string') {
        text = para.text
      } else if (Array.isArray(para?.content)) {
        text = para.content.map((c: any) => c?.text ?? c?.value ?? '').join('')
      } else if (Array.isArray(para?.chars)) {
        text = para.chars.map((c: any) => c?.value ?? c?.text ?? '').join('')
      }
      if (text.trim()) lines.push(text.trim())
    }
  }
  return lines
}

export default function HwpToPdfConverter() {
  const [status, setStatus]       = useState<Status>('idle')
  const [fileName, setFileName]   = useState('')
  const [errorMsg, setErrorMsg]   = useState('')
  const [isDragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function processFile(file: File) {
    setFileName(file.name)
    setStatus('processing')
    try {
      const buffer = await file.arrayBuffer()

      // hwp.js를 동적으로 임포트 (번들 사이즈 최적화)
      const hwpModule = await import('hwp.js')
      const HWP = hwpModule.default ?? hwpModule
      const hwpDoc = HWP.parse(new Uint8Array(buffer))
      const lines = extractLines(hwpDoc)

      if (lines.length === 0) {
        throw new Error('문서에서 텍스트를 추출할 수 없습니다. HWP 파일 형식을 확인해주세요.')
      }

      // jsPDF로 A4 문서 생성
      const pdf     = new jsPDF({ unit: 'mm', format: 'a4' })
      const pageW   = pdf.internal.pageSize.getWidth()
      const pageH   = pdf.internal.pageSize.getHeight()
      const margin  = 20
      const lineH   = 7
      let y = 25

      for (const line of lines) {
        const wrapped: string[] = pdf.splitTextToSize(line, pageW - margin * 2)
        for (const chunk of wrapped) {
          if (y + lineH > pageH - margin) {
            pdf.addPage()
            y = 25
          }
          pdf.text(chunk, margin, y)
          y += lineH
        }
        y += 2 // 문단 간격
      }

      saveAs(
        new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' }),
        file.name.replace(/\.hwp$/i, '.pdf')
      )
      setStatus('success')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.')
      setStatus('error')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function reset() {
    setStatus('idle')
    setFileName('')
    setErrorMsg('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const isIdle = status === 'idle'

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">HWP → PDF 변환</h2>
        <p className="text-sm text-gray-400 mt-1">
          한글 뷰어 없이 HWP 문서를 PDF로 변환합니다.
          섹션과 문단을 순회하여 텍스트를 추출한 후 A4 PDF를 생성합니다.
        </p>
        <p className="text-xs text-yellow-600/70 mt-1.5">
          ⚠ jsPDF 기본 폰트는 한글을 지원하지 않습니다. 한글 내용은 PDF에서 빈 칸으로 표시될 수 있습니다.
        </p>
      </div>

      {status === 'idle' || status === 'processing' ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => isIdle && inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-16 text-center transition-all select-none',
            isIdle ? 'cursor-pointer' : 'cursor-default',
            isDragOver
              ? 'border-blue-500 bg-blue-500/10'
              : isIdle
              ? 'border-gray-700 hover:border-gray-500 hover:bg-gray-900/40'
              : 'border-gray-700 opacity-50'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".hwp"
            onChange={handleChange}
            className="hidden"
          />
          {status === 'processing' ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-7 h-7 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">변환 중...</p>
            </div>
          ) : (
            <>
              <FileText className="mx-auto mb-3 text-gray-600" size={42} />
              <p className="text-gray-300 font-medium">파일을 여기 놓거나 클릭하여 선택</p>
              <p className="text-gray-600 text-sm mt-1.5">.hwp</p>
            </>
          )}
        </div>
      ) : status === 'success' ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="border border-green-800/50 bg-green-950/20 rounded-2xl p-14 text-center"
        >
          <CheckCircle className="mx-auto mb-3 text-green-400" size={42} />
          <p className="font-semibold text-green-300">변환 완료</p>
          <p className="text-gray-500 text-sm mt-1">{fileName}</p>
          <button
            onClick={reset}
            className="mt-5 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <RotateCcw size={13} /> 다른 파일 변환
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="border border-red-800/50 bg-red-950/20 rounded-2xl p-14 text-center"
        >
          <AlertCircle className="mx-auto mb-3 text-red-400" size={42} />
          <p className="font-semibold text-red-300">변환 실패</p>
          <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">{errorMsg}</p>
          <button
            onClick={reset}
            className="mt-5 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <RotateCcw size={13} /> 다시 시도
          </button>
        </motion.div>
      )}
    </div>
  )
}
