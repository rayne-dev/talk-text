"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Language = "en" | "my"

interface Translations {
  header: {
    settings: string
    language: string
  }
  setup: {
    title: string
    description: string
    micPermission: string
    requestMic: string
    micGranted: string
    micDenied: string
    micError: string
    geminiKey: string
    geminiKeyPlaceholder: string
    getGeminiKey: string
    notionToken: string
    notionTokenPlaceholder: string
    getNotionToken: string
    notionDbId: string
    notionDbIdPlaceholder: string
    getNotionDbId: string
    continue: string
    saving: string
  }
  recording: {
    chooseMode: string
    chooseModeDesc: string
    talkToText: string
    talkToTextDesc: string
    talkToCalculate: string
    talkToCalculateDesc: string
    changeMode: string
    startRecording: string
    stopRecording: string
    recordingComplete: string
    recordAgain: string
    transcribe: string
    processing: string
    error: string
  }
  results: {
    back: string
    transcriptionResult: string
    calculationResult: string
    selectCategory: string
    addToNotion: string
    adding: string
    addedToNotion: string
    notionError: string
  }
  settings: {
    title: string
    cancel: string
    save: string
  }
}

const translations: Record<Language, Translations> = {
  en: {
    header: {
      settings: "Settings",
      language: "Language",
    },
    setup: {
      title: "Setup Required",
      description: "Please provide the required permissions and API keys to get started.",
      micPermission: "Microphone Permission",
      requestMic: "Request Microphone Access",
      micGranted: "✓ Microphone Access Granted",
      micDenied: "✗ Microphone Access Denied",
      micError: "Microphone access is required for audio recording. Please allow microphone access and try again.",
      geminiKey: "Gemini API Key",
      geminiKeyPlaceholder: "Enter your Gemini API key",
      getGeminiKey: "Get Gemini API Key",
      notionToken: "Notion Integration Token",
      notionTokenPlaceholder: "Enter your Notion integration token",
      getNotionToken: "Get Notion Token",
      notionDbId: "Notion Database ID",
      notionDbIdPlaceholder: "Enter your Notion database ID",
      getNotionDbId: "How to find Database ID",
      continue: "Continue",
      saving: "Saving...",
    },
    recording: {
      chooseMode: "Choose Recording Mode",
      chooseModeDesc: "Select what you want to do with your voice recording.",
      talkToText: "Talk To Text",
      talkToTextDesc: "Convert your Burmese speech to text",
      talkToCalculate: "Talk To Calculate",
      talkToCalculateDesc: "Speak math problems and get calculations",
      changeMode: "Change Mode",
      startRecording: "Start Recording",
      stopRecording: "Stop Recording",
      recordingComplete: "Recording completed successfully!",
      recordAgain: "Record Again",
      transcribe: "Transcribe",
      processing: "Processing...",
      error: "Error processing audio. Please try again.",
    },
    results: {
      back: "Back",
      transcriptionResult: "Transcription Result",
      calculationResult: "Calculation Result",
      selectCategory: "Select Category",
      addToNotion: "Add to Notion",
      adding: "Adding...",
      addedToNotion: "Successfully added to Notion!",
      notionError: "Error adding to Notion. Please check your settings.",
    },
    settings: {
      title: "Settings",
      cancel: "Cancel",
      save: "Save",
    },
  },
  my: {
    header: {
      settings: "ဆက်တင်များ",
      language: "ဘာသာစကား",
    },
    setup: {
      title: "ပြင်ဆင်မှု လိုအပ်သည်",
      description: "စတင်ရန် လိုအပ်သော ခွင့်ပြုချက်များနှင့် API keys များကို ပေးပါ။",
      micPermission: "မိုက်ခရိုဖုန်း ခွင့်ပြုချက်",
      requestMic: "မိုက်ခရိုဖုန်း ခွင့်ပြုချက် တောင်းခံရန်",
      micGranted: "✓ မိုက်ခရိုဖုန်း ခွင့်ပြုချက် ရရှိပြီး",
      micDenied: "✗ မိုက်ခရိုဖုန်း ခွင့်ပြုချက် ငြင်းပယ်ခံရ",
      micError: "အသံဖမ်းရန် မိုက်ခရိုဖုန်း ခွင့်ပြုချက် လိုအပ်သည်။ ခွင့်ပြုပြီး ပြန်လည်ကြိုးစားပါ။",
      geminiKey: "Gemini API Key",
      geminiKeyPlaceholder: "သင်၏ Gemini API key ကို ထည့်ပါ",
      getGeminiKey: "Gemini API Key ရယူရန်",
      notionToken: "Notion Integration Token",
      notionTokenPlaceholder: "သင်၏ Notion integration token ကို ထည့်ပါ",
      getNotionToken: "Notion Token ရယူရန်",
      notionDbId: "Notion Database ID",
      notionDbIdPlaceholder: "သင်၏ Notion database ID ကို ထည့်ပါ",
      getNotionDbId: "Database ID ရှာနည်း",
      continue: "ဆက်လက်လုပ်ဆောင်ရန်",
      saving: "သိမ်းဆည်းနေသည်...",
    },
    recording: {
      chooseMode: "မှတ်တမ်းတင်မှု နည်းလမ်း ရွေးချယ်ပါ",
      chooseModeDesc: "သင်၏ အသံမှတ်တမ်းဖြင့် ဘာလုပ်ချင်သည်ကို ရွေးချယ်ပါ။",
      talkToText: "စကားပြောမှု စာသားပြောင်းခြင်း",
      talkToTextDesc: "သင်၏ မြန်မာစကားကို စာသားအဖြစ် ပြောင်းလဲပါ",
      talkToCalculate: "စကားပြောမှု တွက်ချက်ခြင်း",
      talkToCalculateDesc: "သင်္ချာပြဿနာများကို ပြောပြီး တွက်ချက်မှုများ ရယူပါ",
      changeMode: "နည်းလမ်း ပြောင်းလဲရန်",
      startRecording: "မှတ်တမ်းတင်ခြင်း စတင်ရန်",
      stopRecording: "မှတ်တမ်းတင်ခြင်း ရပ်တန့်ရန်",
      recordingComplete: "မှတ်တမ်းတင်ခြင်း အောင်မြင်စွာ ပြီးစီးပါပြီ!",
      recordAgain: "ပြန်လည် မှတ်တမ်းတင်ရန်",
      transcribe: "စာသားပြောင်းရန်",
      processing: "လုပ်ဆောင်နေသည်...",
      error: "အသံ လုပ်ဆောင်ရာတွင် အမှားရှိသည်။ ပြန်လည်ကြိုးစားပါ။",
    },
    results: {
      back: "နောက်သို့",
      transcriptionResult: "စာသားပြောင်းလဲမှု ရလဒ်",
      calculationResult: "တွက်ချက်မှု ရလဒ်",
      selectCategory: "အမျိုးအစား ရွေးချယ်ပါ",
      addToNotion: "Notion သို့ ထည့်ရန်",
      adding: "ထည့်နေသည်...",
      addedToNotion: "Notion သို့ အောင်မြင်စွာ ထည့်ပြီးပါပြီ!",
      notionError: "Notion သို့ ထည့်ရာတွင် အမှားရှိသည်။ သင်၏ ဆက်တင်များကို စစ်ဆေးပါ။",
    },
    settings: {
      title: "ဆက်တင်များ",
      cancel: "ပယ်ဖျက်ရန်",
      save: "သိမ်းဆည်းရန်",
    },
  },
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
  translations: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "my")) {
      setLanguage(savedLanguage)
    }
  }, [])

  const toggleLanguage = () => {
    const newLanguage = language === "en" ? "my" : "en"
    setLanguage(newLanguage)
    localStorage.setItem("language", newLanguage)
  }

  const value = {
    language,
    setLanguage: (lang: Language) => {
      setLanguage(lang)
      localStorage.setItem("language", lang)
    },
    toggleLanguage,
    translations: translations[language],
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
