'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error('Acesso Negado', {
        description: 'Credenciais inválidas ou não encontradas no sistema.',
      })
      setIsLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full animate-in fade-in zoom-in-95 duration-300">
      
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-white uppercase tracking-widest">Autenticação</h2>
        <p className="text-[11px] text-muted-foreground mt-2 uppercase tracking-widest">Insira suas credenciais de operador</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">
            E-mail (Credencial)
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="bg-black/40 border-white/10 focus:border-brand-cyan/50 text-white h-12 rounded-xl transition-colors"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <Label htmlFor="password" className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Código de Segurança
            </Label>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="bg-black/40 border-white/10 focus:border-brand-cyan/50 text-white h-12 rounded-xl transition-colors"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 bg-brand-cyan hover:bg-brand-cyan/80 text-black font-black uppercase tracking-widest mt-6 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:-translate-y-0.5" 
          disabled={isLoading}
        >
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> AUTENTICANDO...</>
          ) : (
            'INICIAR SESSÃO'
          )}
        </Button>

        <div className="text-center mt-6 pt-6 border-t border-white/5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">
            Não possui autorização?{' '}
            <Link href="/auth/sign-up" className="text-brand-violet hover:text-white hover:underline transition-colors font-bold ml-1">
              Adquirir Acesso
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}