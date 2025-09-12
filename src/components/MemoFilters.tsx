"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Tag, SortAsc } from "lucide-react"

interface MemoFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedTag: string
  setSelectedTag: (tag: string) => void
  sortBy: string
  setSortBy: (sort: string) => void
  allTags: string[]
}

export function MemoFilters({
  searchTerm,
  setSearchTerm,
  selectedTag,
  setSelectedTag,
  sortBy,
  setSortBy,
  allTags,
}: MemoFiltersProps) {
  return (
    <Card className="bg-white/90 dark:bg-white/10 backdrop-blur-lg border-gray-200/50 dark:border-white/20 shadow-xl dark:shadow-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <Filter className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <CardTitle className="text-gray-900 dark:text-white">Smart Filters</CardTitle>
        </div>
        <CardDescription className="text-gray-600 dark:text-purple-200">
          Find and organize your memos with intelligent search and filtering
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-purple-600 dark:text-purple-400" />
            <Input
              placeholder="Search memos, transcriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 dark:bg-white/10 border-gray-300 dark:border-white/20 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-purple-300 focus:border-purple-500 dark:focus:border-purple-400"
            />
          </div>

          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="bg-white/80 dark:bg-white/10 border-gray-300 dark:border-white/20 text-gray-900 dark:text-white">
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <SelectValue placeholder="Filter by tag" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <SelectItem value="all" className="text-gray-900 dark:text-white">
                All Tags
              </SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag} className="text-gray-900 dark:text-white">
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="bg-white/80 dark:bg-white/10 border-gray-300 dark:border-white/20 text-gray-900 dark:text-white">
              <div className="flex items-center space-x-2">
                <SortAsc className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <SelectItem value="newest" className="text-gray-900 dark:text-white">
                Newest
              </SelectItem>
              <SelectItem value="oldest" className="text-gray-900 dark:text-white">
                Oldest
              </SelectItem>
              <SelectItem value="duration" className="text-gray-900 dark:text-white">
                Duration
              </SelectItem>
              <SelectItem value="title" className="text-gray-900 dark:text-white">
                Title A-Z
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
