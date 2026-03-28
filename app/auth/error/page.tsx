import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ShieldAlert, ArrowLeft, Terminal } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4 relative overflow-hidden">
      
      {/* Efeito Neon no Fundo (Vermelho/Erro) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-black/60 border border-rose-500/20 p-8 rounded-[32px] backdrop-blur-xl shadow-2xl relative z-10 text-center animate-in fade-in zoom-in-95 duration-500">
        
        {/* Logo FocusOS */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-violet/10 border border-brand-violet/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <ShieldAlert className="w-5 h-5 text-brand-violet" />
          </div>
          <span className="text-xl font-black text-white uppercase tracking-[0.2em] italic">FocusOS</span>
        </div>

        {/* Ícone Central de Erro com Animação */}
        <div className="mx-auto w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(244,63,94,0.15)] relative">
          <div className="absolute inset-0 rounded-full border-t-2 border-rose-500/50 animate-pulse" />
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </div>

        {/* Título e Texto */}
        <h2 className="text-xl font-black text-rose-500 uppercase tracking-widest mb-3">
          Falha de Autenticação
        </h2>
        
        <p className="text-sm text-white/60 leading-relaxed mb-6 font-medium">
          Ocorreu um erro crítico durante a validação das suas credenciais. O elo neural não pôde ser estabelecido com o servidor.
        </p>

        {/* Caixa de Aviso (Suporte) */}
        <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl mb-8">
          <p className="text-[10px] uppercase font-bold tracking-widest text-rose-400/80 leading-relaxed">
            Código de Status: 401_UNAUTHORIZED <br/> 
            <span className="text-white/40">Se o problema persistir, contate a administração do sistema.</span>
          </p>
        </div>

        {/* Botões de Retorno */}
        <div className="flex flex-col gap-3">
          <Button asChild className="w-full h-12 bg-white hover:bg-gray-200 text-black font-black uppercase tracking-widest rounded-xl transition-all group shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">
            <Link href="/auth/login">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Retornar ao Terminal
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full h-12 bg-black/40 border-white/10 text-white hover:bg-white/5 hover:text-white font-black uppercase tracking-widest rounded-xl transition-all">
            <Link href="/auth/sign-up">
              <Terminal className="w-4 h-4 mr-2" /> Solicitar Nova Credencial
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}