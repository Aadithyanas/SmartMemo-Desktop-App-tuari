import { useCallback, useRef } from "react"
import { getCurrentWindow } from "@tauri-apps/api/window"

export const useDragHandler = () => {
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isDraggingRef = useRef(false)
  const mouseDownTimeRef = useRef<number>(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    mouseDownTimeRef.current = Date.now()
    isDraggingRef.current = false

    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
    }

    dragTimeoutRef.current = setTimeout(async () => {
      isDraggingRef.current = true
      try {
        await getCurrentWindow().startDragging()
      } catch (error) {
        console.error("Failed to start dragging:", error)
      }
    }, 400)
  }, [])

  const handleMouseUp = useCallback(() => {
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
      dragTimeoutRef.current = null
    }
    isDraggingRef.current = false
  }, [])

  const cleanup = useCallback(() => {
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
    }
  }, [])

  return { handleMouseDown, handleMouseUp, cleanup }
}