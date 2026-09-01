import { Search, Mic, MicOff, Loader2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function BuildMartSearchBar({ onSearch }) {
  const [query, setQuery] = useState('')
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  const handleVoiceSearch = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser. Please try Chrome or Edge.')
      return
    }

    // Toggle off if already listening
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop()
      setListening(false)
      return
    }

    try {
      // Prompt user for microphone access if needed
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true })
      }

      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = navigator.language || 'hi-IN'

      recognition.onstart = () => {
        setListening(true)
      }

      recognition.onresult = (event) => {
        let currentTranscript = ''
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript
        }
        if (currentTranscript) {
          setQuery(currentTranscript)
          onSearch?.(currentTranscript)
        }
      }

      recognition.onerror = (event) => {
        console.warn('Speech recognition event/error:', event.error)
        setListening(false)
        if (event.error === 'not-allowed') {
          alert('Microphone permission was denied. Please allow microphone access in your browser settings.')
        }
      }

      recognition.onend = () => {
        setListening(false)
      }

      recognition.start()
    } catch (err) {
      console.error('Error starting voice recognition:', err)
      setListening(false)
      alert('Could not access microphone. Please check your browser permissions.')
    }
  }

  return (
    <div className="mx-4 mt-3 mb-2">
      <div className={`relative flex h-12 w-full items-center rounded-2xl border bg-white px-3.5 shadow-xs transition ${
        listening 
          ? 'border-red-400 ring-2 ring-red-100' 
          : 'border-slate-200/90 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100'
      }`}>
        <Search className="mr-2.5 h-5 w-5 shrink-0 text-slate-400" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            onSearch?.(e.target.value)
          }}
          placeholder={listening ? "Listening... Speak now" : "Search for Cement, Pipes, Tiling..."} 
          className="flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
        />
        <button
          type="button"
          onClick={handleVoiceSearch}
          title={listening ? "Stop listening" : "Start voice search"}
          aria-label="Voice search"
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
            listening
              ? 'bg-red-500 text-white animate-pulse shadow-sm'
              : 'text-slate-500 hover:bg-slate-100 hover:text-emerald-600'
          }`}
        >
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
