import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    console.log("Transcription request received")

    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const mode = formData.get("mode") as string
    const language = formData.get("language") as string

    // Validation
    if (!audioFile) {
      console.error("No audio file provided")
      return NextResponse.json(
        {
          error: "No audio file provided",
          code: "MISSING_AUDIO_FILE",
        },
        { status: 400 },
      )
    }

    if (audioFile.size === 0) {
      console.error("Empty audio file")
      return NextResponse.json(
        {
          error: "Audio file is empty",
          code: "EMPTY_AUDIO_FILE",
        },
        { status: 400 },
      )
    }

    if (audioFile.size > 25 * 1024 * 1024) {
      // 25MB limit
      console.error("Audio file too large:", audioFile.size)
      return NextResponse.json(
        {
          error: "Audio file too large. Maximum size is 25MB.",
          code: "FILE_TOO_LARGE",
        },
        { status: 400 },
      )
    }

    console.log("Audio file details:", {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
      mode,
      language,
    })

    // Get API key from headers
    const geminiKey = request.headers.get("x-gemini-key")
    if (!geminiKey) {
      console.error("Gemini API key not provided")
      return NextResponse.json(
        {
          error: "Gemini API key not provided",
          code: "MISSING_API_KEY",
        },
        { status: 400 },
      )
    }

    console.log("Initializing Gemini AI...")

    let genAI: GoogleGenerativeAI
    let model: any

    try {
      genAI = new GoogleGenerativeAI(geminiKey)
      model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
    } catch (error) {
      console.error("Failed to initialize Gemini AI:", error)
      return NextResponse.json(
        {
          error: "Invalid API key or failed to initialize AI service",
          code: "AI_INIT_ERROR",
        },
        { status: 401 },
      )
    }

    console.log("Converting audio to base64...")

    // Convert audio file to base64
    let audioBuffer: ArrayBuffer
    let audioBase64: string

    try {
      audioBuffer = await audioFile.arrayBuffer()
      audioBase64 = Buffer.from(audioBuffer).toString("base64")
      console.log("Audio conversion successful, base64 length:", audioBase64.length)
    } catch (error) {
      console.error("Failed to convert audio:", error)
      return NextResponse.json(
        {
          error: "Failed to process audio file",
          code: "AUDIO_PROCESSING_ERROR",
        },
        { status: 500 },
      )
    }

    // Prepare prompts based on mode
    const prompts = {
      text: 'မင်းက မြန်မာဘာသာ စကားကိုလေ့လာနေတာ ၁၀ နှစ်ရှိပြီ မြန်မာစကားကိုသူများပြောတာဆိုရင် ကောင်းကောင်းနားလည်တယ်။မြန်မာလိုလဲကောင်းကောင်းမွန်မွန်ရေးတတ်တယ်။ အခု ဒီ audio file [the record audio file user talk in burmese] ကို မြန်မာလိုပြန်ရေးပေးပါ။ စာလုံးပေါင်းမှန်မှန်ကန်ကန်နဲ့ audio file ထဲမှာပါနေတဲ့ စဉ်းစားတဲ့ အသံ "အာ, အဲ, အို" စတာတွေကို ဖယ်ပြီးတော့ရေးပေးပါ။ ကျွန်တော်ပြောတဲ့အတိုင်းတိတိကျကျရေးပေးပါ။',
      calculate:
        'မင်းက harvard university က math professor ၁၅ နှစ် အတွေ့အကြုံရှိတဲ့သူ။ ပြီးတော့ မြန်မာဘာသာ စကားကိုလေ့လာနေတာ ၁၀ နှစ်ရှိပြီ မြန်မာစကားကိုသူများပြောတာဆိုရင် ကောင်းကောင်းနားလည်တယ်။ မြန်မာလိုလဲ ကောင်းကောင်းမွန်မွန်ရေးတတ်တယ်။ အခု ဒီ audio file [the record audio file user talk in burmese and asking for calculation] ထဲမှာ ပါတဲ့ ဂဏန်းတွေကို တွက်ချက်ပေးပါ။ စာလုံးပေါင်းမှန်မှန်ကန်ကန်နဲ့ audio file ထဲကပြောတဲ့ဂဏန်းတွေကိုပဲသီးသန့် ချရေးပြီးတွက်ချက်ပေးပါ။ audio file ထဲမှာ ပါနေတဲ့ စဉ်းစားတဲ့ အသံ "အာ, အဲ, အို" စတာတွေကိုဖယ်ပြီးတော့ ရေးပေးပါ',
    }

    const prompt = prompts[mode as keyof typeof prompts] || prompts.text
    console.log("Using prompt for mode:", mode)

    console.log("Sending request to Gemini AI...")

    let result: any
    let response: any

    try {
      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: audioFile.type || "audio/webm",
            data: audioBase64,
          },
        },
      ])

      response = await result.response
      console.log("Gemini AI response received")
    } catch (error: any) {
      console.error("Gemini AI request failed:", error)

      let errorMessage = "AI transcription service failed"
      let errorCode = "AI_REQUEST_ERROR"

      if (error.message?.includes("API key")) {
        errorMessage = "Invalid API key"
        errorCode = "INVALID_API_KEY"
      } else if (error.message?.includes("quota")) {
        errorMessage = "API quota exceeded"
        errorCode = "QUOTA_EXCEEDED"
      } else if (error.message?.includes("safety")) {
        errorMessage = "Content blocked by safety filters"
        errorCode = "CONTENT_BLOCKED"
      }

      return NextResponse.json(
        {
          error: errorMessage,
          code: errorCode,
          details: error.message,
        },
        { status: 500 },
      )
    }

    let text: string

    try {
      text = response.text()
      console.log("Transcription text extracted, length:", text.length)
    } catch (error) {
      console.error("Failed to extract text from response:", error)
      return NextResponse.json(
        {
          error: "Failed to extract transcription text",
          code: "TEXT_EXTRACTION_ERROR",
        },
        { status: 500 },
      )
    }

    if (!text || text.trim().length === 0) {
      console.error("Empty transcription result")
      return NextResponse.json(
        {
          error: "No transcription generated. Audio may be unclear or too quiet.",
          code: "EMPTY_TRANSCRIPTION",
        },
        { status: 400 },
      )
    }

    const processingTime = Date.now() - startTime
    console.log("Transcription completed successfully:", {
      textLength: text.length,
      processingTime: `${processingTime}ms`,
      mode,
      audioSize: audioFile.size,
    })

    return NextResponse.json({
      text: text.trim(),
      metadata: {
        processingTime,
        audioSize: audioFile.size,
        mode,
        language,
      },
    })
  } catch (error: any) {
    const processingTime = Date.now() - startTime
    console.error("Unexpected transcription error:", error)

    return NextResponse.json(
      {
        error: "An unexpected error occurred during transcription",
        code: "UNEXPECTED_ERROR",
        details: error.message,
        processingTime,
      },
      { status: 500 },
    )
  }
}
