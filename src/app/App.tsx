import { useState, type ReactNode } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { features } from '../features'

// Abas principais na barra; o resto fica em "Mais", para o menu não ficar carregado.
const PRINCIPAIS = ['armario', 'combinacoes', 'montar', 'diario']

const tracos = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

// Ícones de traço, um por aba (chave = id da feature).
const ICONES: Record<string, ReactNode> = {
  armario: <path d="M12 4a2 2 0 1 1 2 2c-1 .4-2 1-2 2v1M12 9 3.5 15.2a1.4 1.4 0 0 0 .8 2.5h15.4a1.4 1.4 0 0 0 .8-2.5L12 9Z" />,
  combinacoes: <path d="m12 3 1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3L12 3Zm6 11 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z" />,
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

const aba = (ativa: boolean) =>
  `flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-xs transition ${ativa ? 'font-semibold text-sky-600' : 'text-stone-500'}`

export default function App() {
  const [mais, setMais] = useState(false)
  const { pathname } = useLocation()
  const principais = features.filter((f) => PRINCIPAIS.includes(f.id))
  const outras = features.filter((f) => !PRINCIPAIS.includes(f.id))
  const emOutra = outras.some((f) => pathname.endsWith(f.rota))

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-10 border-b border-stone-200/70 bg-stone-50/90 px-4 py-3 backdrop-blur">
        <p className="font-display text-base font-semibold tracking-tight">
          Armário <span className="text-sky-500">Virtual</span>
        </p>
      </header>
      <main className="flex-1 p-4 pb-28">
        <Routes>
          <Route path="/" element={<Navigate to={features[0].rota} replace />} />
          {features.map((f) => (
            <Route key={f.id} path={f.rota} element={<f.componente />} />
          ))}
        </Routes>
      </main>

      {mais && <button aria-label="Fechar menu" className="fixed inset-0 z-10 cursor-default bg-stone-900/20" onClick={() => setMais(false)} />}
      <nav className="fixed inset-x-0 bottom-0 z-20 px-3 pb-3">
        {mais && (
          <ul className="mx-auto mb-2 max-w-md rounded-2xl border border-stone-200 bg-white p-1 sombra-alta">
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
        <ul className="mx-auto flex max-w-md rounded-2xl border border-stone-200 bg-white/95 p-1 sombra-alta backdrop-blur">
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
