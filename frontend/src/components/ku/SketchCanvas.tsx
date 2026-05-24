import { useRef, useState } from 'react'
import { ReactSketchCanvas } from 'react-sketch-canvas'
import type { ReactSketchCanvasRef } from 'react-sketch-canvas'

interface SketchCanvasProps {
  onChange: (dataUrl: string | null) => void
}

export default function SketchCanvas({ onChange }: SketchCanvasProps) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [strokeColor, setStrokeColor] = useState('#2C2C2A')
  const [strokeWidth, setStrokeWidth] = useState(3)

  const handleStroke = async () => {
    if (!canvasRef.current) return
    const paths = await canvasRef.current.exportPaths()
    if (paths.length === 0) return
    setHasDrawn(true)
    const dataUrl = await canvasRef.current.exportImage('png')
    onChange(dataUrl)
}

  const handleClear = () => {
    canvasRef.current?.clearCanvas()
    setHasDrawn(false)
    onChange(null)
  }

  const handleUndo = () => {
    canvasRef.current?.undo()
  }

  const colors = ['#2C2C2A', '#854F0B', '#0C447C', '#085041', '#993C1D']

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-ink-muted">sketch (optional)</p>
        <div className="flex gap-3">
          <button onClick={handleUndo} className="text-xs text-ink-faint">undo</button>
          {hasDrawn && (
            <button onClick={handleClear} className="text-xs text-red-400">clear</button>
          )}
        </div>
      </div>

      <div className="flex gap-2 items-center mb-1">
        {colors.map(color => (
          <button
            key={color}
            onClick={() => setStrokeColor(color)}
            className={`w-5 h-5 rounded-full border-2 ${
              strokeColor === color ? 'border-ink' : 'border-transparent'
            }`}
            style={{ background: color }}
          />
        ))}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-ink-faint">size</span>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={strokeWidth}
            onChange={e => setStrokeWidth(Number(e.target.value))}
            className="w-16"
          />
        </div>
      </div>

      <div className="border border-paper-border rounded-lg overflow-hidden bg-paper-bg">
        <ReactSketchCanvas
            ref={canvasRef}
            width="100%"
            height="120px"
            strokeWidth={strokeWidth}
            strokeColor={strokeColor}
            backgroundImage=""
            exportWithBackgroundImage={false}
            style={{ border: 'none' }}
            onChange={handleStroke}
            />
      </div>
    </div>
  )
}