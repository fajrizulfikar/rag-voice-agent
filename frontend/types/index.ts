export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  audioUrl?: string
}

export interface Document {
  id: string
  name: string
  type: "pdf" | "txt" | "markdown"
  uploadedAt: Date
  size: number
}

export interface QueryLog {
  id: string
  userQuestion: string
  aiAnswer: string
  timestamp: Date
}
