import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { features } from '../features'

// Abas principais na barra; o resto fica em "Mais", para o menu não ficar carregado.
const PRINCIPAIS = ['armario', 'combinacoes', 'montar', 'diario']

const tracos = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

// Ícones de traço, um por aba (chave = id da feature).
const ICONES: Record<string, ReactNode> = {
  armario: <path d="M12 4a2 2 0 1 1 2 2c-1 .4-2 1-2 2v1M12 9 3.5 15.2a1.4 1.4 0 0 0 .8 2.5h15.4a1.4 1.4 0 0 0 .8-2.5L12 9Z" />,
  combinacoes: <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />,
  montar: <path d="M4 20 14.5 9.5m0 0 2.5-2.5a2.1 2.1 0 0 1 3 3L17.5 12.5M14.5 9.5l3 3M4 20l3.5-.5L4.5 16.5 4 20Z" />,
  diario: <path d="M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm0 4h14M8 4v4m8-4v4" />,
  mala: <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7M5 7h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Zm4 0v12m6-12v12" />,
  comprar: <path d="M6 8h12l-1 12H7L6 8Zm3 0V7a3 3 0 0 1 6 0v1" />,
  tamanhos: <path d="M3 9h18v6H3V9Zm4 0v3m4-3v2m4-2v3m4-3v2" />,
}

function Icone({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden {...tracos}>
      {ICONES[id]}
    </svg>
  )
}

type Tema = 'claro' | 'escuro'

// Tema: o que a pessoa escolheu (guardado no aparelho) ou, na primeira vez, o do sistema.
// O index.html aplica o mesmo valor antes do React carregar, para a tela não piscar.
function useTema() {
  const [tema, setTema] = useState<Tema>(() => (document.documentElement.dataset.tema === 'escuro' ? 'escuro' : 'claro'))
  useEffect(() => {
    document.documentElement.dataset.tema = tema
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', tema === 'escuro' ? '#0e1218' : '#f4f5f7')
    try {
      localStorage.setItem('tema', tema)
    } catch {
      // sem armazenamento (modo privado): o tema vale só nesta visita
    }
  }, [tema])
  return [tema, setTema] as const
}

const aba = (ativa: boolean) =>
  `flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-xs transition ${ativa ? 'font-semibold text-acento' : 'text-stone-500'}`

export default function App() {
  const [mais, setMais] = useState(false)
  const [tema, setTema] = useTema()
  const { pathname } = useLocation()
  const principais = features.filter((f) => PRINCIPAIS.includes(f.id))
  const outras = features.filter((f) => !PRINCIPAIS.includes(f.id))
  const emOutra = outras.some((f) => pathname.endsWith(f.rota))

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200/70 bg-stone-50/90 py-1 pr-1 pl-4 backdrop-blur">
        <p className="font-display text-base font-semibold tracking-wide uppercase">
          Armário <span className="text-acento">Virtual</span>
        </p>
        <button
          onClick={() => setTema(tema === 'escuro' ? 'claro' : 'escuro')}
          aria-label={tema === 'escuro' ? 'Usar tema claro' : 'Usar tema escuro'}
          className="grid size-11 place-items-center rounded-full text-stone-600"
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden {...tracos}>
            {tema === 'escuro' ? (
              <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
            ) : (
              <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
            )}
          </svg>
        </button>
      </header>
      <main className="flex-1 p-4 pb-28">
        <Routes>
          <Route path="/" element={<Navigate to={features[0].rota} replace />} />
          {features.map((f) => (
            <Route key={f.id} path={f.rota} element={<f.componente />} />
          ))}
        </Routes>
      </main>

      {mais && <button aria-label="Fechar menu" className="fixed inset-0 z-10 cursor-default bg-black/30" onClick={() => setMais(false)} />}
      <nav className="fixed inset-x-0 bottom-0 z-20 px-3 pb-3">
        {mais && (
          <ul className="mx-auto mb-2 max-w-md rounded-2xl border border-stone-200 bg-card p-1 sombra-alta">
            {outras.map((f) => (
              <li key={f.id}>
                <NavLink
                  to={f.rota}
                  onClick={() => setMais(false)}
                  className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 ${isActive ? 'bg-stone-100 font-semibold' : ''}`}
                >
                  <Icone id={f.id} />
                  {f.nome}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
        <ul className="mx-auto flex max-w-md rounded-2xl border border-stone-200 bg-card/95 p-1 sombra-alta backdrop-blur">
          {principais.map((f) => (
            <li key={f.id} className="flex-1">
              <NavLink to={f.rota} onClick={() => setMais(false)} className={({ isActive }) => aba(isActive)}>
                <Icone id={f.id} />
                {f.nome}
              </NavLink>
            </li>
          ))}
          <li className="flex-1">
            <button onClick={() => setMais(!mais)} aria-expanded={mais} className={`${aba(mais || emOutra)} w-full`}>
              <svg viewBox="0 0 24 24" className="size-6" aria-hidden {...tracos}>
                <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth={3} />
              </svg>
              Mais
            </button>
          </li>
        </ul>
      </nav>
    </div>
  )
}
