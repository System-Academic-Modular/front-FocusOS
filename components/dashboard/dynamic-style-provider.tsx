'use client'

import { useEffect } from 'react'

type Palette = {
  primary: string
  cyan: string
  emerald: string
  rose: string
  amber: string
  sky: string
}

const accentPalettes: Record<string, Palette> = {
  violet: {
    primary: '249 79% 62%',
    cyan: '193 95% 44%',
    emerald: '160 84% 39%',
    rose: '350 89% 60%',
    amber: '38 92% 50%',
    sky: '202 94% 53%',
  },
  cyan: {
    primary: '193 95% 44%',
    cyan: '187 85% 43%',
    emerald: '161 75% 37%',
    rose: '339 86% 57%',
    amber: '35 91% 53%',
    sky: '201 94% 47%',
  },
  emerald: {
    primary: '160 84% 39%',
    cyan: '188 88% 40%',
    emerald: '154 82% 37%',
    rose: '346 84% 57%',
    amber: '42 89% 52%',
    sky: '199 92% 45%',
  },
  rose: {
    primary: '350 89% 60%',
    cyan: '191 93% 45%',
    emerald: '158 78% 37%',
    rose: '344 90% 60%',
    amber: '38 93% 52%',
    sky: '204 90% 50%',
  },
  amber: {
    primary: '38 92% 50%',
    cyan: '193 91% 44%',
    emerald: '155 76% 38%',
    rose: '350 82% 59%',
    amber: '36 92% 52%',
    sky: '203 92% 51%',
  },
  sky: {
    primary: '202 94% 53%',
    cyan: '193 92% 48%',
    emerald: '160 76% 37%',
    rose: '343 86% 58%',
    amber: '39 90% 52%',
    sky: '202 94% 53%',
  },
}

const backgroundPresets: Record<string, string> = {
  aurora:
    'radial-gradient(circle at 10% 0%, hsl(var(--brand-primary-hsl) / 0.15), transparent 35%), radial-gradient(circle at 80% 10%, hsl(var(--brand-cyan-hsl) / 0.12), transparent 42%), linear-gradient(180deg, hsl(224 43% 7%), hsl(225 35% 9%))',
  ocean:
    'radial-gradient(circle at 20% -5%, hsl(var(--brand-cyan-hsl) / 0.18), transparent 45%), radial-gradient(circle at 90% 0%, hsl(var(--brand-sky-hsl) / 0.14), transparent 40%), linear-gradient(180deg, hsl(210 45% 9%), hsl(214 46% 11%))',
  graphite:
    'radial-gradient(circle at 15% 0%, hsl(var(--brand-primary-hsl) / 0.1), transparent 35%), radial-gradient(circle at 80% 5%, hsl(var(--brand-emerald-hsl) / 0.08), transparent 35%), linear-gradient(180deg, hsl(223 28% 8%), hsl(224 28% 10%))',
}

function applyPalette(colorVariable: string) {
  const palette = accentPalettes[colorVariable] || accentPalettes.violet
  const root = document.documentElement
  root.style.setProperty('--brand-primary-hsl', palette.primary)
  root.style.setProperty('--brand-cyan-hsl', palette.cyan)
  root.style.setProperty('--brand-emerald-hsl', palette.emerald)
  root.style.setProperty('--brand-rose-hsl', palette.rose)
  root.style.setProperty('--brand-amber-hsl', palette.amber)
  root.style.setProperty('--brand-sky-hsl', palette.sky)
}

function applyBackground(backgroundPreset: string) {
  const image = backgroundPresets[backgroundPreset] || backgroundPresets.aurora
  document.body.style.setProperty('--app-bg-image', image)
}

export function DynamicStyleProvider({ colorVariable }: { colorVariable: string }) {
  useEffect(() => {
    const storedColor = localStorage.getItem('taskflow-accent-color')
    const selectedColor =
      storedColor && accentPalettes[storedColor] ? storedColor : colorVariable

    const storedPreset = localStorage.getItem('taskflow-background-preset') || 'aurora'

    applyPalette(selectedColor)
    applyBackground(storedPreset)

    const onAppearanceChange = () => {
      const nextColor = localStorage.getItem('taskflow-accent-color') || colorVariable
      const nextPreset = localStorage.getItem('taskflow-background-preset') || 'aurora'
      applyPalette(nextColor)
      applyBackground(nextPreset)
    }

    window.addEventListener('taskflow-appearance-changed', onAppearanceChange)
    return () => window.removeEventListener('taskflow-appearance-changed', onAppearanceChange)
  }, [colorVariable])

  return null
}
