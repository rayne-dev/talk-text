"use client"

import { useEffect, useState } from "react"

interface LoadingScreenProps {
  message?: string
}

export default function LoadingScreen({ message = "Transcribing..." }: LoadingScreenProps) {
  const [dots, setDots] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return ""
        return prev + "."
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Main Loading Animation */}
        <div className="relative">
          {/* Outer rotating ring */}
          <div className="w-32 h-32 border-4 border-gray-200 rounded-full animate-spin">
            <div
              className="w-full h-full border-4 border-black border-t-transparent rounded-full animate-spin"
              style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
            ></div>
          </div>

          {/* Inner pulsing circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-black rounded-full animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Microphone icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-2xl">🎙️</div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-black">
            {message}
            <span className="inline-block w-8 text-left">{dots}</span>
          </h2>

          {/* Progress bars */}
          <div className="space-y-2">
            <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-black rounded-full animate-pulse" style={{ width: "60%" }}></div>
            </div>
            <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-600 rounded-full animate-pulse"
                style={{ width: "40%", animationDelay: "0.5s" }}
              ></div>
            </div>
          </div>

          <p className="text-gray-600 text-sm">Processing your audio with AI...</p>
        </div>

        {/* Floating particles animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-black rounded-full opacity-20 animate-bounce"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 40}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: "2s",
              }}
            />
          ))}
        </div>

        {/* Sound waves animation */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex items-end space-x-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-black rounded-full animate-pulse"
              style={{
                height: `${20 + Math.random() * 30}px`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: "1s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
