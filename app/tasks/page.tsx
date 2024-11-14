"use client"

import { useState, useEffect } from 'react'
import RetroGrid from "@/components/ui/retro-grid"
import BlurFade from "@/components/ui/blur-fade"
import { RainbowButton } from "@/components/ui/rainbow-button"
import Link from 'next/link'
import { FlowChart } from "@/components/ui/flow-chart"
import { Node, Edge } from 'reactflow'
import 'reactflow/dist/style.css'

// 定义任务类型
interface Task {
  id: string;
  title: string;
  assignee: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  completed: boolean;
  description?: string;
  tags: string[];
}

export default function TasksPage() {
  // 状态管理
  const [tasks, setTasks] = useState<Task[]>([])
  const [editingCell, setEditingCell] = useState<{
    taskId: string;
    field: keyof Task;
  } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showFlowChart, setShowFlowChart] = useState(false)
  const [flowNodes, setFlowNodes] = useState<Node[]>([])
  const [flowEdges, setFlowEdges] = useState<Edge[]>([])

  // 从 localStorage 加载数据
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks')
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    }
  }, [])

  // 保存数据到 localStorage
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  // 添加新任务
  const handleAddTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: '新任务',
      assignee: '',
      status: 'todo',
      priority: 'medium',
      dueDate: new Date().toISOString().split('T')[0],
      completed: false,
      tags: []
    }
    setTasks(prev => [...prev, newTask])
  }

  // 处理单元格编辑
  const handleCellEdit = (taskId: string, field: keyof Task) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setEditingCell({ taskId, field })
      setEditValue(task[field] as string)
    }
  }

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editingCell) return

    setTasks(prev => prev.map(task =>
      task.id === editingCell.taskId
        ? { ...task, [editingCell.field]: editValue }
        : task
    ))
    setEditingCell(null)
    setEditValue('')
  }

  // 切换任务完成状态
  const handleToggleComplete = (taskId: string) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId
        ? { ...task, completed: !task.completed }
        : task
    ))
  }

  // 在组件加载时读取保存的流程图数据
  useEffect(() => {
    const savedFlow = localStorage.getItem('taskFlow')
    if (savedFlow) {
      const { nodes, edges } = JSON.parse(savedFlow)
      setFlowNodes(nodes)
      setFlowEdges(edges)
    }
  }, [])

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
          <h1 className="text-2xl font-bold">任务追踪</h1>
          <div className="flex gap-2">
            <RainbowButton onClick={() => setShowFlowChart(!showFlowChart)}>
              {showFlowChart ? '切换到列表视图' : '切换到流程图'}
            </RainbowButton>
            <RainbowButton onClick={handleAddTask}>
              添加任务
            </RainbowButton>
          </div>
        </div>

        {/* 任务表格 */}
        {showFlowChart ? (
          <BlurFade>
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">工作流程图</h3>
              <FlowChart
                initialNodes={flowNodes}
                initialEdges={flowEdges}
                onSave={(nodes, edges) => {
                  setFlowNodes(nodes)
                  setFlowEdges(edges)
                  // 可以在这里将数据保存到 localStorage 或发送到服务器
                  localStorage.setItem('taskFlow', JSON.stringify({ nodes, edges }))
                }}
              />
            </div>
          </BlurFade>
        ) : (
          <BlurFade>
            <div className="bg-white/50 backdrop-blur-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">完成</th>
                      <th className="px-4 py-2 text-left">标题</th>
                      <th className="px-4 py-2 text-left">负责人</th>
                      <th className="px-4 py-2 text-left">状态</th>
                      <th className="px-4 py-2 text-left">优先级</th>
                      <th className="px-4 py-2 text-left">截止日期</th>
                      <th className="px-4 py-2 text-left">标签</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr 
                        key={task.id}
                        className={`border-t hover:bg-gray-50 ${
                          task.completed ? 'opacity-60' : ''
                        }`}
                      >
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleComplete(task.id)}
                            className="rounded"
                          />
                        </td>
                        <td 
                          className="px-4 py-2 cursor-pointer"
                          onClick={() => handleCellEdit(task.id, 'title')}
                        >
                          {editingCell?.taskId === task.id && editingCell.field === 'title' ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                              className="w-full p-1 rounded border"
                              autoFocus
                            />
                          ) : (
                            <span className={task.completed ? 'line-through' : ''}>
                              {task.title}
                            </span>
                          )}
                        </td>
                        <td 
                          className="px-4 py-2 cursor-pointer"
                          onClick={() => handleCellEdit(task.id, 'assignee')}
                        >
                          {editingCell?.taskId === task.id && editingCell.field === 'assignee' ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                              className="w-full p-1 rounded border"
                              autoFocus
                            />
                          ) : (
                            task.assignee || '未分配'
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={task.status}
                            onChange={(e) => {
                              setTasks(prev => prev.map(t =>
                                t.id === task.id
                                  ? { ...t, status: e.target.value as Task['status'] }
                                  : t
                              ))
                            }}
                            className="p-1 rounded border bg-transparent"
                          >
                            <option value="todo">待处理</option>
                            <option value="in_progress">进行中</option>
                            <option value="done">已完成</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={task.priority}
                            onChange={(e) => {
                              setTasks(prev => prev.map(t =>
                                t.id === task.id
                                  ? { ...t, priority: e.target.value as Task['priority'] }
                                  : t
                              ))
                            }}
                            className={`p-1 rounded border ${
                              task.priority === 'high' ? 'text-red-600' :
                              task.priority === 'medium' ? 'text-yellow-600' :
                              'text-green-600'
                            }`}
                          >
                            <option value="high">高</option>
                            <option value="medium">中</option>
                            <option value="low">低</option>
                          </select>
                        </td>
                        <td 
                          className="px-4 py-2 cursor-pointer"
                          onClick={() => handleCellEdit(task.id, 'dueDate')}
                        >
                          {editingCell?.taskId === task.id && editingCell.field === 'dueDate' ? (
                            <input
                              type="date"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              className="w-full p-1 rounded border"
                              autoFocus
                            />
                          ) : (
                            task.dueDate
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-1">
                            {task.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            <button
                              onClick={() => handleCellEdit(task.id, 'tags')}
                              className="text-xs text-blue-500"
                            >
                              +
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </BlurFade>
        )}
      </div>
    </div>
  )
} 