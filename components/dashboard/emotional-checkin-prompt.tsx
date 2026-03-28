'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { X, Sparkles, Loader2, Activity, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const moodOptions = [
  { value: 1, emoji: '🌧️', label: 'CRÍTICO', color: 'text-red-500 hover:bg-red-500/10' },
  { value: 2, emoji: '🌫️', label: 'BAIXO', color: 'text-orange-500 hover:bg-orange-500/10' },
  { value: 3, emoji: '☕', label: 'ESTÁVEL', color: 'text-slate-300 hover:bg-slate-500/10' },
  { value: 4, emoji: '✨', label: 'BOM', color: 'text-brand-cyan hover:bg-brand-cyan/10' },
  { value: 5, emoji: '🚀', label: 'MÁXIMO', color: 'text-brand-violet hover:bg-brand-violet/10' },
]

const energyOptions = [
  { value: 1, emoji: '🪫', label: 'ESGOTADA', color: 'text-red-500 hover:bg-red-500/10' },
  { value: 2, emoji: '🔋', label: 'BAIXA', color: 'text-orange-500 hover:bg-orange-500/10' },
  { value: 3, emoji: '⚖️', label: 'MÉDIA', color: 'text-slate-300 hover:bg-slate-500/10' },
  { value: 4, emoji: '⚡', label: 'ALTA', color: 'text-brand-emerald hover:bg-brand-emerald/10' },
  { value: 5, emoji: '🔥', label: 'SOBRECARGA', color: 'text-orange-500 hover:bg-orange-500/10' },
]

export function EmotionalCheckinPrompt() {
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [isDismissed, setIsDismissed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  if (isDismissed) return null

  function handleSubmit() {
    if (!mood || !energy) {
      toast.error('Calibração Incompleta', { description: 'Selecione os parâmetros de humor e energia.' })
      return
    }

    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Conexão Neural perdida.')
        return
      }

      const { error } = await supabase.from('checkins_emocionais').insert({
        usuario_id: user.id, humor: mood, energia: energy, nota: note.trim() || null,
      })

      if (error) {
        toast.error('Falha ao sincronizar scanner.')
        return
      }

      toast.success('Scanner Sincronizado!')
      setIsDismissed(true)
      router.refresh()
    })
  }

  return (
    <Card className="border border-brand-violet/20 bg-gradient-to-br from-brand-violet/[0.02] to-transparent shadow-2xl relative overflow-hidden group rounded-[2rem]">
      <div className="absolute top-0 left-0 w-1 h-full bg-brand-violet/50" />
      
      <CardHeader className="pb-2 pt-5 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-violet" /> Calibração Diária
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-white rounded-full" onClick={() => setIsDismissed(true)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-brand-cyan flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Estado Emocional</p>
            <div className="flex bg-black/40 rounded-2xl p-1.5 border border-white/5">
              {moodOptions.map((opt) => (
                <button
                  key={opt.value} onClick={() => setMood(opt.value)}
                  className={cn("flex-1 flex flex-col items-center py-2 rounded-xl transition-all", mood === opt.value ? "bg-white/10 shadow-sm" : opt.color)}
                >
                  <span className={cn("text-lg mb-1 transition-transform", mood === opt.value && "scale-125")}>{opt.emoji}</span>
                  <span className={cn("text-[8px] font-black uppercase tracking-wider", mood === opt.value ? "text-white" : "text-transparent")}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-brand-emerald flex items-center gap-1.5"><Zap className="w-3 h-3" /> Bateria Física</p>
            <div className="flex bg-black/40 rounded-2xl p-1.5 border border-white/5">
              {energyOptions.map((opt) => (
                <button
                  key={opt.value} onClick={() => setEnergy(opt.value)}
                  className={cn("flex-1 flex flex-col items-center py-2 rounded-xl transition-all", energy === opt.value ? "bg-white/10 shadow-sm" : opt.color)}
                >
                  <span className={cn("text-lg mb-1 transition-transform", energy === opt.value && "scale-125")}>{opt.emoji}</span>
                  <span className={cn("text-[8px] font-black uppercase tracking-wider", energy === opt.value ? "text-white" : "text-transparent")}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {(mood || energy) && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <Textarea
              placeholder="[ Terminal ] Adicione notas sobre a calibração... (ex: Arquitetura concluída)"
              value={note} onChange={(e) => setNote(e.target.value)}
              className="resize-none bg-black/40 border-white/10 h-14 text-xs text-white placeholder:text-muted-foreground/30 placeholder:font-mono rounded-xl focus-visible:ring-brand-violet/30"
            />
          </div>
        )}

        <Button 
          onClick={handleSubmit} disabled={!mood || !energy || isPending}
          className="w-full font-black tracking-widest uppercase text-[10px] h-10 rounded-xl bg-brand-violet hover:bg-brand-violet/80 text-white disabled:bg-white/5 disabled:text-white/20"
        >
          {isPending ? <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> SINCRONIZANDO...</> : 'REGISTRAR CALIBRAÇÃO'}
        </Button>
      </CardContent>
    </Card>
  )
}