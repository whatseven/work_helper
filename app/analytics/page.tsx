"use client"

import { useState, useRef } from 'react'
import RetroGrid from "@/components/ui/retro-grid"
import BlurFade from "@/components/ui/blur-fade"
import { RainbowButton } from "@/components/ui/rainbow-button"
import Link from 'next/link'
import { Progress } from "@/components/ui/progress"
import mammoth from 'mammoth'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import { Document, Paragraph, Packer, TextRun, AlignmentType, convertInchesToTwip, ImageRun, Table, TableRow, TableCell } from 'docx'

interface ComparisonResult {
  onlyInList1: string[];
  onlyInList2: string[];
  duplicatesInBoth: { name: string; count: number }[];
}

interface FormatOptions {
  font: string
  fontSize: number
  lineSpacing: number
  paragraphSpacing: number
  firstLineIndent: number
}

interface PreviewData {
  text: string
  images: string[]
  tables: Array<Array<string>>
}

// 添加新的接口定义
interface DocumentElement {
  type: 'paragraph' | 'image'
  content?: string
  src?: string
  originalPosition: number
}

export default function AnalyticsPage() {
  const [list1, setList1] = useState('')
  const [list2, setList2] = useState('')
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [activeTab, setActiveTab] = useState<'compare' | 'seats' | 'format'>('compare')
  const [formatProgress, setFormatProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [formatOptions, setFormatOptions] = useState<FormatOptions>({
    font: '微软雅黑',
    fontSize: 24,
    lineSpacing: 2.2,
    paragraphSpacing: 10,
    firstLineIndent: 2
  })

  const processNameList = (text: string): string[] => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(name => name.replace(/\s+/g, ' ').trim())
  }

  const compareLists = () => {
    const names1 = processNameList(list1)
    const names2 = processNameList(list2)

    const onlyInList1 = names1.filter(name => !names2.includes(name))
    const onlyInList2 = names2.filter(name => !names1.includes(name))
    const allNames = [...names1, ...names2]
    const uniqueNames = Array.from(new Set(allNames))
    const duplicatesInBoth = uniqueNames
      .map(name => ({
        name,
        count: allNames.filter(n => n === name).length
      }))
      .filter(item => item.count > 1)
      .sort((a, b) => b.count - a.count)

    setResult({
      onlyInList1,
      onlyInList2,
      duplicatesInBoth
    })
  }

  const CHINESE_CHAR_WIDTH = 240 // 一个汉字的宽度约为240 twips
  const firstLineIndent = 2 * CHINESE_CHAR_WIDTH // 2个汉字的缩进

  const handleDocumentFormat = async (files: FileList) => {
    setIsProcessing(true)
    setFormatProgress(0)

    try {
      const totalFiles = files.length
      const processedDocs = []

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i]
        setFormatProgress((i / totalFiles) * 100)

        const arrayBuffer = await file.arrayBuffer()
        
        // 使用 transforms 选项来处理文档
        const result = await mammoth.convertToHtml({
          arrayBuffer,
          transformDocument: mammoth.transforms.paragraph((element) => {
            // 为每个段落添加一个自定义属性来标记位置
            element.alignment = element.alignment || 'left'
            return element
          }),
          convertImage: mammoth.images.imgElement((image) => {
            return image.read().then((imageBuffer) => {
              const base64 = Buffer.from(imageBuffer).toString('base64')
              return {
                src: `data:${image.contentType};base64,${base64}`,
                style: "display: block; margin: 20px auto;" // 使图片独占一行并居中
              }
            })
          })
        })

        const parser = new DOMParser()
        const doc = parser.parseFromString(result.value, 'text/html')
        
        // 分别收集段落和图片
        const elements = Array.from(doc.body.children)
        const documentParts = []

        elements.forEach(element => {
          if (element.tagName === 'P') {
            // 如果段落包含图片，先添加文本，再单独处理图片
            const images = element.getElementsByTagName('img')
            const text = element.textContent?.trim()

            if (text) {
              documentParts.push({
                type: 'paragraph',
                content: text
              })
            }

            if (images.length > 0) {
              Array.from(images).forEach(img => {
                documentParts.push({
                  type: 'image',
                  src: img.src
                })
              })
            }
          }
        })

        // 创建新文档，确保图片和文字分开
        const newDoc = new Document({
          sections: [{
            properties: {},
            children: documentParts.map(part => {
              if (part.type === 'paragraph') {
                return new Paragraph({
                  children: [
                    new TextRun({
                      text: part.content,
                      font: formatOptions.font,
                      size: formatOptions.fontSize,
                    }),
                  ],
                  spacing: {
                    line: formatOptions.lineSpacing * 240,
                    before: convertInchesToTwip(formatOptions.paragraphSpacing / 72),
                    after: convertInchesToTwip(formatOptions.paragraphSpacing / 72),
                  },
                  indent: {
                    firstLine: firstLineIndent,
                  },
                  alignment: AlignmentType.JUSTIFIED,
                })
              } else {
                // 图片单独成段，不使用浮动布局
                const base64Data = part.src.split(',')[1]
                return new Paragraph({
                  children: [
                    new ImageRun({
                      data: Buffer.from(base64Data, 'base64'),
                      transformation: {
                        width: 400,
                        height: 300,
                      },
                    }),
                  ],
                  spacing: {
                    before: convertInchesToTwip(30 / 72), // 增加图片前后间距
                    after: convertInchesToTwip(30 / 72),
                  },
                  alignment: AlignmentType.CENTER,
                })
              }
            }),
          }],
        })

        processedDocs.push(newDoc)

        // 更新预览
        setPreviewData({
          text: documentParts
            .filter(part => part.type === 'paragraph')
            .map(part => part.content)
            .join('\n\n'),
          images: documentParts
            .filter(part => part.type === 'image')
            .map(part => part.src),
          tables: []
        })

        // 单文件直接下载
        if (totalFiles === 1) {
          const buffer = await Packer.toBuffer(newDoc)
          saveAs(new Blob([buffer]), `formatted_${file.name}`)
        }
      }

      // 多文件打包下载
      if (totalFiles > 1) {
        const zip = new JSZip()
        for (let i = 0; i < totalFiles; i++) {
          const buffer = await Packer.toBuffer(processedDocs[i])
          zip.file(`formatted_${files[i].name}`, buffer)
        }
        const content = await zip.generateAsync({ type: 'blob' })
        saveAs(content, 'formatted_documents.zip')
      }

      setFormatProgress(100)
    } catch (error) {
      console.error('文档处理错误:', error)
      alert('文档处理失败，请检查文件格式是否正确')
    } finally {
      setIsProcessing(false)
    }
  }

  const renderCompareTab = () => (
    <div className="max-w-6xl mx-auto space-y-8">
      <BlurFade>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-lg font-medium">名单1</label>
            <textarea
              value={list1}
              onChange={(e) => setList1(e.target.value)}
              placeholder="输入名单，可以用空格、逗号或换行分隔..."
              className="w-full h-48 p-4 rounded-lg border bg-white/50 backdrop-blur-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-lg font-medium">名单2</label>
            <textarea
              value={list2}
              onChange={(e) => setList2(e.target.value)}
              placeholder="输入名单，可以用空格、逗号或换行分隔..."
              className="w-full h-48 p-4 rounded-lg border bg-white/50 backdrop-blur-sm"
            />
          </div>
        </div>
        <div className="flex justify-center mt-4">
          <RainbowButton onClick={compareLists}>
            开始对比
          </RainbowButton>
        </div>
      </BlurFade>
    </div>
  )

  const renderSeatsTab = () => (
    <div className="max-w-6xl mx-auto space-y-8">
      <BlurFade>
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">自动排座</h3>
          {/* 自动排座功能的具体实现 */}
        </div>
      </BlurFade>
    </div>
  )

  const renderFormatTab = () => (
    <div className="max-w-6xl mx-auto space-y-8">
      <BlurFade>
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">文档自动排版</h3>
          
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">字体</label>
              <select
                value={formatOptions.font}
                onChange={(e) => setFormatOptions(prev => ({
                  ...prev,
                  font: e.target.value
                }))}
                className="w-full p-2 border rounded"
              >
                <option value="微软雅黑">微软雅黑</option>
                <option value="宋体">宋体</option>
                <option value="黑体">黑体</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">字号</label>
              <select
                value={formatOptions.fontSize}
                onChange={(e) => setFormatOptions(prev => ({
                  ...prev,
                  fontSize: parseInt(e.target.value)
                }))}
                className="w-full p-2 border rounded"
              >
                <option value="24">小四</option>
                <option value="28">四号</option>
                <option value="32">三号</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">行间距</label>
              <input
                type="number"
                step="0.1"
                value={formatOptions.lineSpacing}
                onChange={(e) => setFormatOptions(prev => ({
                  ...prev,
                  lineSpacing: parseFloat(e.target.value)
                }))}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">段落间距 (px)</label>
              <input
                type="number"
                value={formatOptions.paragraphSpacing}
                onChange={(e) => setFormatOptions(prev => ({
                  ...prev,
                  paragraphSpacing: parseInt(e.target.value)
                }))}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".doc,.docx"
              onChange={(e) => {
                if (e.target.files?.length) {
                  handleDocumentFormat(e.target.files)
                }
              }}
              className="hidden"
              id="document-upload"
              multiple
            />
            <label
              htmlFor="document-upload"
              className="cursor-pointer inline-flex flex-col items-center"
            >
              <svg
                className="w-12 h-12 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-gray-600">
                点击或拖拽上传Word文档
              </span>
              <span className="text-sm text-gray-500 mt-1">
                支持批量上传 .doc, .docx 格式
              </span>
            </label>
          </div>

          {isProcessing && (
            <div className="mt-4">
              <Progress value={formatProgress} />
              <p className="text-sm text-gray-500 text-center mt-2">
                正在处理文档... {Math.round(formatProgress)}%
              </p>
            </div>
          )}

          {previewData && (
            <div className="mt-6">
              <h4 className="font-medium mb-2">文档预览</h4>
              <div className="bg-white rounded-lg p-4 max-h-96 overflow-auto">
                <div className="mb-4">
                  <h5 className="text-sm font-medium mb-2">文本内容：</h5>
                  <p className="text-sm text-gray-600">
                    {previewData.text.slice(0, 500)}...
                  </p>
                </div>

                {previewData.images.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium mb-2">图片：</h5>
                    <div className="grid grid-cols-4 gap-2">
                      {previewData.images.map((src, index) => (
                        <img
                          key={index}
                          src={src}
                          alt={`预览图 ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {previewData.tables.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium mb-2">表格：</h5>
                    <div className="overflow-x-auto">
                      {previewData.tables.map((table, tableIndex) => (
                        <table key={tableIndex} className="min-w-full divide-y divide-gray-200">
                          <tbody>
                            <tr>
                              {table.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-4 py-2 border">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {previewData && !isProcessing && (
            <div className="mt-6 flex justify-center">
              <RainbowButton
                onClick={async () => {
                  setIsProcessing(true)
                  try {
                    const doc = new Document({
                      styles: {
                        default: {
                          document: {
                            run: {
                              font: formatOptions.font,
                              size: formatOptions.fontSize,
                            },
                            paragraph: {
                              alignment: AlignmentType.JUSTIFIED,
                              spacing: {
                                line: formatOptions.lineSpacing * 240,
                                before: convertInchesToTwip(formatOptions.paragraphSpacing / 72),
                                after: convertInchesToTwip(formatOptions.paragraphSpacing / 72),
                              },
                              indent: {
                                firstLine: convertInchesToTwip(formatOptions.firstLineIndent),
                              },
                            },
                          },
                        },
                      },
                      sections: [{
                        properties: {},
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: previewData.text,
                                font: formatOptions.font,
                                size: formatOptions.fontSize,
                              }),
                            ],
                          }),
                        ],
                      }],
                    })

                    const buffer = await Packer.toBuffer(doc)
                    saveAs(new Blob([buffer]), 'formatted_document.docx')
                  } catch (error) {
                    console.error('导出错误:', error)
                    alert('导出失败，请重试')
                  } finally {
                    setIsProcessing(false)
                  }
                }}
                className="px-8"
              >
                <span className="flex items-center gap-2">
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  导出排版后的文档
                </span>
              </RainbowButton>
            </div>
          )}
        </div>
      </BlurFade>
    </div>
  )

  return (
    <div className="relative min-h-screen">
      <RetroGrid className="fixed inset-0" />

      <div className="relative p-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/bento">
            <RainbowButton>
              返回功能导航
            </RainbowButton>
          </Link>
          <h1 className="text-2xl font-bold">数据分析</h1>
          <div className="w-[100px]" />
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-1 inline-flex">
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'compare' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
              }`}
            >
              名单对比
            </button>
            <button
              onClick={() => setActiveTab('seats')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'seats' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
              }`}
            >
              自动排座
            </button>
            <button
              onClick={() => setActiveTab('format')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'format' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
              }`}
            >
              自动排版
            </button>
          </div>
        </div>

        {activeTab === 'compare' && renderCompareTab()}
        {activeTab === 'seats' && renderSeatsTab()}
        {activeTab === 'format' && renderFormatTab()}
      </div>
    </div>
  )
} 