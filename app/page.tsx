"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SetupPage from "@/components/setup-page"
import RecordingPage from "@/components/recording-page"
import { useLanguage } from "@/hooks/use-language"

export default function HomePage() {
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { language } = useLanguage()

  useEffect(() => {
    // Check if setup is complete
    const geminiKey = localStorage.getItem("gemini-api-key")
    const notionToken = localStorage.getItem("notion-token")
    const notionDbId = localStorage.getItem("notion-db-id")

    if (geminiKey && notionToken && notionDbId) {
      setIsSetupComplete(true)
    }
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-black text-lg">{language === "my" ? "ခဏစောင့်ပါ..." : "Loading..."}</div>
      </div>
    )
  }

  if (!isSetupComplete) {
    return <SetupPage onSetupComplete={() => setIsSetupComplete(true)} />
  }

  return <RecordingPage />
}
