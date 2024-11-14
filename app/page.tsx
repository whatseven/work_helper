"use client"

import { useState, useEffect } from 'react'
import Marquee from "@/components/ui/marquee"
import { RainbowButton } from "@/components/ui/rainbow-button"
import { AnimatedList } from "@/components/ui/animated-list"
import { ConfettiButton } from "@/components/ui/confetti"
import BlurFade from "@/components/ui/blur-fade"
import RetroGrid from "@/components/ui/retro-grid"
import Image from 'next/image'
import Link from 'next/link'

interface TodoItem {
  id: number;
  content: string;
  deadline: string;
  completed: boolean;
  createdAt: string;
}

export default function Page() {
  const [avatar, setAvatar] = useState('/default-avatar.png')
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [deadline, setDeadline] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // 从 localStorage 加载待办事项
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos')
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos))
    }
  }, [])

  // 保存待办事项到 localStorage
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  // 清理过期的待办事项
  useEffect(() => {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    setTodos(prevTodos => 
      prevTodos.filter(todo => {
        const createdDate = new Date(todo.createdAt)
        return createdDate > oneDayAgo || !todo.completed
      })
    )
  }, [])

  // 处理头像上传
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // 添加新的提醒事项
  const handleAddTodo = () => {
    if (newTodo && deadline) {
      setTodos([
        ...todos,
        {
          id: Date.now(),
          content: newTodo,
          deadline: deadline,
          completed: false,
          createdAt: new Date().toISOString()
        }
      ])
      setNewTodo('')
      setDeadline('')
    }
  }

  // 处理待办事项完成状态
  const handleTodoComplete = (id: number) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    )
  }

  // 确认删除已完成的待办事项
  const handleConfirmDelete = (id: number) => {
    if (window.confirm('确认删除该事项？')) {
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id))
    }
  }

  // 按截止时间排序的待办事项
  const sortedTodos = [...todos].sort((a, b) => 
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  )

  // 计算总页数
  const totalPages = Math.ceil(sortedTodos.length / itemsPerPage)
  
  // 获取当前页的待办事项
  const getCurrentPageTodos = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedTodos.slice(startIndex, endIndex)
  }

  // 页面导航函数
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  return (
    <div className="relative min-h-screen">
      <RetroGrid className="fixed inset-0" />

      <div className="relative p-8 space-y-12">
        {/* 个人信息区域 */}
        <section>
          <BlurFade>
            <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm rounded-lg p-4">
              <div className="relative w-20 h-20">
                <Image
                  src={avatar}
                  alt="用户头像"
                  fill
                  className="rounded-full object-cover"
                />
                <label className="absolute bottom-0 right-0 cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                  <span className="bg-primary text-white rounded-full p-1 text-xs">
                    更换头像
                  </span>
                </label>
              </div>
              <div>
                <h1 className="text-2xl font-bold">我的AI助手</h1>
                <p className="text-gray-600">让我来帮您管理日程</p>
              </div>
            </div>
          </BlurFade>
        </section>

        {/* 日常事项 */}
        <section>
          <BlurFade>
            <h2 className="text-2xl font-bold mb-4">日常事项</h2>
            <div className="space-y-8">
              <Marquee className="bg-white/50 backdrop-blur-sm rounded-lg h-12" pauseOnHover>
                <div className="flex items-center gap-8 px-4">
                  {sortedTodos.slice(0, 4).map(todo => (
                    <span key={todo.id}>
                      {todo.content} (截止: {new Date(todo.deadline).toLocaleDateString()}) 
                    </span>
                  ))}
                </div>
              </Marquee>
            </div>
          </BlurFade>
        </section>

        {/* 添加提醒事项 */}
        <section>
          <BlurFade delay={0.2}>
            <h2 className="text-2xl font-bold mb-4">添加提醒事项</h2>
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 space-y-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  placeholder="输入提醒事项..."
                  className="flex-1 p-2 rounded border"
                />
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="p-2 rounded border"
                />
                <RainbowButton onClick={handleAddTodo}>
                  添加
                </RainbowButton>
              </div>
            </div>
          </BlurFade>
        </section>

        {/* 所有提醒事项列表 */}
        <section>
          <BlurFade delay={0.4}>
            <h2 className="text-2xl font-bold mb-4">提醒事项列表</h2>
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
              <div className="w-full max-w-2xl space-y-4">
                {getCurrentPageTodos().length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    暂无提醒事项，请添加新的事项
                  </div>
                ) : (
                  getCurrentPageTodos().map(todo => (
                    <div 
                      key={todo.id} 
                      className={`w-full p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all ${
                        todo.completed ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleTodoComplete(todo.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            todo.completed 
                              ? 'border-green-500 bg-green-500 text-white' 
                              : 'border-gray-400'
                          }`}
                        >
                          {todo.completed && (
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-4 w-4" 
                              viewBox="0 0 20 20" 
                              fill="currentColor"
                            >
                              <path 
                                fillRule="evenodd" 
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                                clipRule="evenodd" 
                              />
                            </svg>
                          )}
                        </button>
                        
                        <div className="flex-1">
                          <p className={`text-lg ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                            {todo.content}
                          </p>
                          <p className="text-sm text-gray-600">
                            截止时间: {new Date(todo.deadline).toLocaleString()}
                          </p>
                        </div>

                        {todo.completed && (
                          <button 
                            onClick={() => handleConfirmDelete(todo.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            确认删除
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 分页控制 */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded ${
                        currentPage === pageNum 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white/80'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              )}
            </div>
          </BlurFade>
        </section>

        {/* 添加事务小助理按钮 */}
        <section className="fixed bottom-8 right-8">
          <BlurFade delay={0.6}>
            <Link href="/assistant">
              <RainbowButton className="group relative">
                <span className="flex items-center gap-2">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  事务小助理
                </span>
                <span className="absolute -top-8 right-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  点击开始对话
                </span>
              </RainbowButton>
            </Link>
          </BlurFade>
        </section>

        {/* 添加功能导航按钮 */}
        <section className="fixed bottom-8 left-8">
          <BlurFade delay={0.6}>
            <Link href="/bento">
              <RainbowButton className="group relative">
                <span className="flex items-center gap-2">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2V7h-3v5H5V5z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  功能导航
                </span>
                <span className="absolute -top-8 right-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  查看所有功能
                </span>
              </RainbowButton>
            </Link>
          </BlurFade>
        </section>
      </div>
    </div>
  )
}
