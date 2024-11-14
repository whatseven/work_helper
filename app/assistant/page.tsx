"use client"

import { useState, useRef, useEffect } from 'react'
import RetroGrid from "@/components/ui/retro-grid"
import BlurFade from "@/components/ui/blur-fade"
import { RainbowButton } from "@/components/ui/rainbow-button"
import Link from 'next/link'
import { chatWithAI } from '@/lib/ai'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '你好！我是你的AI助理，有什么我可以帮你的吗？'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = { role: 'user' as const, content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const aiResponse = await chatWithAI([...messages, userMessage])
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }])
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: '抱歉，我遇到了一些问题。请稍后再试。' 
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen">
      <RetroGrid className="fixed inset-0" />

      <div className="relative flex flex-col h-screen p-4">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/">
            <RainbowButton>
              返回主页
            </RainbowButton>
          </Link>
          <h1 className="text-2xl font-bold">AI助理对话</h1>
          <div className="w-[100px]" />
        </div>

        {/* 聊天区域 */}
        <div className="flex-1 bg-white/50 backdrop-blur-sm rounded-lg p-4 mb-4 overflow-y-auto">
          <BlurFade>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-white/80 rounded-bl-none'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-4 rounded-lg bg-white/80 rounded-bl-none">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </BlurFade>
        </div>

        {/* 输入区域 */}
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="输入您的问题..."
              disabled={isLoading}
              className="flex-1 p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <RainbowButton 
              onClick={handleSendMessage}
              disabled={isLoading}
            >
              {isLoading ? '发送中...' : '发送'}
            </RainbowButton>
          </div>
        </div>
      </div>
    </div>
  )
} 