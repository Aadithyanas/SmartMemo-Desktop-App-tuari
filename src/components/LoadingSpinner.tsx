import { Sparkles } from "lucide-react"

export function LoadingSpinner() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-purple-400" />
            </div>
            <p className="text-purple-200 text-lg font-medium">Loading your memos...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
