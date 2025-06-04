"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

interface AudioWaveformProps {
  isRecording: boolean
  onRecordingComplete: (blob: Blob) => void
  onRecordingStart: () => void
}

export default function AudioWaveform({ isRecording, onRecordingComplete, onRecordingStart }: AudioWaveformProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const [isRecordingState, setIsRecording] = useState(false)
  const [frequencyData, setFrequencyData] = useState<number[]>(new Array(20).fill(0))
  const [isInitializing, setIsInitializing] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)
  const [visualizationWorking, setVisualizationWorking] = useState(true)

  const { translations } = useLanguage()

  const startRecording = async () => {
    try {
      setIsInitializing(true)
      setIsRecording(true)
      setRecordingTime(0)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      })

      streamRef.current = stream

      // Set up MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })
      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        onRecordingComplete(blob)
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
        }
      }

      // Set up audio visualization
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 1024
      analyserRef.current.smoothingTimeConstant = 0.4
      source.connect(analyserRef.current)

      mediaRecorderRef.current.start(100)
      onRecordingStart()
      setIsInitializing(false)

      // Start recording timer
      const interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
      setTimerInterval(interval)

      // Start real-time frequency analysis
      updateFrequencyVisualization()
    } catch (error) {
      console.error("Error starting recording:", error)
      setIsRecording(false)
      setIsInitializing(false)
      throw new Error("Failed to access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    setIsRecording(false)

    // Clear timer
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close()
    }

    // Gradually fade out frequency data
    const fadeOut = () => {
      setFrequencyData((prev) => prev.map((value) => Math.max(0, value * 0.9)))
    }

    const fadeInterval = setInterval(() => {
      setFrequencyData((prev) => {
        const newData = prev.map((value) => Math.max(0, value * 0.85))
        if (Math.max(...newData) < 0.01) {
          clearInterval(fadeInterval)
          return new Array(20).fill(0)
        }
        return newData
      })
    }, 50)
  }

  const updateFrequencyVisualization = () => {
    if (!isRecordingState || !analyserRef.current) return

    try {
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      analyserRef.current.getByteFrequencyData(dataArray)

      // Analyze 20 frequency bands with logarithmic distribution
      const newFrequencyData = []
      for (let i = 0; i < 20; i++) {
        // Use logarithmic scale for better frequency representation
        const startFreq = Math.pow(2, (i / 20) * 10) // 1 to 1024
        const endFreq = Math.pow(2, ((i + 1) / 20) * 10)

        const startIndex = Math.floor((startFreq / 1024) * bufferLength)
        const endIndex = Math.floor((endFreq / 1024) * bufferLength)

        let sum = 0
        let count = 0
        for (let j = startIndex; j < Math.min(endIndex, bufferLength); j++) {
          sum += dataArray[j]
          count++
        }

        const average = count > 0 ? sum / count : 0
        const normalized = Math.min(1, average / 255) // Normalize to 0-1

        // Apply some smoothing and boost for better visual effect
        const boosted = Math.pow(normalized, 0.7) * 1.2
        newFrequencyData.push(Math.min(1, boosted))
      }

      // Check if visualization is working by detecting if there's any significant data
      const maxValue = Math.max(...newFrequencyData)
      if (maxValue > 0.1) {
        setVisualizationWorking(true)
      } else {
        // Only set to false after a few seconds of recording to avoid false negatives
        if (recordingTime > 3 && maxValue < 0.05) {
          setVisualizationWorking(false)
        }
      }

      setFrequencyData(newFrequencyData)

      if (isRecordingState) {
        animationRef.current = requestAnimationFrame(updateFrequencyVisualization)
      }
    } catch (error) {
      console.error("Error updating frequency visualization:", error)
      setVisualizationWorking(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [timerInterval])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 py-8">
      {/* Recording Timer */}
      {isRecordingState && (
        <div
          className={`mb-8 text-2xl font-mono font-bold ${
            visualizationWorking ? "text-gray-500" : "text-red-500 animate-pulse"
          }`}
        >
          {formatTime(recordingTime)}
        </div>
      )}

      {/* Frequency Visualization */}
      <div className="flex items-end justify-center space-x-2 sm:space-x-3 md:space-x-4 mb-12 sm:mb-16 md:mb-20 h-40 sm:h-48 md:h-56">
        {frequencyData.map((intensity, index) => {
          // Responsive line heights
          const maxHeight = window.innerWidth < 640 ? 120 : window.innerWidth < 768 ? 160 : 200
          const lineHeight = Math.max(4, intensity * maxHeight)
          const lineWidth = window.innerWidth < 640 ? 3 : window.innerWidth < 768 ? 4 : 5

          return (
            <div
              key={index}
              className={`transition-all duration-150 ease-out rounded-full ${
                intensity > 0.05 ? "bg-black" : "bg-gray-300"
              }`}
              style={{
                width: `${lineWidth}px`,
                height: `${lineHeight}px`,
                minHeight: "4px",
              }}
            />
          )
        })}
      </div>

      {/* Text-based Recording Button */}
      <Button
        onClick={isRecordingState ? stopRecording : startRecording}
        disabled={isInitializing}
        className={`relative px-8 py-6 text-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 rounded-md ${
          isRecordingState
            ? "bg-red-500 text-white hover:bg-red-600 shadow-lg animate-pulse"
            : "bg-black text-white hover:bg-gray-800"
        } ${isInitializing ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isInitializing ? (
          <div className="flex items-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            <span>Initializing...</span>
          </div>
        ) : isRecordingState ? (
          <div className="flex items-center">
            <Square className="w-5 h-5 mr-2" />
            <span>{translations.recording.stopRecording}</span>
          </div>
        ) : (
          <div className="flex items-center">
            <Mic className="w-5 h-5 mr-2" />
            <span>{translations.recording.startRecording}</span>
          </div>
        )}
      </Button>

      {/* Status Text */}
      <div className="mt-6 sm:mt-8 text-center">
        <p className="text-sm sm:text-base text-gray-600">
          {isInitializing
            ? "Initializing microphone..."
            : isRecordingState
              ? "Recording in progress..."
              : "Click to start recording"}
        </p>
      </div>
    </div>
  )
}
