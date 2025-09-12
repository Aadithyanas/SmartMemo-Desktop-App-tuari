import { useCallback, useMemo } from "react"
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window"

export const useWindowResize = () => {
  const currentWindow = useMemo(() => getCurrentWindow(), [])
  console.log(currentWindow)

  const resizeWindow = useCallback(async (width: number, height: number, delay = 0) => {
    try {
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay))
      await currentWindow.setSize(new LogicalSize(width, height))
    } catch (error) {
      console.error("❌ Failed to resize:", error)
    }
  }, [currentWindow])

  const resizeWithAnimation = useCallback(async (
    width: number,
    height: number,
    options: {
      animationDelay?: number
      resizeDelay?: number
      postResizeDelay?: number
    } = {}
  ) => {
    const {
      animationDelay = 0,
      resizeDelay = 100,
      postResizeDelay = 150
    } = options

    try {
      if (animationDelay > 0) await new Promise((resolve) => setTimeout(resolve, animationDelay))
      await new Promise((resolve) => setTimeout(resolve, resizeDelay))
      await currentWindow.setSize(new LogicalSize(width, height))
      await new Promise((resolve) => setTimeout(resolve, postResizeDelay))
    } catch (error) {
      console.error("❌ Failed to resize with animation:", error)
    }
  }, [currentWindow])

  return { resizeWindow, resizeWithAnimation }
}
