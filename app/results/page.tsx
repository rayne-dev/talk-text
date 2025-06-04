"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Plus, Copy, Check, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import Header from "@/components/header"

interface TranscriptionResult {
  text: string
  mode: "text" | "calculate"
  timestamp: string
  duration?: number
  audioSize?: number
}

interface NotionCategory {
  id: string
  name: string
  color: string
}

export default function ResultsPage() {
  const [result, setResult] = useState<TranscriptionResult | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [isAddingToNotion, setIsAddingToNotion] = useState(false)
  const [isFetchingCategories, setIsFetchingCategories] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<NotionCategory[]>([])
  const [propertyNames, setPropertyNames] = useState<Record<string, string>>({})

  const router = useRouter()
  const { language, translations } = useLanguage()

  // Default categories in case API fails
  const defaultCategories = [
    { id: "idea", name: "Idea", color: "blue" },
    { id: "task", name: "Task", color: "green" },
    { id: "reminder", name: "Reminder", color: "yellow" },
    { id: "shopping", name: "Shopping List", color: "orange" },
    { id: "calculation", name: "Calculation", color: "purple" },
  ]

  useEffect(() => {
    const loadResult = () => {
      try {
        const storedResult = localStorage.getItem("transcription-result")
        if (storedResult) {
          const parsedResult = JSON.parse(storedResult)
          setResult(parsedResult)
          console.log("Loaded transcription result:", parsedResult)
        } else {
          console.log("No transcription result found, redirecting to home")
          router.push("/")
        }
      } catch (error) {
        console.error("Error loading transcription result:", error)
        setError("Failed to load transcription result")
        setTimeout(() => router.push("/"), 2000)
      } finally {
        setIsLoading(false)
      }
    }

    loadResult()
    fetchNotionCategories()
  }, [router])

  const fetchNotionCategories = async () => {
    setIsFetchingCategories(true)
    try {
      const notionToken = localStorage.getItem("notion-token")
      const notionDbId = localStorage.getItem("notion-db-id")

      if (!notionToken || !notionDbId) {
        console.log("Notion credentials not found, using default categories")
        setCategories(defaultCategories)
        setSelectedCategory(defaultCategories[0].name)
        return
      }

      const response = await fetch("/api/notion", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-notion-token": notionToken,
          "x-notion-db-id": notionDbId,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`)
      }

      const data = await response.json()
      console.log("Fetched Notion data:", data)

      if (data.categories && data.categories.length > 0) {
        setCategories(data.categories)
        setSelectedCategory(data.categories[0].name)
      } else {
        setCategories(defaultCategories)
        setSelectedCategory(defaultCategories[0].name)
      }

      if (data.propertyNames) {
        setPropertyNames(data.propertyNames)
      }
    } catch (error) {
      console.error("Error fetching Notion categories:", error)
      setCategories(defaultCategories)
      setSelectedCategory(defaultCategories[0].name)
    } finally {
      setIsFetchingCategories(false)
    }
  }

  const handleAddToNotion = async () => {
    if (!result || !selectedCategory) return

    setIsAddingToNotion(true)
    setError(null)

    try {
      // Validate Notion credentials
      const notionToken = localStorage.getItem("notion-token")
      const notionDbId = localStorage.getItem("notion-db-id")

      if (!notionToken || !notionDbId) {
        throw new Error("Notion credentials not found. Please check your settings.")
      }

      console.log("Adding to Notion:", {
        category: selectedCategory,
        mode: result.mode,
        textLength: result.text.length,
        propertyNames,
      })

      const response = await fetch("/api/notion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-notion-token": notionToken,
          "x-notion-db-id": notionDbId,
        },
        body: JSON.stringify({
          text: result.text,
          category: selectedCategory,
          mode: result.mode,
          timestamp: result.timestamp,
          metadata: {
            duration: result.duration,
            audioSize: result.audioSize,
          },
        }),
      })

      const responseData = await response.text()
      console.log("Notion API response:", { status: response.status, body: responseData })

      if (!response.ok) {
        let errorMessage = "Failed to add to Notion"

        try {
          const errorData = JSON.parse(responseData)
          errorMessage = errorData.error || errorMessage
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`
          }
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }

        throw new Error(errorMessage)
      }

      // Success animation
      const successElement = document.getElementById("success-indicator")
      if (successElement) {
        successElement.classList.add("success-checkmark")
      }

      alert(translations.results.addedToNotion)

      // Clear the stored result and redirect
      localStorage.removeItem("transcription-result")
      setTimeout(() => {
        router.push("/")
      }, 1000)
    } catch (error: any) {
      console.error("Error adding to Notion:", error)
      setError(error.message || translations.results.notionError)
    } finally {
      setIsAddingToNotion(false)
    }
  }

  const copyToClipboard = async () => {
    if (result?.text) {
      try {
        await navigator.clipboard.writeText(result.text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error("Failed to copy to clipboard:", error)
        // Fallback for older browsers
        const textArea = document.createElement("textarea")
        textArea.value = result.text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Unknown"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <div className="text-black text-lg">{language === "my" ? "ခဏစောင့်ပါ..." : "Loading..."}</div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <div className="text-black text-lg">No transcription result found</div>
          <Button
            onClick={() => router.push("/")}
            className="bg-black text-white hover:bg-gray-800 transition-all duration-300 transform hover:scale-105"
          >
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl animate-in fade-in duration-500">
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="border-2 border-black text-black hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {translations.results.back}
            </Button>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48 border-2 border-black focus:ring-0 focus:border-black">
                    <div className="flex items-center gap-2">
                      {isFetchingCategories && <Loader2 className="w-3 h-3 animate-spin" />}
                      <SelectValue placeholder={translations.results.selectCategory} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={fetchNotionCategories}
                  variant="ghost"
                  size="sm"
                  className="absolute right-10 top-1/2 -translate-y-1/2 p-1 hover:bg-transparent"
                  disabled={isFetchingCategories}
                >
                  <RefreshCw
                    className={`w-3 h-3 text-gray-500 hover:text-black ${isFetchingCategories ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>

              <Button
                onClick={handleAddToNotion}
                disabled={!selectedCategory || isAddingToNotion}
                className="bg-black text-white border-2 border-black hover:bg-gray-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                {isAddingToNotion ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {translations.results.adding}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {translations.results.addToNotion}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="border-2 border-red-500 bg-red-50 error-shake">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] card-hover">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-xl text-black mb-2">
                    {result.mode === "text"
                      ? translations.results.transcriptionResult
                      : translations.results.calculationResult}
                  </CardTitle>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>{new Date(result.timestamp).toLocaleString(language === "my" ? "my-MM" : "en-US")}</p>
                    {result.duration && <p>Duration: {formatDuration(result.duration)}</p>}
                    {result.audioSize && <p>Audio Size: {formatFileSize(result.audioSize)}</p>}
                  </div>
                </div>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="border-2 border-black text-black hover:bg-gray-100 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 relative hover:border-black transition-colors duration-300">
                <p className="text-black whitespace-pre-wrap leading-relaxed text-lg min-h-[100px]">{result.text}</p>

                {/* Success indicator */}
                <div
                  id="success-indicator"
                  className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full items-center justify-center hidden"
                >
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Text Statistics */}
              <div className="mt-4 flex justify-between text-sm text-gray-500 border-t pt-4">
                <span>Characters: {result.text.length}</span>
                <span>Words: {result.text.split(/\s+/).filter((word) => word.length > 0).length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Footer */}
        <footer className="border-t-2 border-black bg-white py-4 mt-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-600 text-sm">
              Made with 💙 by <span className="font-semibold text-black">Phyo Zin Ko</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
