import { Logo } from '@/components/ui/logo'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] relative overflow-hidden font-sans">
        {/* Glows de Fundo */}
        <div className="absolute top-1/4 left-1/4 w-[30vw] h-[30vw] bg-brand-violet/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-brand-cyan/10 blur-[120px] rounded-full pointer-events-none" />
        
        {/* Cápsula de Autenticação */}
        <div className="z-10 w-full max-w-md p-8 sm:p-10 rounded-[32px] border border-white/10 bg-black/60 backdrop-blur-2xl shadow-2xl relative">
            
            {/* Decoração Tech na Borda */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-brand-violet to-transparent opacity-50" />

            <div className="flex flex-col items-center mb-8 text-center">
                <Link href="/" className="group flex flex-col items-center">
                  <Logo className="w-16 h-16 mb-5 drop-shadow-[0_0_20px_rgba(139,92,246,0.5)] group-hover:scale-105 transition-transform" />
                  <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-white">FocusOS</h1>
                </Link>
                <div className="flex items-center gap-2 mt-3 text-[9px] text-brand-cyan uppercase tracking-widest font-mono bg-brand-cyan/10 border border-brand-cyan/20 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
                  Conexão Neural Segura
                </div>
            </div>
            
            {/* O formulário de login/cadastro vai aparecer exatamente aqui dentro */}
            <div className="auth-form-container">
              {children}
            </div>
            
        </div>
    </div>
  )
}