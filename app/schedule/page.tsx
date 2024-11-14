"use client"

import { useState, useEffect } from 'react'
import RetroGrid from "@/components/ui/retro-grid"
import BlurFade from "@/components/ui/blur-fade"
import { RainbowButton } from "@/components/ui/rainbow-button"
import Link from 'next/link'
import { AnimatedList } from "@/components/ui/animated-list"

// 定义事项类型
interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  completed: boolean;
  createdAt: string;
  reminders: string[];  // 提醒时间点
  tags: string[];       // 标签
  repeat?: {           // 重复设置
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
  }
}

// 视图类型
type ViewType = 'day' | 'week' | 'month' | 'list';

// 分类颜色映射
const categoryColors = {
  work: 'bg-blue-100 border-blue-500',
  personal: 'bg-green-100 border-green-500',
  study: 'bg-purple-100 border-purple-500',
  health: 'bg-red-100 border-red-500',
  other: 'bg-gray-100 border-gray-500',
};

export default function SchedulePage() {
  // 状态管理
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [view, setView] = useState<ViewType>('week')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [categories, setCategories] = useState(['work', 'personal', 'study', 'health', 'other'])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSchedule, setNewSchedule] = useState<Partial<ScheduleItem>>({
    priority: 'medium',
    category: 'other',
    completed: false,
    tags: [],
    reminders: []
  })

  // 从 localStorage 加载数据
  useEffect(() => {
    const savedSchedules = localStorage.getItem('schedules')
    if (savedSchedules) {
      setSchedules(JSON.parse(savedSchedules))
    }
  }, [])

  // 保存数据到 localStorage
  useEffect(() => {
    localStorage.setItem('schedules', JSON.stringify(schedules))
  }, [schedules])

  // 添加新事项
  const handleAddSchedule = () => {
    if (!newSchedule.title || !newSchedule.deadline) return

    const schedule: ScheduleItem = {
      id: Date.now().toString(),
      title: newSchedule.title!,
      description: newSchedule.description || '',
      deadline: newSchedule.deadline!,
      priority: newSchedule.priority!,
      category: newSchedule.category!,
      completed: false,
      createdAt: new Date().toISOString(),
      reminders: newSchedule.reminders || [],
      tags: newSchedule.tags || [],
      repeat: newSchedule.repeat
    }

    setSchedules(prev => [...prev, schedule])
    setShowAddModal(false)
    setNewSchedule({
      priority: 'medium',
      category: 'other',
      completed: false,
      tags: [],
      reminders: []
    })
  }

  // 获取当前视图的事项
  const getCurrentViewSchedules = () => {
    const now = selectedDate
    let filteredSchedules = [...schedules]

    switch (view) {
      case 'day':
        filteredSchedules = schedules.filter(schedule => {
          const scheduleDate = new Date(schedule.deadline)
          return scheduleDate.toDateString() === now.toDateString()
        })
        break
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)

        filteredSchedules = schedules.filter(schedule => {
          const scheduleDate = new Date(schedule.deadline)
          return scheduleDate >= weekStart && scheduleDate <= weekEnd
        })
        break
      case 'month':
        filteredSchedules = schedules.filter(schedule => {
          const scheduleDate = new Date(schedule.deadline)
          return (
            scheduleDate.getMonth() === now.getMonth() &&
            scheduleDate.getFullYear() === now.getFullYear()
          )
        })
        break
      default:
        // list view shows all schedules
        break
    }

    // 按优先级和截止时间排序
    return filteredSchedules.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    })
  }

  // 渲染日视图
  const renderDayView = () => {
    const daySchedules = getCurrentViewSchedules()
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium sticky top-0 bg-white/50 backdrop-blur-sm p-2 rounded">
          {selectedDate.toLocaleDateString('zh-CN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h3>
        <AnimatedList className="space-y-3">
          {daySchedules.map(schedule => (
            <ScheduleCard key={schedule.id} schedule={schedule} />
          ))}
        </AnimatedList>
      </div>
    )
  }

  // 渲染周视图
  const renderWeekView = () => {
    const weekStart = new Date(selectedDate)
    weekStart.setDate(selectedDate.getDate() - selectedDate.getDay())
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, index) => {
            const date = new Date(weekStart)
            date.setDate(weekStart.getDate() + index)
            const daySchedules = schedules.filter(schedule => 
              new Date(schedule.deadline).toDateString() === date.toDateString()
            )

            return (
              <div key={index} className="space-y-2">
                <h4 className={`text-sm font-medium text-center p-2 rounded ${
                  date.toDateString() === new Date().toDateString() 
                    ? 'bg-blue-500 text-white' 
                    : ''
                }`}>
                  {date.toLocaleDateString('zh-CN', { weekday: 'short', day: 'numeric' })}
                </h4>
                <div className="min-h-[200px] bg-white/50 backdrop-blur-sm rounded-lg p-2">
                  <AnimatedList className="space-y-2">
                    {daySchedules.map(schedule => (
                      <ScheduleCard key={schedule.id} schedule={schedule} compact />
                    ))}
                  </AnimatedList>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // 渲染月视图
  const renderMonthView = () => {
    const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
    const startOffset = firstDay.getDay()
    const totalDays = lastDay.getDate()
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-center">
          {selectedDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="text-center font-medium py-2">
              {day}
            </div>
          ))}
          {Array.from({ length: 42 }).map((_, index) => {
            const dayNumber = index - startOffset + 1
            const isCurrentMonth = dayNumber > 0 && dayNumber <= totalDays
            const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), dayNumber)
            const daySchedules = schedules.filter(schedule => 
              isCurrentMonth && new Date(schedule.deadline).toDateString() === date.toDateString()
            )

            return (
              <div 
                key={index}
                className={`min-h-[100px] p-2 rounded-lg ${
                  isCurrentMonth ? 'bg-white/50 backdrop-blur-sm' : 'bg-gray-50/30'
                }`}
              >
                {isCurrentMonth && (
                  <>
                    <div className="text-sm font-medium">{dayNumber}</div>
                    <div className="space-y-1 mt-1">
                      {daySchedules.slice(0, 3).map(schedule => (
                        <div
                          key={schedule.id}
                          className={`text-xs truncate rounded px-1 ${
                            categoryColors[schedule.category as keyof typeof categoryColors]
                          }`}
                        >
                          {schedule.title}
                        </div>
                      ))}
                      {daySchedules.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{daySchedules.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // 渲染列表视图
  const renderListView = () => {
    const groupedSchedules = schedules.reduce((groups, schedule) => {
      const date = new Date(schedule.deadline).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(schedule)
      return groups
    }, {} as Record<string, ScheduleItem[]>)

    return (
      <div className="space-y-8">
        {Object.entries(groupedSchedules).map(([date, items]) => (
          <div key={date} className="space-y-4">
            <h3 className="text-lg font-medium sticky top-0 bg-white/50 backdrop-blur-sm p-2 rounded">
              {new Date(date).toLocaleDateString('zh-CN', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>
            <AnimatedList className="space-y-3">
              {items.map(schedule => (
                <ScheduleCard key={schedule.id} schedule={schedule} />
              ))}
            </AnimatedList>
          </div>
        ))}
      </div>
    )
  }

  // 事项卡片组件
  const ScheduleCard = ({ schedule, compact = false }: { schedule: ScheduleItem, compact?: boolean }) => {
    const priorityColors = {
      high: 'border-red-500',
      medium: 'border-yellow-500',
      low: 'border-green-500'
    }

    return (
      <div 
        className={`
          ${categoryColors[schedule.category as keyof typeof categoryColors]}
          ${priorityColors[schedule.priority]}
          border-l-4 rounded-lg p-3 hover:shadow-md transition-all
          ${schedule.completed ? 'opacity-60' : ''}
          backdrop-blur-sm bg-white/40
        `}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={schedule.completed}
                onChange={() => {
                  setSchedules(prev => prev.map(s => 
                    s.id === schedule.id ? { ...s, completed: !s.completed } : s
                  ))
                }}
                className="rounded"
              />
              <h4 className={`font-medium ${schedule.completed ? 'line-through' : ''}`}>
                {schedule.title}
              </h4>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                schedule.priority === 'high' ? 'bg-red-100 text-red-700' :
                schedule.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {schedule.priority === 'high' ? '高优' :
                 schedule.priority === 'medium' ? '中优' : '低优'}
              </span>
            </div>
            {!compact && (
              <>
                <p className="text-sm text-gray-600">{schedule.description}</p>
                <div className="flex flex-wrap gap-1">
                  {schedule.tags.map(tag => (
                    <span 
                      key={tag}
                      className="text-xs bg-white/50 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="text-right space-y-1">
            <div className="text-xs text-gray-500">
              {new Date(schedule.deadline).toLocaleString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div className="text-xs px-2 py-0.5 rounded bg-white/50">
              {schedule.category}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <RetroGrid className="fixed inset-0" />

      <div className="relative p-8">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/bento">
            <RainbowButton>
              返回功能导航
            </RainbowButton>
          </Link>
          <h1 className="text-2xl font-bold">日程管理</h1>
          <RainbowButton onClick={() => setShowAddModal(true)}>
            添加事项
          </RainbowButton>
        </div>

        {/* 视图切换和日期导航 */}
        <div className="mb-8">
          <BlurFade>
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {(['day', 'week', 'month', 'list'] as ViewType[]).map(viewType => (
                    <button
                      key={viewType}
                      onClick={() => setView(viewType)}
                      className={`px-4 py-2 rounded-lg ${
                        view === viewType
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/50 hover:bg-white/80'
                      }`}
                    >
                      {viewType === 'day' && '日'}
                      {viewType === 'week' && '周'}
                      {viewType === 'month' && '月'}
                      {viewType === 'list' && '列表'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedDate)
                      if (view === 'day') newDate.setDate(newDate.getDate() - 1)
                      if (view === 'week') newDate.setDate(newDate.getDate() - 7)
                      if (view === 'month') newDate.setMonth(newDate.getMonth() - 1)
                      setSelectedDate(newDate)
                    }}
                    className="p-2 rounded-lg bg-white/50 hover:bg-white/80"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="px-4 py-2 rounded-lg bg-white/50 hover:bg-white/80"
                  >
                    今天
                  </button>
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedDate)
                      if (view === 'day') newDate.setDate(newDate.getDate() + 1)
                      if (view === 'week') newDate.setDate(newDate.getDate() + 7)
                      if (view === 'month') newDate.setMonth(newDate.getMonth() + 1)
                      setSelectedDate(newDate)
                    }}
                    className="p-2 rounded-lg bg-white/50 hover:bg-white/80"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </BlurFade>
        </div>

        {/* 主要内容区域 */}
        <BlurFade>
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6">
            {view === 'day' && renderDayView()}
            {view === 'week' && renderWeekView()}
            {view === 'month' && renderMonthView()}
            {view === 'list' && renderListView()}
          </div>
        </BlurFade>

        {/* 添加事项模态框 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">添加新事项</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">标题</label>
                  <input
                    type="text"
                    value={newSchedule.title || ''}
                    onChange={e => setNewSchedule(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-2 rounded border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">描述</label>
                  <textarea
                    value={newSchedule.description || ''}
                    onChange={e => setNewSchedule(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2 rounded border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">截止时间</label>
                  <input
                    type="datetime-local"
                    value={newSchedule.deadline || ''}
                    onChange={e => setNewSchedule(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full p-2 rounded border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">优先级</label>
                  <select
                    value={newSchedule.priority}
                    onChange={e => setNewSchedule(prev => ({ 
                      ...prev, 
                      priority: e.target.value as 'high' | 'medium' | 'low' 
                    }))}
                    className="w-full p-2 rounded border"
                  >
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">分类</label>
                  <select
                    value={newSchedule.category}
                    onChange={e => setNewSchedule(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 rounded border"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">标签</label>
                  <input
                    type="text"
                    placeholder="用逗号分隔多个标签"
                    value={newSchedule.tags?.join(', ')}
                    onChange={e => setNewSchedule(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(tag => tag.trim()) 
                    }))}
                    className="w-full p-2 rounded border"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    取消
                  </button>
                  <RainbowButton onClick={handleAddSchedule}>
                    添加
                  </RainbowButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 