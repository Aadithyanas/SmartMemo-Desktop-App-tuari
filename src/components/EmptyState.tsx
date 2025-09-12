import { Card, CardContent } from "@/components/ui/card"
import { Search } from "lucide-react"

interface EmptyStateProps {
  searchTerm: string
  selectedTag: string
}

export function EmptyState({ searchTerm, selectedTag }: EmptyStateProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full mb-6">
          <Search className="h-12 w-12 text-purple-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">No memos found</h3>
        <p className="text-purple-200 text-center max-w-md">
          {searchTerm || selectedTag !== "all"
            ? "Try adjusting your search criteria or filters to find what you're looking for"
            : "Start by recording your first memo to begin your AI-powered journey"}
        </p>
      </CardContent>
    </Card>
  )
}
