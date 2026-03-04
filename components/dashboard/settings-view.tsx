'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import type { ComponentType, CSSProperties } from 'react'
import { useTheme } from 'next-themes'
import {
  CheckCircle2,
  FolderTree,
  Github,
  Globe,
  Laptop,
  Loader2,
  Moon,
  Music,
  Palette,
  Plus,
  Save,
  Sun,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile } from '@/lib/actions/profile'
import { createCategory, deleteCategory, updateCategory } from '@/lib/actions/categories'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Categoria, Profile } from '@/lib/types'

const accentColors = [
  { name: 'Índigo Elétrico', hex: '#6366f1', variable: 'violet' },
  { name: 'Azul Oceano', hex: '#0ea5e9', variable: 'sky' },
  { name: 'Ciano Fluxo', hex: '#06b6d4', variable: 'cyan' },
  { name: 'Verde Vital', hex: '#10b981', variable: 'emerald' },
  { name: 'Coral Quente', hex: '#f43f5e', variable: 'rose' },
  { name: 'Âmbar Solar', hex: '#f59e0b', variable: 'amber' },
] as const

const backgroundPresets = [
  {
    id: 'aurora',
    label: 'Aurora',
    preview: 'linear-gradient(135deg,#0b1024 0%,#1b1f3a 40%,#101828 100%)',
    image:
      'radial-gradient(circle at 10% 0%, hsl(var(--brand-primary-hsl) / 0.15), transparent 35%), radial-gradient(circle at 80% 10%, hsl(var(--brand-cyan-hsl) / 0.12), transparent 42%), linear-gradient(180deg, hsl(224 43% 7%), hsl(225 35% 9%))',
  },
  {
    id: 'ocean',
    label: 'Azul Profundo',
    preview: 'linear-gradient(135deg,#0b1724 0%,#10263f 45%,#0d1a2e 100%)',
    image:
      'radial-gradient(circle at 20% -5%, hsl(var(--brand-cyan-hsl) / 0.18), transparent 45%), radial-gradient(circle at 90% 0%, hsl(var(--brand-sky-hsl) / 0.14), transparent 40%), linear-gradient(180deg, hsl(210 45% 9%), hsl(214 46% 11%))',
  },
  {
    id: 'graphite',
    label: 'Grafite',
    preview: 'linear-gradient(135deg,#121212 0%,#1a1f29 50%,#0d1117 100%)',
    image:
      'radial-gradient(circle at 15% 0%, hsl(var(--brand-primary-hsl) / 0.1), transparent 35%), radial-gradient(circle at 80% 5%, hsl(var(--brand-emerald-hsl) / 0.08), transparent 35%), linear-gradient(180deg, hsl(223 28% 8%), hsl(224 28% 10%))',
  },
] as const

type BackgroundPresetId = (typeof backgroundPresets)[number]['id']

function applyBackgroundPreset(presetId: BackgroundPresetId) {
  const preset = backgroundPresets.find((item) => item.id === presetId)
  if (!preset) return
  document.body.style.setProperty('--app-bg-image', preset.image)
}

export function SettingsView({
  user,
  profile,
  integrations,
  initialCategories,
}: {
  user: { email?: string | null }
  profile: Profile | null
  integrations: Array<{ provider: string }>
  initialCategories: Categoria[]
}) {
  const [isPending, startTransition] = useTransition()
  const { theme, setTheme } = useTheme()
  const [currentTab, setCurrentTab] = useState('profile')
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [activeColor, setActiveColor] = useState('violet')
  const [backgroundPreset, setBackgroundPreset] = useState<BackgroundPresetId>('aurora')
  const [categories, setCategories] = useState<Categoria[]>(initialCategories || [])
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState({ id: '', name: '', color: '#6366f1' })

  useEffect(() => {
    setCategories(initialCategories || [])
  }, [initialCategories])

  useEffect(() => {
    const storedPreset = localStorage.getItem('taskflow-background-preset') as BackgroundPresetId | null
    const storedAccent = localStorage.getItem('taskflow-accent-color')
    const nextPreset =
      storedPreset && backgroundPresets.some((preset) => preset.id === storedPreset)
        ? storedPreset
        : 'aurora'
    setBackgroundPreset(nextPreset)
    if (storedAccent && accentColors.some((color) => color.variable === storedAccent)) {
      setActiveColor(storedAccent)
    }
    applyBackgroundPreset(nextPreset)
  }, [])

  useEffect(() => {
    applyBackgroundPreset(backgroundPreset)
  }, [backgroundPreset])

  const activeAccent = useMemo(
    () => accentColors.find((color) => color.variable === activeColor) || accentColors[0],
    [activeColor],
  )

  function handleSaveProfile() {
    startTransition(async () => {
      const response = await updateProfile({ full_name: fullName })
      if (response.error) toast.error(response.error)
      else toast.success(response.success)
    })
  }

  function handleSaveAppearance() {
    startTransition(async () => {
      localStorage.setItem('taskflow-background-preset', backgroundPreset)
      localStorage.setItem('taskflow-accent-color', activeColor)
      applyBackgroundPreset(backgroundPreset)
      window.dispatchEvent(new Event('taskflow-appearance-changed'))
      toast.success('Aparencia atualizada com sucesso.')
    })
  }

  function handleSaveCategory() {
    if (!currentCategory.name.trim()) return

    startTransition(async () => {
      const response = currentCategory.id
        ? await updateCategory(currentCategory.id, {
            name: currentCategory.name,
            color: currentCategory.color,
          })
        : await createCategory({
            name: currentCategory.name,
            color: currentCategory.color,
          })

      if (response.error) {
        toast.error(response.error)
      } else {
        toast.success('Categoria sincronizada.')
        setIsCategoryModalOpen(false)
      }
    })
  }

  function handleRemoveCategory(categoryId: string) {
    startTransition(async () => {
      const response = await deleteCategory(categoryId)
      if (response.error) toast.error(response.error)
      else toast.success('Categoria removida.')
    })
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-20 md:flex-row">
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md border-white/10 bg-[#111827]/95 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/10">
              <CardTitle>{currentCategory.id ? 'Editar categoria' : 'Nova categoria'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsCategoryModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <Label>Nome da categoria</Label>
                <Input
                  value={currentCategory.name}
                  onChange={(event) =>
                    setCurrentCategory((previous) => ({ ...previous, name: event.target.value }))
                  }
                  className="border-white/10 bg-black/40"
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <Input
                  type="color"
                  value={currentCategory.color}
                  onChange={(event) =>
                    setCurrentCategory((previous) => ({ ...previous, color: event.target.value }))
                  }
                  className="h-12 cursor-pointer border-white/10 bg-black/40 p-1"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button variant="ghost" onClick={() => setIsCategoryModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveCategory} disabled={isPending} className="bg-brand-violet text-white">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <nav className="hidden w-64 shrink-0 flex-col gap-2 md:flex">
        <NavButton active={currentTab === 'profile'} onClick={() => setCurrentTab('profile')} icon={User} label="Perfil" />
        <NavButton
          active={currentTab === 'appearance'}
          onClick={() => setCurrentTab('appearance')}
          icon={Palette}
          label="Aparência"
        />
        <NavButton
          active={currentTab === 'workspace'}
          onClick={() => setCurrentTab('workspace')}
          icon={FolderTree}
          label="Organização"
        />
        <NavButton
          active={currentTab === 'integrations'}
          onClick={() => setCurrentTab('integrations')}
          icon={Globe}
          label="Integrações"
        />
      </nav>

      <div className="min-w-0 flex-1">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsContent value="profile">
            <Card className="border-white/10 bg-[#111827]/65 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Informações da conta</CardTitle>
                <CardDescription>Atualize seus dados principais de acesso.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20 border-2 border-white/10 ring-2 ring-brand-violet/20">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-brand-violet text-xl text-white">
                      {fullName?.substring(0, 2).toUpperCase() || 'US'}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm" disabled className="border-white/10">
                    Alterar foto
                  </Button>
                </div>
                <Separator className="bg-white/10" />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome completo</Label>
                    <Input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="border-white/10 bg-black/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email de acesso</Label>
                    <Input value={user?.email || ''} disabled className="border-white/5 bg-black/50 opacity-70" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveProfile} disabled={isPending} className="bg-brand-violet text-white">
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar perfil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card className="border-white/10 bg-[#111827]/65 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Aparência dinâmica</CardTitle>
                <CardDescription>
                  Ajuste tema, paleta e fundo para manter foco visual elegante.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-3 gap-4">
                  <ThemeBtn active={theme === 'light'} onClick={() => setTheme('light')} icon={Sun} label="Claro" />
                  <ThemeBtn active={theme === 'dark'} onClick={() => setTheme('dark')} icon={Moon} label="Escuro" />
                  <ThemeBtn active={theme === 'system'} onClick={() => setTheme('system')} icon={Laptop} label="Sistema" />
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-4">
                  <Label>Cor principal da interface</Label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {accentColors.map((color) => (
                      <button
                        key={color.variable}
                        onClick={() => setActiveColor(color.variable)}
                        className={cn(
                          'group rounded-xl border px-3 py-3 text-left transition-all',
                          activeColor === color.variable
                            ? 'border-white/50 bg-white/10 shadow-[0_0_25px_rgba(255,255,255,0.12)]'
                            : 'border-white/10 bg-black/20 hover:border-white/25',
                        )}
                      >
                        <div
                          className="mb-2 h-5 w-5 rounded-full border border-white/20"
                          style={{ backgroundColor: color.hex }}
                        />
                        <p className="text-xs font-semibold text-white">{color.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Estilo de fundo</Label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {backgroundPresets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setBackgroundPreset(preset.id)}
                        className={cn(
                          'rounded-xl border p-2 text-left transition-all',
                          backgroundPreset === preset.id
                            ? 'border-white/50 shadow-[0_0_22px_rgba(59,130,246,0.18)]'
                            : 'border-white/10 hover:border-white/25',
                        )}
                      >
                        <div className="h-16 rounded-lg border border-white/10" style={{ background: preset.preview }} />
                        <p className="mt-2 text-xs font-medium text-white/90">{preset.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Prévia ativa</p>
                  <p className="mt-1 text-sm text-white">
                    Cor: <span style={{ color: activeAccent.hex }}>{activeAccent.name}</span> · Fundo:{' '}
                    {backgroundPresets.find((preset) => preset.id === backgroundPreset)?.label}
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveAppearance} disabled={isPending} className="bg-brand-violet text-white">
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Aplicar preferências
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workspace">
            <Card className="border-white/10 bg-[#111827]/65 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FolderTree className="h-5 w-5 text-brand-cyan" />
                    Suas categorias
                  </CardTitle>
                  <CardDescription>Base para Kanban, relatórios e barras de maestria.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10"
                  onClick={() => {
                    setCurrentCategory({ id: '', name: '', color: '#6366f1' })
                    setIsCategoryModalOpen(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <Badge
                        key={category.id}
                        variant="outline"
                        className="group border-white/10 bg-black/20 px-3 py-1.5 transition-all hover:border-brand-violet/50"
                      >
                        <div className="mr-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                        {category.name}
                        <button
                          onClick={() => {
                            setCurrentCategory({
                              id: category.id,
                              name: category.name,
                              color: category.color,
                            })
                            setIsCategoryModalOpen(true)
                          }}
                          className="ml-2 text-[10px] font-semibold uppercase text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-white"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleRemoveCategory(category.id)}
                          className="ml-2 text-rose-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-200"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      Crie categorias para organizar suas metas por contexto.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card className="border-white/10 bg-[#111827]/65 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Conexões de produtividade</CardTitle>
                <CardDescription>Ative integrações para automações mais inteligentes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <IntegrationCard
                  icon="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg"
                  title="Google Calendar"
                  description="Sincronize prazos automaticamente."
                  connected={integrations.some((integration) => integration.provider === 'google_calendar')}
                />
                <IntegrationCard
                  lucideIcon={Github}
                  title="GitHub"
                  description="Issues e PRs direto no seu fluxo."
                  connected={false}
                />
                <IntegrationCard
                  lucideIcon={Music}
                  iconColor="#1DB954"
                  title="Spotify"
                  description="Use playlists para ciclos de foco e respiro."
                  connected={integrations.some((integration) => integration.provider === 'spotify')}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function NavButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <Button
      variant={active ? 'secondary' : 'ghost'}
      className={cn(
        'justify-start gap-3',
        active && 'rounded-none border-l-2 border-brand-violet bg-brand-violet/10 text-brand-violet',
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  )
}

function ThemeBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all',
        active
          ? 'border-brand-violet bg-brand-violet/10 text-brand-violet'
          : 'border-white/10 bg-black/20 text-muted-foreground hover:border-white/25',
      )}
    >
      <Icon className="mb-2 h-6 w-6" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

function IntegrationCard({
  icon,
  lucideIcon: Icon,
  title,
  description,
  connected,
  iconColor,
}: {
  icon?: string
  lucideIcon?: ComponentType<{ className?: string; style?: CSSProperties }>
  title: string
  description: string
  connected: boolean
  iconColor?: string
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
          {icon ? (
            <img src={icon} alt={title} className="h-7 w-7 object-contain" />
          ) : Icon ? (
            <Icon className="h-7 w-7" style={{ color: iconColor }} />
          ) : null}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button
        variant={connected ? 'destructive' : 'outline'}
        size="sm"
        className={cn(!connected && 'border-white/10 hover:bg-white/5')}
      >
        {connected ? 'Desconectar' : 'Conectar'}
      </Button>
    </div>
  )
}
