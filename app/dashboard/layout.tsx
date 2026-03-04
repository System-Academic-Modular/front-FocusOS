import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { SidebarProvider, SidebarMain } from '@/components/dashboard/sidebar-context'
import { TopHeader } from '@/components/dashboard/top-header'
import { ThemeProvider } from '@/components/theme-provider'
import { DynamicStyleProvider } from '@/components/dashboard/dynamic-style-provider'
import { TaskContextProvider } from '@/components/dashboard/task-context'
import { getTaskContextValue } from '@/lib/task-context'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: categories }, { data: teamMemberships }, initialTaskContextValue] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('categories').select('*').eq('user_id', user.id),
    supabase
      .from('team_members')
      .select('team:teams(id, name)')
      .eq('user_id', user.id),
    getTaskContextValue(),
  ])

  const teams = (teamMemberships || [])
    .map((membership: any) => membership.team)
    .filter((team: any) => team && team.id && team.name)
    .map((team: any) => ({ id: team.id as string, name: team.name as string }))

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={profile?.theme_mode || "dark"}
      enableSystem
      disableTransitionOnChange
    >
      <DynamicStyleProvider colorVariable={profile?.theme_color || 'violet'} />

      <TaskContextProvider initialValue={initialTaskContextValue} teams={teams}>
        <SidebarProvider>
          <div className="min-h-screen bg-background text-foreground flex overflow-hidden transition-colors duration-300">
            <DashboardSidebar user={user} profile={profile} streak={0} />

            <SidebarMain>
              <TopHeader user={user} profile={profile} categories={categories || []} />
              <main className="flex-1 overflow-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="max-w-7xl mx-auto h-full">
                  {children}
                </div>
              </main>
            </SidebarMain>
          </div>
        </SidebarProvider>
      </TaskContextProvider>
    </ThemeProvider>
  )
}
