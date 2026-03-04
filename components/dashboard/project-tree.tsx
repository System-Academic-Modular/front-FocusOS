'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Position,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Brain, Edit, GitBranch, MousePointerClick, X } from 'lucide-react'
import { TaskEditDialog } from '@/components/dashboard/task-edit-dialog'
import { cn } from '@/lib/utils'
import type { Category, Task } from '@/lib/types'

interface ProjectTreeProps {
  tasks: Task[]
  categories: Category[]
}

type ProjectNodeData = {
  label: string
  color: string
  categoryName: string
  status: Task['status']
  priority: Task['priority']
  dueDate: string | null
  estimatedMinutes: number | null
  cognitiveLoad: number
}

function ProjectNode({ data }: { data: ProjectNodeData }) {
  const isDone = data.status === 'done'
  const isUrgent = data.priority === 'urgent'

  return (
    <div
      className={cn(
        'relative min-w-[190px] rounded-xl border px-4 py-3 text-center shadow-xl backdrop-blur-md transition-all',
        isDone
          ? 'border-white/10 bg-black/40 opacity-65 grayscale'
          : 'border-white/15 bg-[#11192a]/75 hover:scale-[1.02] hover:border-white/25',
      )}
      style={{
        borderColor: isDone ? undefined : `${data.color}85`,
        boxShadow: isDone ? undefined : `0 0 24px ${data.color}22`,
      }}
    >
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {data.categoryName}
      </div>
      <div className="line-clamp-2 text-sm font-semibold text-white">{data.label}</div>

      <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-slate-300">
        {data.dueDate && <span>{data.dueDate}</span>}
        {data.estimatedMinutes ? <span>• {data.estimatedMinutes}m</span> : null}
      </div>

      <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-sky-300">
        <Brain className="h-3 w-3" />
        Carga {data.cognitiveLoad}
      </div>

      {isUrgent && !isDone && (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
      )}
    </div>
  )
}

const nodeTypes = {
  projectNode: ProjectNode,
}

function buildGraph(tasks: Task[], categories: Category[]) {
  const categoryById = new Map(categories.map((category) => [category.id, category]))
  const childrenByParent = new Map<string, Task[]>()
  const roots: Task[] = []

  for (const task of tasks) {
    if (!task.parent_id) {
      roots.push(task)
      continue
    }
    const siblings = childrenByParent.get(task.parent_id) || []
    siblings.push(task)
    childrenByParent.set(task.parent_id, siblings)
  }

  const nodes: Node<ProjectNodeData>[] = []
  const edges: Edge[] = []
  let cursorY = 0

  const addTaskNode = (task: Task, depth: number) => {
    const category = task.category_id ? categoryById.get(task.category_id) : undefined
    const siblings = childrenByParent.get(task.parent_id || '__root__') || []
    const siblingIndex = siblings.findIndex((sibling) => sibling.id === task.id)
    const x = depth * 280 + (depth % 2 === 0 ? 0 : 30)
    const y = cursorY + Math.max(0, siblingIndex) * 150

    nodes.push({
      id: task.id,
      type: 'projectNode',
      position: { x, y },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: {
        label: task.title,
        color: category?.color || '#4f46e5',
        categoryName: category?.name || 'Geral',
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date ? format(new Date(task.due_date), 'dd MMM', { locale: ptBR }) : null,
        estimatedMinutes: task.estimated_minutes ?? null,
        cognitiveLoad: task.cognitive_load,
      },
    })

    if (task.parent_id) {
      edges.push({
        id: `edge-${task.parent_id}-${task.id}`,
        source: task.parent_id,
        target: task.id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#94a3b840', strokeWidth: 1.5 },
      })
    }

    const children = childrenByParent.get(task.id) || []
    if (!children.length) {
      cursorY += 170
      return
    }

    for (const child of children) {
      addTaskNode(child, depth + 1)
    }
  }

  for (const rootTask of roots) {
    addTaskNode(rootTask, 0)
  }

  return { nodes, edges }
}

type ContextMenuState = {
  taskId: string
  top: number
  left: number
}

function ContextMenu({
  top,
  left,
  onClose,
  onEdit,
  onAddSubtask,
}: {
  top: number
  left: number
  onClose: () => void
  onEdit: () => void
  onAddSubtask: () => void
}) {
  return (
    <div className="fixed inset-0 z-[9999]" onClick={onClose} onContextMenu={(event) => event.preventDefault()}>
      <div
        style={{ top, left }}
        className="absolute w-56 rounded-xl border border-white/10 bg-[#121621]/95 p-1.5 shadow-2xl backdrop-blur-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between border-b border-white/10 px-2 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Ações da tarefa
          </span>
          <button onClick={onClose} className="rounded p-0.5 hover:bg-white/10">
            <X className="h-3 w-3" />
          </button>
        </div>

        <button
          onClick={() => {
            onEdit()
            onClose()
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-white transition-colors hover:bg-brand-violet/20"
        >
          <Edit className="h-4 w-4" />
          Editar detalhes
        </button>

        <button
          onClick={() => {
            onAddSubtask()
            onClose()
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-white transition-colors hover:bg-sky-500/20"
        >
          <GitBranch className="h-4 w-4" />
          Criar subtarefa
        </button>
      </div>
    </div>
  )
}

export function ProjectTree({ tasks, categories }: ProjectTreeProps) {
  const [mounted, setMounted] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [parentIdForNewTask, setParentIdForNewTask] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [menu, setMenu] = useState<ContextMenuState | null>(null)

  const { nodes: graphNodes, edges: graphEdges } = useMemo(
    () => buildGraph(tasks, categories),
    [tasks, categories],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(graphNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphEdges)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setNodes(graphNodes)
    setEdges(graphEdges)
  }, [graphEdges, graphNodes, setEdges, setNodes])

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault()

    const menuWidth = 224
    const menuHeight = 140
    let left = event.clientX
    let top = event.clientY

    if (left + menuWidth > window.innerWidth) left -= menuWidth
    if (top + menuHeight > window.innerHeight) top -= menuHeight

    setMenu({ taskId: node.id, top, left })
  }, [])

  function openTaskEditor(taskId: string) {
    const foundTask = tasks.find((task) => task.id === taskId) || null
    setEditingTask(foundTask)
    setParentIdForNewTask(null)
    setIsDialogOpen(true)
  }

  function openSubtaskCreator(taskId: string) {
    setEditingTask(null)
    setParentIdForNewTask(taskId)
    setIsDialogOpen(true)
  }

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_55%)]" />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={() => setMenu(null)}
        fitView
        minZoom={0.5}
        maxZoom={2}
        className="z-10 bg-transparent"
      >
        <Background color="#3b4b67" gap={30} size={1} className="opacity-15" />
        <Controls className="rounded-xl border border-white/10 bg-[#111827]" />
        <MiniMap className="rounded-xl border border-white/10 bg-[#111827]" maskColor="rgba(4,8,15,0.7)" />
      </ReactFlow>

      <div className="pointer-events-none absolute left-6 top-6 z-20">
        <h3 className="text-lg font-bold text-white">
          Rede de Projetos <span className="text-brand-violet">Estratégica</span>
        </h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MousePointerClick className="h-3 w-3" />
          Clique direito para editar ou criar subtarefa.
        </p>
      </div>

      {mounted && menu
        ? createPortal(
            <ContextMenu
              top={menu.top}
              left={menu.left}
              onClose={() => setMenu(null)}
              onEdit={() => openTaskEditor(menu.taskId)}
              onAddSubtask={() => openSubtaskCreator(menu.taskId)}
            />,
            document.body,
          )
        : null}

      <TaskEditDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={editingTask}
        categories={categories}
        defaultParentId={parentIdForNewTask}
      />
    </div>
  )
}
