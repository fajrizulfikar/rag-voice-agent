"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Square } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceButtonProps {
  onStartListening: () => void
  onStopListening: () => void
  disabled?: boolean
  className?: string
}

export function VoiceButton({ onStartListening, onStopListening, disabled = false, className }: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false)

  const handleToggle = () => {
    if (isListening) {
      setIsListening(false)
      onStopListening()
    } else {
      setIsListening(true)
      onStartListening()
    }
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={disabled}
      size="lg"
      className={cn(
        "relative rounded-full w-12 h-12 p-0 transition-all duration-200",
        isListening && "animate-pulse bg-destructive hover:bg-destructive/90",
        className,
      )}
    >
      {isListening ? (
        <Square className="h-5 w-5" />
      ) : disabled ? (
        <MicOff className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}

      {isListening && <div className="absolute inset-0 rounded-full bg-destructive/20 animate-ping" />}
    </Button>
  )
}
