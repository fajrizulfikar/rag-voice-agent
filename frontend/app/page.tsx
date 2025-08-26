"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ChatBubble } from "@/components/chat-bubble"
import { VoiceButton } from "@/components/voice-button"
import type { Message } from "@/types"
import { Send, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { apiClient } from "@/lib/api-client"

// Mock API functions (will be replaced with real API calls in Stage 2)
const mockSendMessage = async (content: string): Promise<Message> => {
  try {
    // Test backend connectivity
    const healthCheck = await apiClient.healthCheck();
    console.log('Backend health:', healthCheck.data);
  } catch (error) {
    console.warn('Backend not available, using mock response:', error);
  }

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    id: Date.now().toString(),
    content: `This is a mock response to: "${content}". Backend connectivity has been tested. In Stage 2, this will be processed by the RAG system and return relevant information from your knowledge base.`,
    role: "assistant",
    timestamp: new Date(),
    audioUrl: "/placeholder-audio.mp3", // Mock audio URL
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const aiResponse = await mockSendMessage(content)
      setMessages((prev) => [...prev, aiResponse])
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage(inputValue)
  }

  const handleStartListening = () => {
    setIsListening(true)
    // Mock voice recognition - in real implementation, use Web Speech API
    setTimeout(() => {
      const mockTranscript = "This is a mock voice input. How can you help me today?"
      setInputValue(mockTranscript)
      setIsListening(false)
    }, 3000)
  }

  const handleStopListening = () => {
    setIsListening(false)
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Voice-Powered FAQ Assistant</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/admin">Admin</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Card className="max-w-md">
                <CardContent className="p-6 text-center">
                  <h2 className="text-lg font-medium mb-2">Welcome to your FAQ Assistant</h2>
                  <p className="text-muted-foreground text-sm">
                    Ask me anything using voice or text. I&apos;ll help you find the information you need.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-card text-card-foreground rounded-lg px-4 py-3 mr-12">
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse flex space-x-1">
                        <div className="rounded-full bg-muted-foreground/50 h-2 w-2"></div>
                        <div className="rounded-full bg-muted-foreground/50 h-2 w-2"></div>
                        <div className="rounded-full bg-muted-foreground/50 h-2 w-2"></div>
                      </div>
                      <span className="text-xs text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isListening ? "Listening..." : "Type your question or use voice input..."}
                disabled={isLoading || isListening}
                className="min-h-[44px] resize-none"
              />
            </div>
            <VoiceButton
              onStartListening={handleStartListening}
              onStopListening={handleStopListening}
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading || isListening}
              size="lg"
              className="h-12 px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
