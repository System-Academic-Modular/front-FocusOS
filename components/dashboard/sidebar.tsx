'use client'

import { Logo } from '@/components/ui/logo' // <- Nossa Logo importada aqui!
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/dashboard/sidebar-context'
import {
  LayoutDashboard, CheckSquare, Network, Map, CalendarRange, 
  Target, Settings, Columns, Timer, X, Users
} from 'lucide-react'

// ATUALIZAÇÃO AQUI: Adicionando 'streak' na interface
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

export function DashboardSidebar({ user, profile, streak = 0 }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { isOpen, close, toggle } = useSidebar()
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isMobile) {
      close()
    }
  }, [pathname]) 

  const isVisible = isMobile ? isOpen : (isOpen || isHovered)

  return (
    <>
      {!isMobile && !isOpen && (
        <div 
          className="fixed inset-y-0 left-0 w-6 z-40 bg-transparent hover:bg-white/5 transition-colors"
          onMouseEnter={() => setIsHovered(true)}
        />
      )}

      {(isOpen && isMobile) && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={close}
        />
      )}

      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-[#09090b]/95 backdrop-blur-xl border-r border-white/10 shadow-2xl transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col h-[100dvh]",
          isVisible ? "translate-x-0" : "-translate-x-full"
        )}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-white/5 bg-black/20">
          
          {/* ==================================================== */}
          {/* NOSSA LOGO APLICADA AQUI NO HEADER DA SIDEBAR! */}
          {/* ==================================================== */}
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8 hover:scale-110 transition-transform cursor-pointer drop-shadow-[0_0_10px_rgba(139,92,246,0.6)]" />
            <span className="text-xl font-bold tracking-widest uppercase text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
              FocusOS
            </span>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={isMobile ? close : toggle} 
            className="text-muted-foreground hover:text-white hover:bg-white/10 rounded-full"
          >
            {isMobile ? <X className="h-5 w-5" /> : (
                <div className={cn("w-2 h-2 rounded-full transition-colors", isOpen ? "bg-brand-violet shadow-neon-violet" : "bg-white/20")} />
            )}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          
          {/* WIDGET STREAK DINÂMICO AQUI */}
          <div className="mb-6 mx-2 bg-gradient-to-r from-orange-500/10 to-amber-500/5 rounded-xl p-3 border border-orange-500/20 flex items-center justify-between group cursor-pointer hover:border-orange-500/40 transition-colors">
              <div className="flex items-center gap-3">
                  <span className="text-xl animate-pulse drop-shadow-lg">🔥</span>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-orange-200 transition-colors">
                        {streak} {streak === 1 ? 'Dia' : 'Dias'}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Sequência</div>
                  </div>
              </div>
          </div>

          <nav className="flex flex-1 flex-col space-y-1">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard' 
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)

              return (
                <Link key={item.name} href={item.href} onClick={() => { if(isMobile) close() }}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start text-sm font-medium mb-1 transition-all h-11 relative overflow-hidden group',
                      isActive 
                        ? 'bg-brand-violet/10 text-brand-violet' 
                        : 'text-muted-foreground hover:text-white hover:bg-white/5'
                    )}
                  >
                    {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-violet shadow-[0_0_10px_2px_rgba(139,92,246,0.5)]" />
                    )}
                    <item.icon className={cn("mr-3 h-5 w-5 transition-transform group-hover:scale-110", isActive && "text-brand-violet")} />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
            <Link href="/dashboard/settings" onClick={() => { if(isMobile) close() }}>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-white hover:bg-white/5 h-11">
                    <Settings className="mr-3 h-5 w-5" />
                    Ajustes
                </Button>
            </Link>
        </div>
      </aside>
    </>
  )
}