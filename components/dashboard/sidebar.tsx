'use client'

import { Logo } from '@/components/ui/logo'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/dashboard/sidebar-context'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, CheckSquare, Network, Map, CalendarRange, 
  Target, Settings, Columns, Timer, X, Users, Flame
} from 'lucide-react'

interface DashboardSidebarProps {
  user: User
  profile: Profile | null
  streak?: number 
}

const navigation = [
  { name: 'Timeline', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Equipes', href: '/dashboard/teams', icon: Users },
  { name: 'Calendário Master', href: '/dashboard/calendar', icon: CalendarRange },
  { name: 'Roadmap', href: '/dashboard/roadmap', icon: Map },
  { name: 'Árvore de Projetos', href: '/dashboard/projects', icon: Network },
  { name: 'Quadro Kanban', href: '/dashboard/kanban', icon: Columns },
  { name: 'Minhas Tarefas', href: '/dashboard/tasks', icon: CheckSquare },
  { name: 'Modo Foco', href: '/dashboard/pomodoro', icon: Timer },
  { name: 'Performance', href: '/dashboard/reports', icon: Target },
]

export function DashboardSidebar({ streak = 0 }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { isOpen, close, toggle } = useSidebar()
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Controle de viewport para mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) close()
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [close])

  // Fecha a sidebar no mobile quando muda de página
  useEffect(() => {
    if (isMobile) close()
  }, [pathname, isMobile, close]) 

  const isVisible = useMemo(() => isMobile ? isOpen : (isOpen || isHovered), [isMobile, isOpen, isHovered])

  return (
    <>
      {/* Área sensível invisível para abrir a sidebar no desktop com hover */}
      {!isMobile && !isOpen && (
        <div 
          className="fixed inset-y-0 left-0 w-4 z-40 bg-transparent cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
        />
      )}

      {/* Fundo escurecido para mobile (Overlay) */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] animate-in fade-in duration-300"
          onClick={close}
        />
      )}

      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0a0c]/95 backdrop-blur-3xl border-r border-white/5 shadow-[20px_0_50px_rgba(0,0,0,0.5)] flex flex-col h-[100dvh] transition-transform duration-500 cubic-bezier(0.22, 1, 0.36, 1)",
          isVisible ? "translate-x-0" : "-translate-x-full"
        )}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
      >
        {/* Cabeçalho da Sidebar */}
        <div className="flex h-20 shrink-0 items-center justify-between px-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8 transition-transform duration-300 group-hover:rotate-12 shadow-[0_0_15px_rgba(139,92,246,0.3)]" />
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter uppercase text-white leading-none">
                FocusOS
              </span>
              <span className="text-[9px] text-brand-violet font-bold tracking-[0.2em] uppercase">
                Terminal
              </span>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={isMobile ? close : toggle} 
            className="text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            {isMobile ? <X className="h-5 w-5" /> : (
                <div className={cn(
                  "w-1 h-5 rounded-full transition-all duration-500", 
                  isOpen ? "bg-brand-violet shadow-[0_0_10px_rgba(139,92,246,0.8)]" : "bg-white/20"
                )} />
            )}
          </Button>
        </div>

        {/* Corpo da Sidebar (Menu) */}
        <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
          
          {/* Caixa de Streak */}
          <div className="mb-6 relative group">
            <div className="absolute inset-0 bg-orange-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-black/40 rounded-2xl p-4 border border-white/5 flex items-center gap-4 transition-all duration-300 group-hover:border-orange-500/30">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                  <Flame className={cn("h-5 w-5 text-orange-500", streak > 0 && "animate-pulse")} />
                </div>
                <div>
                  <div className="text-lg font-black text-white leading-none">
                    {streak} {streak === 1 ? 'Dia' : 'Dias'}
                  </div>
                  <div className="text-[9px] text-orange-500/70 uppercase tracking-[0.2em] font-bold mt-1">Sequência</div>
                </div>
            </div>
          </div>

          {/* Links de Navegação */}
          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard' 
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)

              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start text-xs font-bold uppercase tracking-wider transition-all duration-300 h-12 relative group rounded-xl',
                      isActive 
                        ? 'bg-brand-violet/10 text-brand-violet' 
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="activeBar"
                        className="absolute left-0 top-3 bottom-3 w-1 bg-brand-violet rounded-full shadow-[0_0_10px_rgba(139,92,246,0.8)]" 
                      />
                    )}
                    <item.icon className={cn(
                      "mr-3 h-4 w-4 transition-all duration-300", 
                      isActive ? "text-brand-violet" : "text-white/40 group-hover:text-white"
                    )} />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar (Settings) */}
        <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
            <Link href="/dashboard/settings">
                <Button 
                  variant="ghost" 
                  className={cn(
                    "w-full justify-start text-[10px] uppercase font-black tracking-widest text-white/50 hover:text-white hover:bg-white/5 h-12 rounded-xl transition-all group",
                    pathname === '/dashboard/settings' && "bg-white/5 text-white"
                  )}
                >
                    <Settings className="mr-3 h-4 w-4 transition-transform group-hover:rotate-90 duration-500" />
                    Ajustes de Sistema
                </Button>
            </Link>
        </div>
      </aside>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139, 92, 246, 0.3); }
      `}</style>
    </>
  )
}