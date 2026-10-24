import type { ReactNode } from 'react'
import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { features } from '../features'

const tracos = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

// Ícones de traço, um por aba (chave = id da feature).
const ICONES: Record<string, ReactNode> = {
  armario: <path d="M12 4a2 2 0 1 1 2 2c-1 .4-2 1-2 2v1M12 9 3.5 15.2a1.4 1.4 0 0 0 .8 2.5h15.4a1.4 1.4 0 0 0 .8-2.5L12 9Z" />,
  combinacoes: <path d="m12 3 1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3L12 3Zm6 11 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z" />,
  montar: <path d="M4 20 14.5 9.5m0 0 2.5-2.5a2.1 2.1 0 0 1 3 3L17.5 12.5M14.5 9.5l3 3M4 20l3.5-.5L4.5 16.5 4 20Z" />,
  comprar: <path d="M6 8h12l-1 12H7L6 8Zm3 0V7a3 3 0 0 1 6 0v1" />,
  tamanhos: <path d="M3 9h18v6H3V9Zm4 0v3m4-3v2m4-2v3m4-3v2" />,
}

export default function App() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-10 border-b border-stone-200/70 bg-stone-50/90 px-4 py-3 backdrop-blur">
        <p className="font-display text-lg font-semibold tracking-tight">
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
      <nav className="fixed inset-x-0 bottom-0 z-10 px-3 pb-3">
        <ul className="mx-auto flex max-w-md rounded-2xl border border-stone-200 bg-white/95 p-1 shadow-lg shadow-stone-900/10 backdrop-blur">
          {features.map((f) => (
            <li key={f.id} className="flex-1">
              <NavLink
                to={f.rota}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] transition ${isActive ? 'bg-stone-900 font-semibold text-white' : 'text-stone-500'}`
                }
              >
                <svg viewBox="0 0 24 24" className="size-5" aria-hidden {...tracos}>
                  {ICONES[f.id]}
                </svg>
                {f.nome}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
