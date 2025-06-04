"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Key, Database, ExternalLink } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [geminiKey, setGeminiKey] = useState("")
  const [notionToken, setNotionToken] = useState("")
  const [notionDbId, setNotionDbId] = useState("")
  const { translations } = useLanguage()

  useEffect(() => {
    if (isOpen) {
      setGeminiKey(localStorage.getItem("gemini-api-key") || "")
      setNotionToken(localStorage.getItem("notion-token") || "")
      setNotionDbId(localStorage.getItem("notion-db-id") || "")
    }
  }, [isOpen])

  const handleSave = () => {
    localStorage.setItem("gemini-api-key", geminiKey)
    localStorage.setItem("notion-token", notionToken)
    localStorage.setItem("notion-db-id", notionDbId)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <DialogHeader>
          <DialogTitle className="text-black">{translations.settings.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-gemini-key" className="text-black font-semibold flex items-center gap-2">
              <Key className="w-4 h-4" />
              {translations.setup.geminiKey}
            </Label>
            <Input
              id="settings-gemini-key"
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="border-2 border-black focus:ring-0 focus:border-black"
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

          <div className="space-y-2">
            <Label htmlFor="settings-notion-token" className="text-black font-semibold flex items-center gap-2">
              <Database className="w-4 h-4" />
              {translations.setup.notionToken}
            </Label>
            <Input
              id="settings-notion-token"
              type="password"
              value={notionToken}
              onChange={(e) => setNotionToken(e.target.value)}
              className="border-2 border-black focus:ring-0 focus:border-black"
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

          <div className="space-y-2">
            <Label htmlFor="settings-notion-db-id" className="text-black font-semibold">
              {translations.setup.notionDbId}
            </Label>
            <Input
              id="settings-notion-db-id"
              value={notionDbId}
              onChange={(e) => setNotionDbId(e.target.value)}
              className="border-2 border-black focus:ring-0 focus:border-black"
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

          <div className="flex gap-2 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-2 border-black text-black hover:bg-gray-100"
            >
              {translations.settings.cancel}
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-black text-white border-2 border-black hover:bg-gray-800">
              {translations.settings.save}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
