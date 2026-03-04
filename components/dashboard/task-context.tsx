'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { setTaskContext } from '@/lib/actions/task-context-action'
import { normalizeCognitiveLoad } from '@/lib/effort'
import {
  parseTaskContext,
  type TaskContext,
  type TaskContextValue,
} from '@/lib/task-context-shared'
import type { CognitiveLoad } from '@/lib/types'

type TeamOption = {
  id: string
  name: string
}

// CORREÇÃO AQUI: Usamos '&' para unir os tipos.
// Agora TaskContextState tem { type, teamId, value, teams, ... } tudo no mesmo nível.
type TaskContextState = TaskContext & {
  value: TaskContextValue
  teams: TeamOption[]
  preferredCognitiveLoad: CognitiveLoad
  isPending: boolean
  setValue: (value: TaskContextValue) => void
  setPreferredCognitiveLoad: (value: CognitiveLoad) => void
}

const TaskContext = React.createContext<TaskContextState | undefined>(undefined)

export function TaskContextProvider({
  children,
  initialValue = 'personal',
  teams = [],
}: {
  children: React.ReactNode
  initialValue?: TaskContextValue
  teams?: TeamOption[]
}) {
  const router = useRouter()
  const [value, setValueState] = React.useState<TaskContextValue>(initialValue)
  const [preferredCognitiveLoad, setPreferredCognitiveLoadState] =
    React.useState<CognitiveLoad>(3)
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    const storedValue = localStorage.getItem('taskflow-cognitive-load')
    if (!storedValue) return
    setPreferredCognitiveLoadState(normalizeCognitiveLoad(Number(storedValue)))
  }, [])

  // Validação: Se tentar acessar um time que não existe na lista, volta para pessoal
  const validValue = React.useMemo<TaskContextValue>(() => {
    if (value === 'personal') return value
    const teamId = value.slice(5) // remove o prefixo 'team:'
    const exists = teams.some((team) => team.id === teamId)
    return exists ? value : 'personal'
  }, [value, teams])

  // Sincroniza o estado local se o valor validado mudar
  React.useEffect(() => {
    if (validValue !== value) {
      setValueState(validValue)
      startTransition(() => {
        void setTaskContext(validValue).then(() => router.refresh())
      })
    }
  }, [validValue, value, router])

  const setValue = React.useCallback(
    (nextValue: TaskContextValue) => {
      if (nextValue === value) return
      setValueState(nextValue)
      startTransition(() => {
        void setTaskContext(nextValue).then(() => router.refresh())
      })
    },
    [value, router],
  )

  const setPreferredCognitiveLoad = React.useCallback((nextValue: CognitiveLoad) => {
    const normalizedValue = normalizeCognitiveLoad(nextValue)
    setPreferredCognitiveLoadState(normalizedValue)
    localStorage.setItem('taskflow-cognitive-load', String(normalizedValue))
  }, [])

  // Parseia 'team:123' para { type: 'team', teamId: '123' }
  const context = React.useMemo(() => parseTaskContext(validValue), [validValue])

  const state = React.useMemo<TaskContextState>(
    () => ({
      value: validValue,
      ...context, // CORREÇÃO AQUI: Espalhamos o context para expor type e teamId na raiz
      teams,
      preferredCognitiveLoad,
      isPending,
      setValue,
      setPreferredCognitiveLoad,
    }),
    [
      validValue,
      context,
      teams,
      preferredCognitiveLoad,
      isPending,
      setValue,
      setPreferredCognitiveLoad,
    ],
  )

  return <TaskContext.Provider value={state}>{children}</TaskContext.Provider>
}

export function useTaskContext() {
  const context = React.useContext(TaskContext)

  if (!context) {
    throw new Error('useTaskContext must be used within a TaskContextProvider')
  }

  return context
}
