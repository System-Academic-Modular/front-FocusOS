import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Mail, ShieldCheck, ArrowRight } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4 relative overflow-hidden">
      
      {/* Efeito Neon no Fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-violet/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-black/60 border border-white/10 p-8 rounded-[32px] backdrop-blur-xl shadow-2xl relative z-10 text-center animate-in fade-in zoom-in-95 duration-500">
        
        {/* Logo FocusOS */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-violet/10 border border-brand-violet/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <ShieldCheck className="w-5 h-5 text-brand-violet" />
          </div>
          <span className="text-xl font-black text-white uppercase tracking-[0.2em] italic">FocusOS</span>
        </div>

        {/* Ícone Central de E-mail com Animação */}
        <div className="mx-auto w-20 h-20 bg-brand-cyan/10 border border-brand-cyan/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative">
          <div className="absolute inset-0 rounded-full border-t-2 border-brand-cyan/50 animate-[spin_3s_linear_infinite]" />
          <Mail className="w-8 h-8 text-brand-cyan" />
        </div>

        {/* Título e Texto */}
        <h2 className="text-xl font-black text-white uppercase tracking-widest mb-3">
          Protocolo Despachado
        </h2>
        
        <p className="text-sm text-white/60 leading-relaxed mb-6 font-medium">
          Enviámos um link de confirmação criptografado para o seu e-mail. 
          Verifique a sua caixa de entrada para estabelecer o elo neural.
        </p>

        {/* Caixa de Aviso (Spam) */}
        <div className="p-4 bg-white/5 border border-white/5 rounded-xl mb-8">
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground leading-relaxed">
            Não recebeu o pacote de dados? <br/> 
            <span className="text-white/40">Verifique a pasta de Spam ou tente registrar-se novamente.</span>
          </p>
        </div>

        {/* Botão de Retorno */}
        <Button asChild className="w-full h-12 bg-white hover:bg-gray-200 text-black font-black uppercase tracking-widest rounded-xl transition-all group shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">
          <Link href="/auth/login">
            Retornar ao Terminal <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
    </div>
  )
}