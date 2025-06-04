"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Settings, Globe } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import SettingsModal from "@/components/settings-modal"

export default function Header() {
  const [showSettings, setShowSettings] = useState(false)
  const { language, toggleLanguage, translations } = useLanguage()

  return (
    <>
      <header className="border-b-2 border-black bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <div className="w-6 h-4 bg-white rounded-sm relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-0.5 bg-black rounded-full"></div>
                </div>
              </div>
            </div>
            <h1 className="text-xl font-bold text-black flex items-center gap-2">🎙️ Talk-Text</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowSettings(true)}
              variant="ghost"
              size="sm"
              className="text-black hover:bg-gray-100 p-2"
              title={translations.header.settings}
            >
              <Settings className="w-5 h-5" />
              <span className="hidden md:inline ml-2">{translations.header.settings}</span>
            </Button>

            <Button
              onClick={toggleLanguage}
              variant="ghost"
              size="sm"
              className="text-black hover:bg-gray-100 p-2"
              title={translations.header.language}
            >
              <Globe className="w-5 h-5" />
              <span className="hidden md:inline ml-2">{language === "en" ? "EN" : "မြန်မာ"}</span>
            </Button>
          </div>
        </div>
      </header>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
