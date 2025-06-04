"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mic, Key, Database, ExternalLink } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import Header from "@/components/header"

interface SetupPageProps {
  onSetupComplete: () => void
}

export default function SetupPage({ onSetupComplete }: SetupPageProps) {
  const [geminiKey, setGeminiKey] = useState("")
  const [notionToken, setNotionToken] = useState("")
  const [notionDbId, setNotionDbId] = useState("")
  const [micPermission, setMicPermission] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { language, translations } = useLanguage()

  const requestMicPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setMicPermission(true)
    } catch (error) {
      setMicPermission(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!micPermission) {
      await requestMicPermission()
      if (!micPermission) {
        setIsLoading(false)
        return
      }
    }

    // Save to localStorage
    localStorage.setItem("gemini-api-key", geminiKey)
    localStorage.setItem("notion-token", notionToken)
    localStorage.setItem("notion-db-id", notionDbId)

    setIsLoading(false)
    onSetupComplete()
  }

  const isFormValid = geminiKey && notionToken && notionDbId && micPermission

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-black">{translations.setup.title}</CardTitle>
            <CardDescription className="text-gray-600">{translations.setup.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Microphone Permission */}
              <div className="space-y-2">
                <Label className="text-black font-semibold flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  {translations.setup.micPermission}
                </Label>
                <Button
                  type="button"
                  onClick={requestMicPermission}
                  variant={micPermission ? "default" : "outline"}
                  className={`w-full border-2 border-black ${
                    micPermission ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
                  } shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                >
                  {micPermission === null
                    ? translations.setup.requestMic
                    : micPermission
                      ? translations.setup.micGranted
                      : translations.setup.micDenied}
                </Button>
              </div>

              {/* Gemini API Key */}
              <div className="space-y-2">
                <Label htmlFor="gemini-key" className="text-black font-semibold flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  {translations.setup.geminiKey}
                </Label>
                <Input
                  id="gemini-key"
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="border-2 border-black focus:ring-0 focus:border-black"
                  placeholder={translations.setup.geminiKeyPlaceholder}
                />
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {translations.setup.getGeminiKey}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Notion Integration Token */}
              <div className="space-y-2">
                <Label htmlFor="notion-token" className="text-black font-semibold flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  {translations.setup.notionToken}
                </Label>
                <Input
                  id="notion-token"
                  type="password"
                  value={notionToken}
                  onChange={(e) => setNotionToken(e.target.value)}
                  className="border-2 border-black focus:ring-0 focus:border-black"
                  placeholder={translations.setup.notionTokenPlaceholder}
                />
                <a
                  href="https://www.notion.so/profile/integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {translations.setup.getNotionToken}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Notion Database ID */}
              <div className="space-y-2">
                <Label htmlFor="notion-db-id" className="text-black font-semibold">
                  {translations.setup.notionDbId}
                </Label>
                <Input
                  id="notion-db-id"
                  value={notionDbId}
                  onChange={(e) => setNotionDbId(e.target.value)}
                  className="border-2 border-black focus:ring-0 focus:border-black"
                  placeholder={translations.setup.notionDbIdPlaceholder}
                />
                <a
                  href="https://developers.notion.com/docs/working-with-databases#adding-pages-to-a-database"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {translations.setup.getNotionDbId}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full bg-black text-white border-2 border-black hover:bg-gray-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
              >
                {isLoading ? translations.setup.saving : translations.setup.continue}
              </Button>
            </form>

            {micPermission === false && (
              <Alert className="border-2 border-red-500">
                <AlertDescription className="text-red-700">{translations.setup.micError}</AlertDescription>
              </Alert>
            )}
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
  )
}
