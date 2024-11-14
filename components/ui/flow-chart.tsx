"use client"

import { useState, useCallback, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  Connection,
  Edge,
  Node,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'

// 定义节点数据类型
interface NodeData {
  label: string
  type?: 'circle' | 'rectangle' | 'diamond'
  width?: number
  height?: number
  fontSize?: number
  color?: string
}

// 自定义节点组件
const CustomNode = ({ data, id, selected }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // 获取节点形状样式
  const getNodeStyle = () => {
    switch (data.type) {
      case 'circle':
        return 'rounded-full'
      case 'diamond':
        return 'rotate-45'
      default:
        return 'rounded-md'
    }
  }

  return (
    <>
      {/* 连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 border-2 border-white rounded-full"
        style={{ opacity: 1 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 border-2 border-white rounded-full"
        style={{ opacity: 1 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 border-2 border-white rounded-full"
        style={{ opacity: 1 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 border-2 border-white rounded-full"
        style={{ opacity: 1 }}
      />

      {/* 节点内容 */}
      <div
        className={`w-full h-full flex items-center justify-center border-2 ${
          selected ? 'border-blue-500' : 'border-gray-200'
        } ${getNodeStyle()} bg-white`}
        style={{
          fontSize: `${data.fontSize || 14}px`,
          backgroundColor: data.color || 'white',
          minWidth: '150px',
          minHeight: '50px',
          padding: '10px'
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          setIsEditing(true)
        }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            defaultValue={data.label}
            className="w-full text-center bg-transparent outline-none"
            autoFocus
            onBlur={(e) => {
              data.label = e.target.value
              setIsEditing(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur()
              }
            }}
          />
        ) : (
          <div className={data.type === 'diamond' ? '-rotate-45' : ''}>
            {data.label}
          </div>
        )}
      </div>
    </>
  )
}

// 定义节点类型映射
const nodeTypes = {
  custom: CustomNode
}

interface FlowChartProps {
  initialNodes?: Node[]
  initialEdges?: Edge[]
  onSave?: (nodes: Node[], edges: Edge[]) => void
}

// 主组件
export function FlowChart({ initialNodes = [], initialEdges = [], onSave }: FlowChartProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [nodeConfig, setNodeConfig] = useState<NodeData>({
    label: '新节点',
    type: 'rectangle',
    fontSize: 14,
    color: '#ffffff'
  })

  // 处理节点连接
  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#999', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
    }, eds))
  }, [setEdges])

  // 添加新节点
  const addNode = useCallback(() => {
    const newNode: Node = {
      id: `node-${nodes.length + 1}`,
      type: 'custom',
      position: { x: Math.random() * 300, y: Math.random() * 300 },
      data: { ...nodeConfig }
    }
    setNodes((nds) => [...nds, newNode])
  }, [nodes.length, nodeConfig, setNodes])

  return (
    <div className="w-full h-[600px] bg-gray-50 rounded-lg">
      {/* 工具栏 */}
      <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-lg space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">节点类型</label>
          <select
            value={nodeConfig.type}
            onChange={(e) => setNodeConfig(prev => ({
              ...prev,
              type: e.target.value as NodeData['type']
            }))}
            className="w-full p-2 border rounded"
          >
            <option value="rectangle">矩形</option>
            <option value="circle">圆形</option>
            <option value="diamond">菱形</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">字体大小</label>
          <input
            type="number"
            value={nodeConfig.fontSize}
            onChange={(e) => setNodeConfig(prev => ({
              ...prev,
              fontSize: parseInt(e.target.value)
            }))}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">背景颜色</label>
          <input
            type="color"
            value={nodeConfig.color}
            onChange={(e) => setNodeConfig(prev => ({
              ...prev,
              color: e.target.value
            }))}
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          onClick={addNode}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          添加节点
        </button>
      </div>

      {/* 流程图 */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        }}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
} 