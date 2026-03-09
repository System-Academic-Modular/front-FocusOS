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

export default function SignUpPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${window.location.origin}/dashboard`,
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      toast.error('Acesso Negado', {
        description: error.message,
      })
      setIsLoading(false)
      return
    }

    router.push('/auth/sign-up-success')
  }

  return (
    <div className="w-full animate-in fade-in zoom-in-95 duration-300">
      
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-white uppercase tracking-widest">Aquisição de Acesso</h2>
        <p className="text-[11px] text-muted-foreground mt-2 uppercase tracking-widest">Configure sua credencial de operador</p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">
            Nome de Operador
          </Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Seu nome"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={isLoading}
            className="bg-black/40 border-white/10 focus:border-brand-violet/50 text-white h-12 rounded-xl transition-colors"
          />
        </div>

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
            className="bg-black/40 border-white/10 focus:border-brand-violet/50 text-white h-12 rounded-xl transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">
            Código de Segurança
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={isLoading}
            className="bg-black/40 border-white/10 focus:border-brand-violet/50 text-white h-12 rounded-xl transition-colors"
          />
          <p className="text-[10px] text-white/30 ml-1">Mínimo de 6 caracteres</p>
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 bg-brand-violet hover:bg-brand-violet/80 text-white font-black uppercase tracking-widest mt-6 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:-translate-y-0.5" 
          disabled={isLoading}
        >
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> ESTABELECENDO CONEXÃO...</>
          ) : (
            'CRIAR CREDENCIAL'
          )}
        </Button>

        <div className="text-center mt-6 pt-6 border-t border-white/5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">
            Já possui acesso autorizado?{' '}
            <Link href="/auth/login" className="text-brand-cyan hover:text-white hover:underline transition-colors font-bold ml-1">
              Fazer Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}