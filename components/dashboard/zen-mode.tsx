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
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PlaylistModal } from '@/components/dashboard/playlist-modal'
import { SpotifyPlayer, type SpotifyPreset } from '@/components/dashboard/spotify-player'
import { cn } from '@/lib/utils'

interface ZenModeProps {
  isOpen: boolean
  onClose: () => void
  taskTitle?: string
}

const WORK_DURATION_SECONDS = 25 * 60
const BREATHING_PROTOCOL_SECONDS = 3 * 60

export function ZenMode({ isOpen, onClose, taskTitle = 'Foco Profundo' }: ZenModeProps) {
  const [mounted, setMounted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION_SECONDS)
  const [isRunning, setIsRunning] = useState(false)
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false)
  const [audioPreset, setAudioPreset] = useState<SpotifyPreset>('focus')
  const [emergencyLeft, setEmergencyLeft] = useState(0)

  const isEmergencyBreathing = emergencyLeft > 0

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return
    const interval = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(interval)
          setIsRunning(false)
          confetti({
            particleCount: 140,
            spread: 100,
            origin: { y: 0.62 },
            colors: ['#6366f1', '#0ea5e9', '#10b981'],
          })
          toast.success('Sessão finalizada. Excelente constância.')
          return 0
        }
        return previous - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  useEffect(() => {
    if (emergencyLeft <= 0) return

    const interval = setInterval(() => {
      setEmergencyLeft((previous) => {
        if (previous <= 1) {
          clearInterval(interval)
          setAudioPreset('focus')
          toast.success('Protocolo de respiro concluído. Voltando ao foco.')
          return 0
        }
        return previous - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [emergencyLeft])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return

      switch (event.code) {
        case 'Space':
          event.preventDefault()
          setIsRunning((previous) => !previous)
          break
        case 'KeyR':
          setIsRunning(false)
          setTimeLeft(WORK_DURATION_SECONDS)
          toast.info('Timer reiniciado.')
          break
        case 'KeyM':
          setIsPlaylistOpen((previous) => !previous)
          break
        case 'KeyB':
          activateBreathingProtocol()
          break
        case 'Escape':
          if (isPlaylistOpen) setIsPlaylistOpen(false)
          else onClose()
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, isPlaylistOpen, onClose])

  const timerLabel = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [timeLeft])

  const breathingLabel = useMemo(() => {
    const minutes = Math.floor(emergencyLeft / 60)
    const seconds = emergencyLeft % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [emergencyLeft])

  function activateBreathingProtocol() {
    const fallbackPreset: SpotifyPreset = Math.random() > 0.5 ? 'brown-noise' : 'guided-breathing'
    setIsRunning(false)
    setAudioPreset(fallbackPreset)
    setEmergencyLeft(BREATHING_PROTOCOL_SECONDS)
    toast.info('Protocolo Pânico/Respiro ativado por 3 minutos.', {
      description:
        fallbackPreset === 'brown-noise'
          ? 'Ruído marrom selecionado automaticamente.'
          : 'Respiração guiada selecionada automaticamente.',
    })
  }

  if (!isOpen || !mounted) return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex h-[100dvh] flex-col items-center justify-center overflow-hidden text-white',
        'animate-in fade-in duration-700',
        isEmergencyBreathing ? 'bg-[#d6e9ff]' : 'bg-[#06080f]',
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={cn(
            'absolute -left-[10%] -top-[20%] h-[70%] w-[70%] rounded-full blur-[120px]',
            isEmergencyBreathing ? 'bg-sky-300/45' : 'bg-brand-violet/15',
          )}
        />
        <div
          className={cn(
            'absolute -bottom-[20%] -right-[10%] h-[60%] w-[60%] rounded-full blur-[120px]',
            isEmergencyBreathing ? 'bg-cyan-200/45' : 'bg-brand-cyan/10',
          )}
        />
      </div>

      <div className={cn('absolute inset-0', isEmergencyBreathing ? 'opacity-[0.04]' : 'opacity-[0.08]')}>
        <div className="h-full w-full bg-cyber-grid" />
      </div>

      <header className="absolute left-6 right-6 top-6 z-50 flex items-center justify-between md:left-10 md:right-10 md:top-10">
        <div
          className={cn(
            'flex items-center gap-3 rounded-2xl border px-4 py-2 backdrop-blur-xl',
            isEmergencyBreathing
              ? 'border-sky-400/30 bg-sky-100/20 text-slate-900'
              : 'border-white/10 bg-white/5 text-white',
          )}
        >
          <Zap className={cn('h-3 w-3', isEmergencyBreathing ? 'text-sky-700' : 'text-brand-violet')} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">
            {isEmergencyBreathing ? 'Protocolo_Respirar' : 'Protocolo_Zen'}
          </span>
        </div>

        <Button
          variant="ghost"
          onClick={onClose}
          className={cn(
            'group transition-all',
            isEmergencyBreathing ? 'text-slate-700 hover:bg-sky-100/30' : 'text-white/40 hover:bg-white/5 hover:text-white',
          )}
        >
          <Minimize2 className="mr-2 h-5 w-5 group-hover:scale-110" />
          <span className="hidden text-xs font-bold uppercase tracking-widest md:inline">Esc sair</span>
        </Button>
      </header>

      <main className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-center px-6 text-center">
        <div
          className={cn(
            'mb-6 flex items-center gap-2 rounded-full border px-6 py-2 backdrop-blur-xl md:mb-10',
            isEmergencyBreathing
              ? 'border-sky-300/45 bg-sky-100/30 text-slate-900'
              : 'border-brand-violet/25 bg-brand-violet/10 text-white',
          )}
        >
          <Sparkles className={cn('h-4 w-4', isEmergencyBreathing ? 'text-sky-700' : 'text-brand-cyan')} />
          <span className="text-xs font-bold uppercase tracking-[0.18em] md:text-sm">{taskTitle}</span>
        </div>

        <h1
          className={cn(
            'mb-8 select-none text-[28vw] font-black leading-none tracking-tighter tabular-nums md:mb-12 md:text-[200px]',
            isEmergencyBreathing ? 'text-slate-800' : 'text-white',
          )}
          style={{
            textShadow: isEmergencyBreathing
              ? '0 0 32px rgba(125, 211, 252, 0.35)'
              : isRunning
                ? '0 0 56px hsl(var(--brand-primary-hsl) / 0.45)'
                : '0 0 22px rgba(255,255,255,0.08)',
          }}
        >
          {timerLabel}
        </h1>

        {isEmergencyBreathing && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-300/45 bg-sky-100/35 px-4 py-2 text-sm font-semibold text-slate-800">
            <Waves className="h-4 w-4" />
            Modo Respiro ativo • {breathingLabel}
          </div>
        )}

        <div className="mb-12 flex items-center gap-4 md:mb-16 md:gap-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setIsRunning(false)
              setTimeLeft(WORK_DURATION_SECONDS)
            }}
            className={cn(
              'h-14 w-14 rounded-2xl md:h-16 md:w-16',
              isEmergencyBreathing
                ? 'border-sky-300/45 bg-sky-100/40 text-slate-700 hover:bg-sky-100/55'
                : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white',
            )}
            title="Reiniciar (R)"
          >
            <RotateCcw className="h-6 w-6" />
          </Button>

          <Button
            onClick={() => setIsRunning((previous) => !previous)}
            className={cn(
              'h-24 w-24 rounded-[32px] shadow-2xl transition-all active:scale-95 md:h-28 md:w-28',
              isEmergencyBreathing
                ? 'bg-sky-600 text-white'
                : isRunning
                  ? 'bg-white text-black'
                  : 'bg-brand-violet text-white shadow-neon-violet',
            )}
            title="Play/Pause (Espaço)"
          >
            {isRunning ? (
              <Pause className="h-10 w-10 fill-current md:h-12 md:w-12" />
            ) : (
              <Play className="ml-1 h-10 w-10 fill-current md:h-12 md:w-12" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsPlaylistOpen(true)}
            className={cn(
              'h-14 w-14 rounded-2xl md:h-16 md:w-16',
              isEmergencyBreathing
                ? 'border-sky-300/45 bg-sky-100/40 text-slate-700 hover:bg-sky-100/55'
                : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white',
            )}
            title="Playlists (M)"
          >
            <Music2 className="h-6 w-6" />
          </Button>
        </div>

        <div className="mb-6 w-full max-w-sm">
          <SpotifyPlayer preset={audioPreset} />
        </div>

        <Button
          onClick={activateBreathingProtocol}
          className={cn(
            'rounded-full px-6 py-2 text-sm font-semibold tracking-wide',
            isEmergencyBreathing
              ? 'bg-slate-800 text-sky-100 hover:bg-slate-700'
              : 'bg-sky-500/80 text-white hover:bg-sky-500',
          )}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Botão Pânico / Respiro (B)
        </Button>
      </main>

      <PlaylistModal isOpen={isPlaylistOpen} onClose={() => setIsPlaylistOpen(false)} />

      <footer
        className={cn(
          'absolute bottom-10 hidden w-full justify-between px-12 text-[10px] font-black uppercase tracking-[0.5em] sm:flex',
          isEmergencyBreathing ? 'text-slate-700/70' : 'text-white/30',
        )}
      >
        <div className="flex flex-col gap-2 text-left">
          <span>[ESPAÇO] PLAY/PAUSE</span>
          <span>[R] REINICIAR TIMER</span>
          <span>[M] PLAYLISTS</span>
          <span>[B] PÂNICO/RESPIRO</span>
        </div>
        <div className="text-right">
          <span>ZEN ENGINE v3.1</span>
        </div>
      </footer>
    </div>,
    document.body,
  )
}
