import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { features } from '../features'

export default function App() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <main className="flex-1 p-4 pb-24">
        <Routes>
          <Route path="/" element={<Navigate to={features[0].rota} replace />} />
          {features.map((f) => (
            <Route key={f.id} path={f.rota} element={<f.componente />} />
          ))}
        </Routes>
      </main>
      <nav className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-white">
        <ul className="mx-auto flex max-w-md">
          {features.map((f) => (
            <li key={f.id} className="flex-1">
              <NavLink
                to={f.rota}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2 text-xs ${isActive ? 'font-semibold text-stone-900' : 'text-stone-500'}`
                }
              >
                <span className="text-xl" aria-hidden>{f.icone}</span>
                {f.nome}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
