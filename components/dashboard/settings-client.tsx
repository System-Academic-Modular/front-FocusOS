'use client'

import { useState, useTransition, useEffect } from 'react'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button' 
import { 
  Github, Music, CheckCircle2, AlertCircle, Link2, 
  User, Palette, Columns, Plus, Trash2, Moon, Sun, Monitor, X, Save, Calendar, Loader2, Timer, Bot, Minus
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { updateProfileSettings, getIntegrationsStatus } from '@/lib/actions/settings'
import type { Categoria, Perfil } from '@/lib/types'

type Tab = 'geral' | 'foco' | 'integracoes' | 'focusai'

interface SettingsClientProps {
  initialProfile: Perfil | any
  initialCategories?: Categoria[]
}

export function SettingsClient({ initialProfile }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('geral')
  const [isPending, startTransition] = useTransition()
  const [integrations, setIntegrations] = useState<{provider: string}[]>([])

  useEffect(() => {
    getIntegrationsStatus().then(data => setIntegrations(data))
  }, [])

  // --- GERAL ---
  const [profileData, setProfileData] = useState({
    nome_completo: initialProfile?.nome_completo || '',
    email: initialProfile?.email || ''
  })

  // --- FOCO ---
  const [focoData, setFocoData] = useState({
    pomodoro_foco: initialProfile?.duracao_pomodoro || 25,
    pomodoro_pausa: initialProfile?.pausa_curta || 5
  })

  const getInitials = (name: string) => {
    if (!name) return '??'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  const handleSaveProfile = () => {
    startTransition(async () => {
      const result = await updateProfileSettings({ nome_completo: profileData.nome_completo })
      if (result.error) toast.error(result.error)
      else toast.success('Perfil atualizado!')
    })
  }

  const handleSaveFoco = () => {
    startTransition(async () => {
      const result = await updateProfileSettings({ 
        pomodoro_foco: focoData.pomodoro_foco, 
        pomodoro_pausa: focoData.pomodoro_pausa 
      })
      if (result.error) toast.error(result.error)
      else toast.success('Ritmo de Foco atualizado e sincronizado!')
    })
  }

  const isSpotifyConnected = integrations.some(i => i.provider === 'spotify')
  const isGoogleConnected = integrations.some(i => i.provider === 'google')

  const adjustTime = (type: 'foco' | 'pausa', amount: number) => {
    if (type === 'foco') {
      setFocoData(p => ({ ...p, pomodoro_foco: Math.max(1, p.pomodoro_foco + amount) }))
    } else {
      setFocoData(p => ({ ...p, pomodoro_pausa: Math.max(1, p.pomodoro_pausa + amount) }))
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-in fade-in duration-500 flex flex-col md:flex-row gap-8 relative">
      
      {/* ASIDE - MENU */}
      <aside className="w-full md:w-64 shrink-0 space-y-1">
        <div className="mb-8 px-4 md:px-0">
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Ajustes</h1>
          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-brand-violet">Configuração de Sistema</p>
        </div>
        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 no-scrollbar px-4 md:px-0">
          <TabButton active={activeTab === 'geral'} onClick={() => setActiveTab('geral')} icon={User} label="Geral" />
          <TabButton active={activeTab === 'foco'} onClick={() => setActiveTab('foco')} icon={Timer} label="Foco & Bio-ritmo" />
          <TabButton active={activeTab === 'integracoes'} onClick={() => setActiveTab('integracoes')} icon={Link2} label="Integrações" />
          <TabButton active={activeTab === 'focusai'} onClick={() => setActiveTab('focusai')} icon={Bot} label="FocusAI" isGlow />
        </nav>
      </aside>

      <Separator orientation="vertical" className="hidden md:block min-h-[600px] bg-white/5" />

      {/* CONTEÚDO DINÂMICO */}
      <div className="flex-1 space-y-8 max-w-3xl px-4 md:px-0">

        {/* --- ABA GERAL --- */}
        {activeTab === 'geral' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <section className="space-y-4">
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Perfil de <span className="text-brand-cyan">Comando</span></h2>
              <div className="grid gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-[32px]">
                
                {/* Avatar Placeholder Estético */}
                <div className="flex items-center gap-6 mb-4">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center bg-black/60 border border-brand-violet/30 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                    <span className="text-2xl font-black text-brand-violet tracking-tighter shadow-neon-violet">
                      {getInitials(profileData.nome_completo)}
                    </span>
                  </div>
                  <div>
                     <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-1">Identidade Visual</p>
                     <p className="text-xs text-white/60">Avatar será gerado pelo sistema futuramente.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">E-mail de Acesso (Não editável)</Label>
                  <Input value={profileData.email} disabled className="bg-white/5 border-white/5 text-white/40 h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Nome Completo</Label>
                  <Input 
                    value={profileData.nome_completo} 
                    onChange={(e) => setProfileData({...profileData, nome_completo: e.target.value})} 
                    className="bg-black/50 border-white/10 h-12 rounded-xl focus:border-brand-cyan transition-all text-white" 
                  />
                </div>
                <Button onClick={handleSaveProfile} disabled={isPending} className="w-fit bg-brand-cyan hover:bg-brand-cyan/90 text-black font-black uppercase text-[10px] tracking-widest rounded-xl h-12 px-8">
                  {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Atualizar Perfil
                </Button>
              </div>
            </section>
          </div>
        )}

        {/* --- ABA FOCO & BIO-RITMO --- */}
        {activeTab === 'foco' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Foco & <span className="text-brand-emerald">Bio-ritmo</span></h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Configure o ritmo do motor de foco.</p>
            </div>
            <div className="grid gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-[32px]">
              
              <div className="space-y-4">
                <Label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Tempo de Foco (minutos)</Label>
                <div className="flex items-center gap-4">
                   <Button variant="outline" size="icon" onClick={() => adjustTime('foco', -5)} className="bg-black/50 border-white/10 text-white hover:bg-white/10 w-12 h-12 rounded-xl">
                      <Minus className="w-4 h-4" />
                   </Button>
                   <Input 
                    type="number"
                    value={focoData.pomodoro_foco} 
                    onChange={(e) => setFocoData({...focoData, pomodoro_foco: Number(e.target.value)})} 
                    className="bg-black/50 border-emerald-500/30 text-emerald-400 text-center text-xl font-black tabular-nums h-12 w-24 rounded-xl shadow-[inset_0_0_15px_rgba(16,185,129,0.1)] focus:border-emerald-500 transition-all font-mono"
                   />
                   <Button variant="outline" size="icon" onClick={() => adjustTime('foco', 5)} className="bg-black/50 border-white/10 text-white hover:bg-white/10 w-12 h-12 rounded-xl">
                      <Plus className="w-4 h-4" />
                   </Button>
                </div>
              </div>

              <div className="space-y-4 mt-4">
                <Label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Tempo de Pausa (minutos)</Label>
                <div className="flex items-center gap-4">
                   <Button variant="outline" size="icon" onClick={() => adjustTime('pausa', -1)} className="bg-black/50 border-white/10 text-white hover:bg-white/10 w-12 h-12 rounded-xl">
                      <Minus className="w-4 h-4" />
                   </Button>
                   <Input 
                    type="number"
                    value={focoData.pomodoro_pausa} 
                    onChange={(e) => setFocoData({...focoData, pomodoro_pausa: Number(e.target.value)})} 
                    className="bg-black/50 border-sky-500/30 text-sky-400 text-center text-xl font-black tabular-nums h-12 w-24 rounded-xl shadow-[inset_0_0_15px_rgba(14,165,233,0.1)] focus:border-sky-500 transition-all font-mono"
                   />
                   <Button variant="outline" size="icon" onClick={() => adjustTime('pausa', 1)} className="bg-black/50 border-white/10 text-white hover:bg-white/10 w-12 h-12 rounded-xl">
                      <Plus className="w-4 h-4" />
                   </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <Button onClick={handleSaveFoco} disabled={isPending} className="w-fit bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-[10px] tracking-widest rounded-xl h-12 px-8">
                  {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Salvar Estado
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* --- ABA INTEGRAÇÕES --- */}
        {activeTab === 'integracoes' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
             <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Pontes de <span className="text-orange-400">Integração</span></h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Conecte o FocusOS ao ecossistema.</p>
            </div>

            <div className="grid gap-4">
              <div className="p-6 border border-white/10 bg-black/40 hover:bg-black/60 transition-all rounded-[24px] flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20 group-hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all">
                    <Music className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-white uppercase italic">Spotify</h3>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Controle playlists no Flow</p>
                  </div>
                </div>
                {isSpotifyConnected ? (
                  <div className="px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                     <CheckCircle2 className="w-4 h-4" /> Conectado
                  </div>
                ) : (
                  <Button asChild className="bg-white/10 hover:bg-white/20 text-white font-black uppercase text-[10px] tracking-widest rounded-xl">
                    <a href="/api/integrations/spotify/connect">Conectar</a>
                  </Button>
                )}
              </div>

              <div className="p-6 border border-white/10 bg-black/40 hover:bg-black/60 transition-all rounded-[24px] flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                    <Calendar className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-white uppercase italic">Google Calendar</h3>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Sincronize sua agenda de eventos</p>
                  </div>
                </div>
                {isGoogleConnected ? (
                  <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                     <CheckCircle2 className="w-4 h-4" /> Conectado
                  </div>
                ) : (
                  <Button asChild className="bg-white/10 hover:bg-white/20 text-white font-black uppercase text-[10px] tracking-widest rounded-xl">
                    <a href="/api/integrations/google/connect">Conectar</a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- ABA FOCUS AI --- */}
        {activeTab === 'focusai' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
             <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Módulo <span className="text-brand-violet">FocusAI</span></h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">A fundação do assistente virtual.</p>
            </div>
            
            <div className="relative overflow-hidden p-8 border border-brand-violet/30 bg-black/40 rounded-[32px] group">
              <div className="absolute inset-0 bg-brand-violet/5 group-hover:bg-brand-violet/10 transition-colors duration-500" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-violet/20 blur-[100px] rounded-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6 py-8">
                 <div className="w-20 h-20 rounded-full bg-brand-violet/10 border border-brand-violet/50 shadow-[0_0_30px_rgba(139,92,246,0.5)] flex items-center justify-center animate-pulse">
                    <Bot className="w-10 h-10 text-brand-violet" />
                 </div>
                 
                 <div>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter shadow-neon-violet">Inteligência Artificial</h3>
                    <p className="text-xs font-bold text-brand-violet/80 uppercase tracking-[0.2em] mt-2">Ativação em Progresso</p>
                 </div>

                 <p className="max-w-md text-sm text-white/50 leading-relaxed font-mono mt-4">
                   Em breve, o FocusOS será interligado ao núcleo central da Hilston. O assistente cognitivo fornecerá insights de performance e reorganização automática de calendário.
                 </p>
                 
                 <div className="mt-4 px-6 py-2 rounded-full border border-brand-violet/20 bg-brand-violet/5">
                    <span className="text-[10px] font-mono text-brand-violet/70 uppercase tracking-widest">
                      Status_Code: 202_ACCEPTED
                    </span>
                 </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label, isGlow }: any) {
  return (
    <Button 
      variant="ghost" 
      onClick={onClick} 
      className={cn(
        "justify-start h-12 rounded-xl px-4 transition-all duration-300", 
        active 
          ? (isGlow ? "bg-brand-violet/10 text-brand-violet border border-brand-violet/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]" : "bg-white/10 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]") 
          : "text-white/40 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className={cn("w-4 h-4 mr-3", active ? (isGlow ? "text-brand-violet" : "text-white") : "text-white/20")} /> 
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      {isGlow && !active && <div className="ml-auto w-2 h-2 rounded-full bg-brand-violet/50 animate-pulse" />}
    </Button>
  )
}