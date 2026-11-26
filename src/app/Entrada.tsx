import { AuthClient, type Session } from '@supabase/auth-js'
import { useEffect, useState } from 'react'
import { selecionarConta } from '../shared/bancoLocal'
import App from './App'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const chave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
const retorno = new URL(import.meta.env.BASE_URL, window.location.origin).href
const paginasAntigas = location.hostname === 'paulohrf.github.io' && import.meta.env.BASE_URL === '/Armario-Virtual/'
const cliente = url?.startsWith('https://') && chave?.startsWith('sb_publishable_')
  ? new AuthClient({
      url: url.replace(/\/$/, '') + '/auth/v1',
      headers: { apikey: chave },
      storageKey: 'armario-auth-' + new URL(url).hostname,
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    })
  : null

const params = new URLSearchParams(location.search)
const retornoComErro = params.has('error') || new URLSearchParams(location.hash.slice(1)).has('error')
const voltouDoGoogle = params.has('code') || retornoComErro

export default function Entrada() {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(!!cliente)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!cliente) return
    let ativo = true
    let dono: string | undefined
    const { data } = cliente.onAuthStateChange((evento, atual) => {
      if (!ativo) return
      if (dono && dono !== atual?.user.id) {
        window.location.replace(retorno)
        return
      }
      if (atual) {
        dono = atual.user.id
        selecionarConta(dono)
      }
      if (evento === 'INITIAL_SESSION' && voltouDoGoogle && !atual) {
        setErro('O login com Google não foi concluído. Tente novamente.')
      }
      setSessao(atual)
      setCarregando(false)
    })
    return () => { ativo = false; data.subscription.unsubscribe() }
  }, [])

  async function entrar() {
    if (!cliente) return
    setOcupado(true)
    setErro('')
    try {
      const { error } = await cliente.signInWithOAuth({ provider: 'google', options: { redirectTo: retorno } })
      if (!error) return
    } catch { /* exibe uma mensagem também em caso de falha de conexão */ }
    setErro('Não consegui abrir o login com Google. Tente novamente.')
    setOcupado(false)
  }

  async function sair() {
    if (!cliente) return
    setOcupado(true)
    try {
      const { error } = await cliente.signOut({ scope: 'local' })
      if (!error) return
    } catch { /* permite tentar novamente */ }
    setErro('Não consegui sair da conta. Tente novamente.')
    setOcupado(false)
  }

  if (!cliente && paginasAntigas) return <App />
  if (carregando) return <main className="p-6 text-center" role="status">Verificando sua conta…</main>
  if (sessao) return <App conta={{ email: sessao.user.email, sair, ocupado, erro }} />

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 p-6">
      <h1 className="font-display text-titulo font-semibold">Armário Virtual</h1>
      {cliente ? (
        <>
          <p>Entre para abrir seu armário neste aparelho.</p>
          <button type="button" onClick={entrar} disabled={ocupado} className="min-h-12 rounded-xl bg-fill px-4 font-semibold text-on-fill disabled:opacity-50">
            {ocupado ? 'Abrindo o Google…' : 'Entrar com Google'}
          </button>
        </>
      ) : <p role="alert">O login ainda precisa ser configurado neste endereço.</p>}
      {erro && <p role="alert" className="text-sm text-perigo">{erro}</p>}
    </main>
  )
}
