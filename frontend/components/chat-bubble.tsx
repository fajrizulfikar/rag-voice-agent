import { cn } from "@/lib/utils"
import type { Message } from "@/types"
import { AudioPlayer } from "./audio-player"

interface ChatBubbleProps {
  message: Message
  className?: string
}

export function ChatBubble({ message, className }: ChatBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex w-full mb-4", isUser ? "justify-end" : "justify-start", className)}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3 shadow-sm",
          isUser ? "bg-primary text-primary-foreground ml-12" : "bg-card text-card-foreground mr-12",
        )}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>
        <div className="flex items-center justify-between mt-2 gap-2">
          <span className="text-xs opacity-70">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {!isUser && message.audioUrl && <AudioPlayer audioUrl={message.audioUrl} />}
        </div>
      </div>
    </div>
  )
}
