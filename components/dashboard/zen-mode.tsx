'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import confetti from 'canvas-confetti'
import {
  AlertTriangle,
  Minimize2,
  Music2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Waves,
  Zap,
  CheckCircle2,
  Brain
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PlaylistModal } from '@/components/dashboard/playlist-modal'
import { SpotifyPlayer, type SpotifyPreset } from '@/components/dashboard/spotify-player'
import { cn } from '@/lib/utils'
import type { Tarefa } from '@/lib/types'

interface ZenModeProps {
  isOpen: boolean
  onClose: () => void
  task?: Tarefa | null
  taskTitle?: string
  focusDurationMin?: number
}

const PROTOCOLO_RESPIRO = 3 * 60

export function ZenMode({ isOpen, onClose, task = null, taskTitle, focusDurationMin = 25 }: ZenModeProps) {
  const [mounted, setMounted] = useState(false)
  
  const initialDuration = focusDurationMin * 60
  const [timeLeft, setTimeLeft] = useState(initialDuration)
  const [isRunning, setIsRunning] = useState(false)
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false)
  const [audioPreset, setAudioPreset] = useState<SpotifyPreset>('focus')
  const [emergencyLeft, setEmergencyLeft] = useState(0)

  // Atualizar o timeLeft se focusDurationMin mudar enquanto fechado
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(initialDuration)
    }
  }, [isOpen, initialDuration])

  const isEmergencyBreathing = emergencyLeft > 0

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Timer de Foco
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finalizarSessao()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  // Timer de Respiro
  useEffect(() => {
    if (emergencyLeft <= 0) return
    const interval = setInterval(() => {
      setEmergencyLeft((prev) => {
        if (prev <= 1) {
          setAudioPreset('focus')
          toast.success('Protocolo de respiro concluído. Retomando clareza.')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [emergencyLeft])

  // Atalhos de Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || e.target instanceof HTMLInputElement) return
      
      const actions: Record<string, () => void> = {
        Space: () => setIsRunning(p => !p),
        KeyR: () => { setIsRunning(false); setTimeLeft(initialDuration); toast.info('Timer reiniciado.') },
        KeyM: () => setIsPlaylistOpen(p => !p),
        KeyB: () => activateBreathingProtocol(),
        Escape: () => isPlaylistOpen ? setIsPlaylistOpen(false) : onClose()
      }

      if (actions[e.code]) {
        e.preventDefault()
        actions[e.code]()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isPlaylistOpen, initialDuration])

  const finalizarSessao = () => {
    setIsRunning(false)
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#22D3EE', '#10B981']
    })
    toast.success('Sessão concluída. Sua maestria aumentou.')
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  function activateBreathingProtocol() {
    setIsRunning(false)
    setAudioPreset(Math.random() > 0.5 ? 'brown-noise' : 'guided-breathing')
    setEmergencyLeft(PROTOCOLO_RESPIRO)
    toast.info('Protocolo de Respiro Ativado', { description: 'Inspirar... Segurar... Expirar...' })
  }

  if (!isOpen || !mounted || (!task && !taskTitle)) return null

  const title = task?.titulo || taskTitle || 'Sessão de foco'
  const cognitiveLoad = task?.carga_mental ?? 3

  // Cálculo do progresso para o círculo visual
  const progressOffset = ((initialDuration - timeLeft) / initialDuration) * 100

  return createPortal(
    <div className={cn(
      'fixed inset-0 z-[9999] flex h-[100dvh] flex-col items-center justify-center overflow-hidden transition-colors duration-1000',
      isEmergencyBreathing ? 'bg-[#E0F2FE]' : 'bg-[#06080F]'
    )}>
      {/* Background Dinâmico */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full blur-[140px] transition-all duration-1000",
          isEmergencyBreathing ? "bg-sky-400/20" : isRunning ? "bg-brand-violet/10" : "bg-white/5"
        )} />
        <div className="h-full w-full bg-cyber-grid opacity-[0.05]" />
      </div>

      {/* Header Contextual */}
      <header className="absolute top-10 left-10 right-10 flex justify-between items-center z-20">
        <div className={cn(
          "flex items-center gap-4 px-4 py-2 rounded-2xl border backdrop-blur-md transition-colors",
          isEmergencyBreathing ? "bg-white/40 border-sky-200 text-sky-900" : "bg-white/5 border-white/10 text-white/70"
        )}>
          <Zap className={cn("w-4 h-4", isEmergencyBreathing ? "text-sky-600" : "text-brand-cyan")} />
          <span className="text-[10px] font-black tracking-[0.4em] uppercase">
            {isEmergencyBreathing ? 'Deep_Breathing' : 'Deep_Work_Protocol'}
          </span>
        </div>

        <Button variant="ghost" onClick={onClose} className={cn(
          "gap-2 font-bold text-xs uppercase tracking-widest",
          isEmergencyBreathing ? "text-sky-900 hover:bg-sky-200" : "text-white/40 hover:text-white"
        )}>
          <Minimize2 className="w-5 h-5" />
          Esc Minimizar
        </Button>
      </header>

      {/* Main Focus Area */}
      <main className="relative z-10 flex flex-col items-center max-w-4xl w-full px-6">
        {/* Task Badge */}
        <div className={cn(
          "mb-8 flex items-center gap-3 px-6 py-2 rounded-full border transition-all",
          isEmergencyBreathing ? "bg-sky-100 border-sky-300 text-sky-900" : "bg-brand-violet/10 border-brand-violet/20 text-white"
        )}>
          <Brain className="w-4 h-4" />
          <span className="text-sm font-black italic uppercase tracking-wider">{title}</span>
          <div className="w-px h-4 bg-current/20 mx-2" />
          <span className="text-xs font-bold opacity-70">Carga {cognitiveLoad}</span>
        </div>

        {/* Timer Gigante com Circle Progress */}
        <div className="relative group">
          <svg className="absolute -inset-20 w-[calc(100%+160px)] h-[calc(100%+160px)] -rotate-90 hidden md:block">
            <circle
              cx="50%" cy="50%" r="48%"
              className={cn("fill-none stroke-[1px] transition-colors duration-1000", isEmergencyBreathing ? "stroke-sky-200" : "stroke-white/5")}
            />
            <circle
              cx="50%" cy="50%" r="48%"
              className={cn("fill-none stroke-[2px] transition-all duration-300", isEmergencyBreathing ? "stroke-sky-600" : "stroke-brand-cyan")}
              strokeDasharray="100 100"
              strokeDashoffset={100 - progressOffset}
              strokeLinecap="round"
            />
          </svg>

          <h1 className={cn(
            "text-[30vw] md:text-[220px] font-[1000] tracking-tighter tabular-nums leading-none select-none transition-all duration-1000",
            isEmergencyBreathing ? "text-sky-900" : isRunning ? "text-white" : "text-white/20"
          )}>
            {formatTime(timeLeft)}
          </h1>
        </div>

        {isEmergencyBreathing && (
          <div className="mt-4 flex items-center gap-3 animate-bounce text-sky-700 font-bold uppercase tracking-widest text-sm">
            <Waves className="w-5 h-5" />
            Modo Respiro: {formatTime(emergencyLeft)}
          </div>
        )}

        {/* Controls */}
        <div className="mt-16 flex items-center gap-10">
          <Button variant="outline" size="icon" onClick={() => { setIsRunning(false); setTimeLeft(initialDuration); }} 
            className="h-16 w-16 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white">
            <RotateCcw className="w-6 h-6" />
          </Button>

          <Button onClick={() => setIsRunning(!isRunning)} 
            className={cn(
              "h-28 w-28 rounded-[40px] shadow-2xl transition-all hover:scale-105 active:scale-95",
              isEmergencyBreathing ? "bg-sky-600 text-white" : isRunning ? "bg-white text-black" : "bg-brand-violet text-white"
            )}>
            {isRunning ? <Pause className="w-12 h-12 fill-current" /> : <Play className="w-12 h-12 fill-current ml-2" />}
          </Button>

          <Button variant="outline" size="icon" onClick={() => setIsPlaylistOpen(true)}
            className="h-16 w-16 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white">
            <Music2 className="w-6 h-6" />
          </Button>
        </div>

        <div className="mt-12 w-full max-w-sm opacity-50 hover:opacity-100 transition-opacity">
          <SpotifyPlayer preset={audioPreset} />
        </div>

        <button onClick={activateBreathingProtocol} className={cn(
          "mt-10 flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all",
          isEmergencyBreathing ? "bg-sky-900 text-white scale-90 opacity-50" : "bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30"
        )}>
          <AlertTriangle className="w-4 h-4" />
          Panic Button / Reset Mental (B)
        </button>
      </main>

      {/* Footer Shortcuts */}
      <footer className={cn(
        "absolute bottom-10 left-10 right-10 flex justify-between text-[10px] font-black tracking-[0.4em] transition-colors",
        isEmergencyBreathing ? "text-sky-900/40" : "text-white/20"
      )}>
        <div className="flex gap-10">
          <span>[SPACE] PLAY/PAUSE</span>
          <span>[R] REINICIAR</span>
          <span>[M] PLAYLISTS</span>
        </div>
        <span>FOCUS_ENGINE_V3</span>
      </footer>

      <PlaylistModal isOpen={isPlaylistOpen} onClose={() => setIsPlaylistOpen(false)} />
    </div>,
    document.body
  )
}
