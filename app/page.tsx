import React from "react"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Brain, Calendar, Target, Zap, Activity, ShieldCheck, ChevronRight } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-brand-violet/30 overflow-hidden relative font-sans">
      {/* Background Neural Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-brand-violet/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-brand-cyan/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Header HUD */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
            <span className="text-xl font-black tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              FocusOS
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden sm:flex text-muted-foreground hover:text-white hover:bg-white/5 uppercase tracking-wider text-[10px] font-bold" asChild>
              <Link href="/auth/login">Já tenho acesso</Link>
            </Button>
            <Button className="bg-brand-violet hover:bg-brand-violet/80 text-white font-bold tracking-widest uppercase text-[10px] shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all hover:scale-105" asChild>
              <Link href="/auth/sign-up">Desbloquear Sistema</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-32 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[10px] font-black uppercase tracking-widest mb-8 animate-fade-in">
            <Activity className="w-3 h-3" /> Sistema Neural de Produtividade
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-[1.1] max-w-4xl">
            O SEU COCKPIT TÁTICO DE <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-violet to-brand-cyan drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]">
              ALTA PERFORMANCE
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance font-medium leading-relaxed">
            Não é apenas um gerenciador de tarefas. É um hub neural que cruza hiperfoco, controle de carga cognitiva e repetição espaçada para blindar a sua rotina.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center w-full sm:w-auto">
            <Button size="lg" className="h-14 px-8 bg-white text-black hover:bg-white/90 font-black tracking-widest uppercase text-xs transition-all hover:scale-105" asChild>
              <Link href="/auth/sign-up">
                Adquirir Acesso Premium <ChevronRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 border-white/10 bg-black/40 hover:bg-white/5 text-white font-bold tracking-widest uppercase text-xs backdrop-blur-md" asChild>
              <Link href="/auth/login">
                Entrar no Sistema
              </Link>
            </Button>
          </div>
        </section>

        {/* Features Matrix */}
        <section className="border-y border-white/5 bg-black/40 backdrop-blur-xl py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-4">Arquitetura do Sistema</h2>
              <p className="text-muted-foreground text-sm uppercase tracking-wider font-mono">Tecnologia de ponta para quem valoriza o próprio tempo</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <FeatureCard
                icon={<Brain className="w-6 h-6 text-brand-cyan" />}
                title="Motor Cognitivo"
                description="O sistema monitora sua carga mental e sugere as missões certas para o seu nível de energia atual."
              />
              <FeatureCard
                icon={<Zap className="w-6 h-6 text-brand-violet" />}
                title="Repetição Espaçada"
                description="Missões concluídas geram revisões automáticas no futuro para você consolidar conhecimento."
              />
              <FeatureCard
                icon={<Target className="w-6 h-6 text-emerald-400" />}
                title="Modo Zen & Foco"
                description="Timer Pomodoro nativo integrado ao Spotify. Cancele o ruído e entre em estado de fluxo instantâneo."
              />
              <FeatureCard
                icon={<Calendar className="w-6 h-6 text-sky-400" />}
                title="Radar Tático"
                description="Visualize prazos e janelas de revisão em um cronograma visual, limpo e direto ao ponto."
              />
              <FeatureCard
                icon={<Activity className="w-6 h-6 text-orange-400" />}
                title="Telemetria & XP"
                description="Ganhe experiência ao abater missões urgentes e acompanhe sua evolução em tempo real."
              />
              <FeatureCard
                icon={<ShieldCheck className="w-6 h-6 text-white" />}
                title="Blindagem de Dados"
                description="Seu progresso sincronizado na nuvem com criptografia de ponta. Total privacidade."
              />
            </div>
          </div>
        </section>

        {/* CTA Terminal */}
        <section className="container mx-auto px-4 py-32 text-center relative">
           <div className="absolute inset-0 bg-brand-violet/5 blur-[100px] rounded-full pointer-events-none max-w-3xl mx-auto" />
           <div className="relative z-10">
            <h2 className="text-4xl font-black text-white mb-6 uppercase tracking-tighter">
              A Ferramenta Definitiva
            </h2>
            <p className="text-muted-foreground mb-10 max-w-md mx-auto">
              Pare de pular de aplicativo em aplicativo. Assine o FocusOS e tenha o controle absoluto da sua produtividade.
            </p>
            <Button size="lg" className="h-14 px-10 bg-brand-violet hover:bg-brand-violet/80 text-white font-black tracking-widest uppercase shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all hover:scale-105" asChild>
              <Link href="/auth/sign-up">
                Assinar FocusOS Agora
              </Link>
            </Button>
           </div>
        </section>
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-white/5 bg-black/60 py-8">
        <div className="container mx-auto px-4 text-center flex flex-col items-center gap-4 text-muted-foreground">
          <Logo className="w-6 h-6 opacity-50 grayscale" />
          <p className="text-[10px] font-mono uppercase tracking-widest">FocusOS Neural Productivity Hub © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-8 rounded-[24px] bg-black/40 border border-white/5 hover:border-brand-violet/30 hover:bg-white/[0.02] transition-all group hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(139,92,246,0.1)]">
      <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
        {icon}
      </div>
      <h3 className="text-lg font-black text-white mb-3 uppercase tracking-wider">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}