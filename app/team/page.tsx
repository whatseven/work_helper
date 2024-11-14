"use client"

import { useState, useEffect } from 'react'
import RetroGrid from "@/components/ui/retro-grid"
import BlurFade from "@/components/ui/blur-fade"
import { RainbowButton } from "@/components/ui/rainbow-button"
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  joinDate: string;
  projects: string[];
  skills: string[];
  notes: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState({
    department: '',
    role: '',
    status: ''
  })
  const [sortConfig, setSortConfig] = useState({
    key: 'name' as keyof TeamMember,
    direction: 'asc' as 'asc' | 'desc'
  })
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    name: '',
    role: '',
    department: '',
    email: '',
    phone: '',
    status: 'active',
    joinDate: new Date().toISOString().split('T')[0],
    projects: [],
    skills: [],
    notes: ''
  })

  // 从 localStorage 加载数据
  useEffect(() => {
    const savedMembers = localStorage.getItem('teamMembers')
    if (savedMembers) {
      setMembers(JSON.parse(savedMembers))
    }
  }, [])

  // 保存数据到 localStorage
  useEffect(() => {
    localStorage.setItem('teamMembers', JSON.stringify(members))
  }, [members])

  // 添加新成员
  const handleAddMember = (member: Omit<TeamMember, 'id'>) => {
    const newMember: TeamMember = {
      ...member,
      id: Date.now().toString()
    }
    setMembers(prev => [...prev, newMember])
    setShowAddModal(false)
  }

  // 更新成员信息
  const handleUpdateMember = (member: TeamMember) => {
    setMembers(prev => prev.map(m => 
      m.id === member.id ? member : m
    ))
    setSelectedMember(null)
    setEditMode(false)
  }

  // 删除成员
  const handleDeleteMember = (id: string) => {
    if (window.confirm('确定要删除该成员吗？')) {
      setMembers(prev => prev.filter(m => m.id !== id))
      setSelectedMember(null)
    }
  }

  // 导出成员数据
  const handleExport = () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(members.map(member => ({
      姓名: member.name,
      角色: member.role,
      部门: member.department,
      邮箱: member.email,
      电话: member.phone,
      状态: member.status === 'active' ? '在职' : '离职',
      入职日期: member.joinDate,
      项目: member.projects.join(', '),
      技能: member.skills.join(', '),
      备注: member.notes
    })))

    // 设置列宽
    ws['!cols'] = [
      { wch: 10 }, // 姓名
      { wch: 10 }, // 角色
      { wch: 15 }, // 部门
      { wch: 25 }, // 邮箱
      { wch: 15 }, // 电话
      { wch: 8 },  // 状态
      { wch: 12 }, // 入职日期
      { wch: 30 }, // 项目
      { wch: 30 }, // 技能
      { wch: 20 }  // 备注
    ]

    XLSX.utils.book_append_sheet(wb, ws, "团队成员")
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `团队成员_${new Date().toLocaleDateString()}.xlsx`)
  }

  // 导入成员数据
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        
        // 转换导入的数据格式
        const importedMembers: TeamMember[] = jsonData.map((row: any) => ({
          id: Date.now().toString() + Math.random(),
          name: row.姓名,
          role: row.角色,
          department: row.部门,
          email: row.邮箱,
          phone: row.电话,
          status: row.状态 === '在职' ? 'active' : 'inactive',
          joinDate: row.入职日期,
          projects: row.项目?.split(',').map((p: string) => p.trim()) || [],
          skills: row.技能?.split(',').map((s: string) => s.trim()) || [],
          notes: row.备注 || ''
        }))

        setMembers(prev => [...prev, ...importedMembers])
      }
      reader.readAsBinaryString(file)
    }
  }

  // 过滤和排序成员列表
  const getFilteredAndSortedMembers = () => {
    return members
      .filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filter.department ? member.department === filter.department : true) &&
        (filter.role ? member.role === filter.role : true) &&
        (filter.status ? member.status === filter.status : true)
      )
      .sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        if (sortConfig.direction === 'asc') {
          return aValue < bValue ? -1 : 1
        } else {
          return aValue > bValue ? -1 : 1
        }
      })
  }

  // 添加成员模态框
  const AddMemberModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">
          {editMode ? '编辑成员' : '添加成员'}
        </h2>
        <div className="space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">姓名</label>
              <input
                type="text"
                value={newMember.name || ''}
                onChange={e => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 rounded border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">角色</label>
              <input
                type="text"
                value={newMember.role || ''}
                onChange={e => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                className="w-full p-2 rounded border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">部门</label>
              <input
                type="text"
                value={newMember.department || ''}
                onChange={e => setNewMember(prev => ({ ...prev, department: e.target.value }))}
                className="w-full p-2 rounded border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">状态</label>
              <select
                value={newMember.status || 'active'}
                onChange={e => setNewMember(prev => ({ 
                  ...prev, 
                  status: e.target.value as 'active' | 'inactive' 
                }))}
                className="w-full p-2 rounded border"
              >
                <option value="active">在职</option>
                <option value="inactive">离职</option>
              </select>
            </div>
          </div>

          {/* 联系方式 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">邮箱</label>
              <input
                type="email"
                value={newMember.email || ''}
                onChange={e => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-2 rounded border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">电话</label>
              <input
                type="tel"
                value={newMember.phone || ''}
                onChange={e => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full p-2 rounded border"
              />
            </div>
          </div>

          {/* 入职日期 */}
          <div>
            <label className="block text-sm font-medium mb-1">入职日期</label>
            <input
              type="date"
              value={newMember.joinDate || ''}
              onChange={e => setNewMember(prev => ({ ...prev, joinDate: e.target.value }))}
              className="w-full p-2 rounded border"
            />
          </div>

          {/* 项目和技能 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">项目（用逗号分隔）</label>
              <input
                type="text"
                value={newMember.projects?.join(', ') || ''}
                onChange={e => setNewMember(prev => ({ 
                  ...prev, 
                  projects: e.target.value.split(',').map(p => p.trim()).filter(Boolean)
                }))}
                className="w-full p-2 rounded border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">技能（用逗号分隔）</label>
              <input
                type="text"
                value={newMember.skills?.join(', ') || ''}
                onChange={e => setNewMember(prev => ({ 
                  ...prev, 
                  skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                }))}
                className="w-full p-2 rounded border"
              />
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium mb-1">备注</label>
            <textarea
              value={newMember.notes || ''}
              onChange={e => setNewMember(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full p-2 rounded border h-24"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => {
              setShowAddModal(false)
              setEditMode(false)
              setSelectedMember(null)
              setNewMember({
                status: 'active',
                joinDate: new Date().toISOString().split('T')[0],
                projects: [],
                skills: []
              })
            }}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
          >
            取消
          </button>
          <RainbowButton onClick={() => {
            if (editMode && selectedMember) {
              handleUpdateMember({
                ...selectedMember,
                ...newMember,
                id: selectedMember.id
              })
            } else {
              handleAddMember(newMember as Omit<TeamMember, 'id'>)
            }
          }}>
            {editMode ? '保存' : '添加'}
          </RainbowButton>
        </div>
      </div>
    </div>
  )

  // 修改编辑功能
  useEffect(() => {
    if (selectedMember && editMode) {
      setNewMember(selectedMember)
    }
  }, [selectedMember, editMode])

  // 修改表格部分
  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left">姓名</th>
            <th className="px-4 py-2 text-left">角色</th>
            <th className="px-4 py-2 text-left">部门</th>
            <th className="px-4 py-2 text-left">邮箱</th>
            <th className="px-4 py-2 text-left">电话</th>
            <th className="px-4 py-2 text-left">状态</th>
            <th className="px-4 py-2 text-left">入职日期</th>
            <th className="px-4 py-2 text-left">项目</th>
            <th className="px-4 py-2 text-left">技能</th>
            <th className="px-4 py-2 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          {getFilteredAndSortedMembers().map(member => (
            <tr 
              key={member.id}
              className="border-t hover:bg-gray-50"
            >
              <td className="px-4 py-2">{member.name}</td>
              <td className="px-4 py-2">{member.role}</td>
              <td className="px-4 py-2">{member.department}</td>
              <td className="px-4 py-2">{member.email}</td>
              <td className="px-4 py-2">{member.phone}</td>
              <td className="px-4 py-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  member.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {member.status === 'active' ? '在职' : '离职'}
                </span>
              </td>
              <td className="px-4 py-2">{member.joinDate}</td>
              <td className="px-4 py-2">
                <div className="flex flex-wrap gap-1">
                  {member.projects.map((project, index) => (
                    <span 
                      key={index}
                      className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full"
                    >
                      {project}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-2">
                <div className="flex flex-wrap gap-1">
                  {member.skills.map((skill, index) => (
                    <span 
                      key={index}
                      className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedMember(member)
                      setEditMode(true)
                      setShowAddModal(true)
                    }}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    删除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

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
          <h1 className="text-2xl font-bold">团队管理</h1>
          <div className="flex gap-2">
            <RainbowButton onClick={() => setShowAddModal(true)}>
              添加成员
            </RainbowButton>
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <label htmlFor="import-file">
                <RainbowButton as="span">
                  导入
                </RainbowButton>
              </label>
            </div>
            <RainbowButton onClick={handleExport}>
              导出
            </RainbowButton>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="mb-6">
          <BlurFade>
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索成员..."
                  className="flex-1 p-2 rounded border"
                />
                <select
                  value={filter.department}
                  onChange={(e) => setFilter(prev => ({ ...prev, department: e.target.value }))}
                  className="p-2 rounded border"
                >
                  <option value="">所有部门</option>
                  {Array.from(new Set(members.map(m => m.department))).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <select
                  value={filter.role}
                  onChange={(e) => setFilter(prev => ({ ...prev, role: e.target.value }))}
                  className="p-2 rounded border"
                >
                  <option value="">所有角色</option>
                  {Array.from(new Set(members.map(m => m.role))).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                  className="p-2 rounded border"
                >
                  <option value="">所有状态</option>
                  <option value="active">在职</option>
                  <option value="inactive">离职</option>
                </select>
              </div>
            </div>
          </BlurFade>
        </div>

        {/* 成员列表 */}
        <BlurFade>
          <div className="bg-white/50 backdrop-blur-sm rounded-lg overflow-hidden">
            {renderTable()}
          </div>
        </BlurFade>

        {/* 添加/编辑成员模态框 */}
        {(showAddModal || editMode) && <AddMemberModal />}
      </div>
    </div>
  )
} 