'use client'

import { Play, SkipBack, SkipForward, Waves, Wind } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SpotifyPreset = 'focus' | 'brown-noise' | 'guided-breathing'

const presetData: Record<
  SpotifyPreset,
  {
    title: string
    subtitle: string
    cover: string
    chip: string
    icon: typeof Waves
    glowClass: string
  }
> = {
  focus: {
    title: 'Deep Focus',
    subtitle: 'Flow State Playlist',
    cover: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=200',
    chip: 'Foco intenso',
    icon: Waves,
    glowClass: 'bg-brand-violet/15',
  },
  'brown-noise': {
    title: 'Ruído Marrom',
    subtitle: 'Regulação cognitiva',
    cover: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=200',
    chip: 'Calm reset',
    icon: Wind,
    glowClass: 'bg-sky-400/20',
  },
  'guided-breathing': {
    title: 'Respiração Guiada',
    subtitle: '3 minutos de estabilidade',
    cover: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=200',
    chip: 'Respirar',
    icon: Wind,
    glowClass: 'bg-blue-300/25',
  },
}

interface SpotifyPlayerProps {
  preset?: SpotifyPreset
}

export function SpotifyPlayer({ preset = 'focus' }: SpotifyPlayerProps) {
  const data = presetData[preset]
  const PresetIcon = data.icon

  return (
    <div className="group flex items-center gap-4 rounded-[24px] border border-white/10 bg-black/35 p-4 shadow-2xl backdrop-blur-xl transition-all hover:border-white/20">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
        <img
          src={data.cover}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          alt={data.title}
        />
        <div className={cn('absolute inset-0', data.glowClass)} />
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-bold text-white">{data.title}</h4>
        <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
          {data.subtitle}
        </p>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-sky-100">
          <PresetIcon className="h-3 w-3" />
          {data.chip}
        </span>
      </div>

      <div className="flex items-center gap-2 pr-1">
        <SkipBack className="h-4 w-4 cursor-pointer text-white/45 transition-colors hover:text-white" />
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition-transform hover:scale-105">
          <Play className="ml-0.5 h-4 w-4 fill-current" />
        </div>
        <SkipForward className="h-4 w-4 cursor-pointer text-white/45 transition-colors hover:text-white" />
      </div>
    </div>
  )
}
