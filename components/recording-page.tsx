"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calculator, FileText, AlertCircle, ArrowLeft, Mic, Square } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"
import Header from "@/components/header"
import LoadingScreen from "@/components/loading-screen"
import { useRouter } from "next/navigation"

type RecordingMode = "text" | "calculate" | null

interface ErrorDetails {
  message: string
  code?: string
  timestamp: string
  details?: any
}

export default function RecordingPage() {
  const [selectedMode, setSelectedMode] = useState<RecordingMode>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<ErrorDetails | null>(null)
  const [processingStep, setProcessingStep] = useState<string>("")
  const [recordingTime, setRecordingTime] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const { language, translations } = useLanguage()
  const router = useRouter()

  const handleModeSelect = (mode: RecordingMode) => {
    setSelectedMode(mode)
    setAudioBlob(null)
    setError(null)
  }

  const startRecording = async () => {
    try {
      setError(null)
      setRecordingTime(0)

      // Request microphone access with specific constraints
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      })

      setStream(mediaStream)

      // Check if MediaRecorder is supported
      if (!MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        if (!MediaRecorder.isTypeSupported("audio/webm")) {
          if (!MediaRecorder.isTypeSupported("audio/mp4")) {
            throw new Error("No supported audio format found")
          }
        }
      }

      // Create MediaRecorder with fallback formats
      let mimeType = "audio/webm;codecs=opus"
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm"
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "audio/mp4"
        }
      }

      const recorder = new MediaRecorder(mediaStream, {
        mimeType,
        audioBitsPerSecond: 128000,
      })

      const chunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data)
          console.log("Audio chunk received:", event.data.size, "bytes")
        }
      }

      recorder.onstop = () => {
        console.log("Recording stopped, chunks:", chunks.length)
        if (chunks.length === 0) {
          setError({
            message: "No audio data was recorded. Please check your microphone permissions and try again.",
            code: "EMPTY_RECORDING",
            timestamp: new Date().toISOString(),
          })
          return
        }

        const blob = new Blob(chunks, { type: mimeType })
        console.log("Final blob size:", blob.size, "bytes")

        if (blob.size === 0) {
          setError({
            message: "Recording failed: No audio data captured. Please ensure your microphone is working.",
            code: "EMPTY_RECORDING",
            timestamp: new Date().toISOString(),
          })
          return
        }

        if (blob.size < 1000) {
          setError({
            message: "Recording too short: Please record for at least 2 seconds.",
            code: "SHORT_RECORDING",
            timestamp: new Date().toISOString(),
          })
          return
        }

        setAudioBlob(blob)
        // Automatically process the audio
        setTimeout(() => {
          handleProcessAudio(blob)
        }, 500)
      }

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event)
        setError({
          message: "Recording error occurred. Please try again.",
          code: "RECORDING_ERROR",
          timestamp: new Date().toISOString(),
        })
      }

      setMediaRecorder(recorder)
      recorder.start(1000) // Collect data every second
      setIsRecording(true)

      // Start timer
      const timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      // Store timer reference for cleanup
      ;(recorder as any).timer = timer

      console.log("Recording started with format:", mimeType)
    } catch (error: any) {
      console.error("Error starting recording:", error)
      let errorMessage = "Failed to access microphone. "

      if (error.name === "NotAllowedError") {
        errorMessage += "Please allow microphone access and try again."
      } else if (error.name === "NotFoundError") {
        errorMessage += "No microphone found. Please connect a microphone and try again."
      } else if (error.name === "NotSupportedError") {
        errorMessage += "Your browser doesn't support audio recording."
      } else {
        errorMessage += error.message || "Please check your microphone settings."
      }

      setError({
        message: errorMessage,
        code: error.name || "MICROPHONE_ERROR",
        timestamp: new Date().toISOString(),
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop()
      console.log("Stopping recording...")

      // Clear timer
      if ((mediaRecorder as any).timer) {
        clearInterval((mediaRecorder as any).timer)
      }
    }

    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop()
        console.log("Stopped track:", track.kind)
      })
      setStream(null)
    }

    setIsRecording(false)
    setMediaRecorder(null)
  }

  const handleProcessAudio = async (blob?: Blob) => {
    const audioToProcess = blob || audioBlob
    if (!audioToProcess || !selectedMode) return

    setIsProcessing(true)
    setError(null)
    setProcessingStep("Preparing audio for transcription...")

    try {
      // Validate API keys
      const geminiKey = localStorage.getItem("gemini-api-key")
      if (!geminiKey) {
        throw new Error("Gemini API key not found. Please check your settings.")
      }

      setProcessingStep("Uploading audio to AI service...")

      const formData = new FormData()
      formData.append("audio", audioToProcess, "recording.webm")
      formData.append("mode", selectedMode)
      formData.append("language", language)

      console.log("Sending transcription request:", {
        audioSize: audioToProcess.size,
        mode: selectedMode,
        language: language,
      })

      setProcessingStep("Analyzing audio with AI...")

      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "x-gemini-key": geminiKey,
        },
        body: formData,
      })

      const responseText = await response.text()
      console.log("Transcription response:", { status: response.status, body: responseText })

      if (!response.ok) {
        let errorMessage = "Transcription failed"
        let errorCode = "TRANSCRIPTION_ERROR"

        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorMessage
          errorCode = errorData.code || errorCode
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
          errorCode = `HTTP_${response.status}`
        }

        throw new Error(errorMessage)
      }

      let result
      try {
        result = JSON.parse(responseText)
      } catch {
        throw new Error("Invalid response format from transcription service")
      }

      if (!result.text || result.text.trim().length === 0) {
        throw new Error("No transcription text received. The audio might be unclear or too quiet.")
      }

      setProcessingStep("Finalizing transcription...")

      // Store result and navigate to results page
      const transcriptionResult = {
        text: result.text,
        mode: selectedMode,
        timestamp: new Date().toISOString(),
        duration: recordingTime,
        audioSize: audioToProcess.size,
      }

      localStorage.setItem("transcription-result", JSON.stringify(transcriptionResult))

      console.log("Transcription successful:", transcriptionResult)

      // Navigate to results page
      setTimeout(() => {
        router.push("/results")
      }, 1000)
    } catch (error: any) {
      console.error("Transcription error:", error)

      const errorDetails: ErrorDetails = {
        message: error.message || "An unexpected error occurred",
        code: error.code || "UNKNOWN_ERROR",
        timestamp: new Date().toISOString(),
        details: {
          audioSize: audioToProcess.size,
          mode: selectedMode,
          userAgent: navigator.userAgent,
        },
      }

      setError(errorDetails)
    } finally {
      setIsProcessing(false)
      setProcessingStep("")
    }
  }

  const resetRecording = () => {
    if (isRecording) {
      stopRecording()
    }
    setSelectedMode(null)
    setAudioBlob(null)
    setIsRecording(false)
    setError(null)
    setRecordingTime(0)
  }

  const retryRecording = () => {
    setAudioBlob(null)
    setError(null)
    setRecordingTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Show full-screen loading during processing
  if (isProcessing) {
    return <LoadingScreen message={processingStep || "Transcribing..."} />
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {!selectedMode ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-black mb-4">{translations.recording.chooseMode}</h1>
              <p className="text-gray-600 text-sm sm:text-base">{translations.recording.chooseModeDesc}</p>
            </div>

            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6">
              <Card
                className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 transform hover:scale-105"
                onClick={() => handleModeSelect("text")}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-black rounded-2xl flex items-center justify-center mb-4 transform transition-transform duration-300 hover:rotate-12">
                    <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl text-black">{translations.recording.talkToText}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center text-sm sm:text-base">
                    {translations.recording.talkToTextDesc}
                  </p>
                </CardContent>
              </Card>

              <Card
                className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 transform hover:scale-105"
                onClick={() => handleModeSelect("calculate")}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-black rounded-2xl flex items-center justify-center mb-4 transform transition-transform duration-300 hover:rotate-12">
                    <Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl text-black">
                    {translations.recording.talkToCalculate}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center text-sm sm:text-base">
                    {translations.recording.talkToCalculateDesc}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header with back button */}
            <div className="flex items-center justify-between">
              <Button
                onClick={resetRecording}
                variant="outline"
                className="border-2 border-black text-black hover:bg-gray-100 transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {translations.recording.changeMode}
              </Button>
              <div className="text-center">
                <h2 className="text-xl font-bold text-black">
                  {selectedMode === "text" ? translations.recording.talkToText : translations.recording.talkToCalculate}
                </h2>
              </div>
              <div className="w-24"></div> {/* Spacer for centering */}
            </div>

            {/* Error Display */}
            {error && (
              <Alert className="border-2 border-red-500 bg-red-50 error-shake">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  <div className="space-y-1">
                    <p className="font-semibold">{error.message}</p>
                    {error.code && <p className="text-xs opacity-75">Error Code: {error.code}</p>}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Recording Interface */}
            <div className="flex flex-col items-center justify-center space-y-8 py-16">
              {/* Recording Visual Indicator */}
              {isRecording && (
                <div className="flex items-center justify-center space-x-4 mb-4">
                  {/* Blinking Recording Indicator */}
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse-slow"></div>
                    <span className="text-red-500 font-medium text-sm">
                      {language === "my" ? "မှတ်တမ်းတင်နေသည်" : "RECORDING"}
                    </span>
                  </div>
                </div>
              )}

              {/* Recording Timer */}
              {isRecording && (
                <div className="text-4xl font-mono font-bold text-red-500 animate-pulse">
                  {formatTime(recordingTime)}
                </div>
              )}

              {/* Recording Button */}
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-12 py-8 text-xl font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 rounded-xl ${
                  isRecording
                    ? "bg-red-500 text-white hover:bg-red-600 shadow-lg animate-pulse"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {isRecording ? (
                  <div className="flex items-center">
                    <Square className="w-6 h-6 mr-3" />
                    <span>{translations.recording.stopRecording}</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Mic className="w-6 h-6 mr-3" />
                    <span>{translations.recording.startRecording}</span>
                  </div>
                )}
              </Button>

              {/* Status Text */}
              <p className="text-gray-600 text-center max-w-md">
                {isRecording
                  ? language === "my"
                    ? "မှတ်တမ်းတင်နေပါသည်... ရပ်တန့်ရန် ခလုတ်ကို နှိပ်ပါ"
                    : "Recording in progress... Click to stop"
                  : language === "my"
                    ? "မှတ်တမ်းတင်ရန် ခလုတ်ကို နှိပ်ပါ"
                    : "Click to start recording"}
              </p>

              {/* Retry Button */}
              {error && (
                <Button
                  onClick={retryRecording}
                  className="bg-black text-white border-2 border-black hover:bg-gray-800 transition-all duration-200 hover:scale-105"
                >
                  {language === "my" ? "ပြန်လည်ကြိုးစားရန်" : "Try Again"}
                </Button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black bg-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            Made with 💙 by <span className="font-semibold text-black">Phyo Zin Ko</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
