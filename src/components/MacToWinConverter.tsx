import { useState, useRef } from 'react'
import { motion } from 'motion/react'
import { FileSpreadsheet, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { cn } from '../lib/utils'

type Status = 'idle' | 'processing' | 'success' | 'error'

export default function MacToWinConverter() {
  const [status, setStatus]       = useState<Status>('idle')
  const [fileName, setFileName]   = useState('')
  const [errorMsg, setErrorMsg]   = useState('')
  const [isDragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function processFile(file: File) {
    setFileName(file.name)
    setStatus('processing')
    try {
      const ext = file.name.split('.').pop()?.toLowerCase()
      const buffer = await file.arrayBuffer()

      if (ext === 'csv') {
        // UTF-8 BOM을 파일 선두에 추가하여 윈도우 엑셀이 인코딩을 인식하도록 함
        const text = new TextDecoder('utf-8').decode(buffer)
        const bom  = new Uint8Array([0xEF, 0xBB, 0xBF])
        const body = new TextEncoder().encode(text)
        saveAs(
          new Blob([bom, body], { type: 'text/csv;charset=utf-8' }),
          file.name.replace(/\.csv$/i, '_win.csv')
        )
      } else if (ext === 'xlsx' || ext === 'xls') {
        // xlsx 라이브러리로 파싱 후 표준 XLSX 포맷으로 재구성
        const wb  = XLSX.read(buffer, { type: 'array' })
        const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
        saveAs(
          new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
          file.name.replace(/\.(xlsx|xls)$/i, '_win.xlsx')
        )
      } else {
        throw new Error('CSV 또는 Excel 파일(.csv, .xlsx, .xls)만 지원합니다.')
      }
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
        <h2 className="text-base font-semibold">Mac → Windows 인코딩 복구</h2>
        <p className="text-sm text-gray-400 mt-1">
          맥에서 저장한 CSV/Excel의 한글 깨짐을 자동 복구합니다.
          CSV는 UTF-8 BOM을 추가하고, Excel은 XLSX 포맷으로 재구성합니다.
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
            accept=".csv,.xlsx,.xls"
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
              <FileSpreadsheet className="mx-auto mb-3 text-gray-600" size={42} />
              <p className="text-gray-300 font-medium">파일을 여기 놓거나 클릭하여 선택</p>
              <p className="text-gray-600 text-sm mt-1.5">.csv · .xlsx · .xls</p>
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
