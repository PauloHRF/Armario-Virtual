import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FotoPeca from '../../shared/FotoPeca'
import Vazio from '../../shared/Vazio'
import type { Peca } from '../../shared/types'
import { PAPEIS, parear } from './pareamento'

// Escolha uma peça e veja, por tipo, o que combina com ela e por quê.
export default function Pareamentos({ pecas }: { pecas: Peca[] }) {
  const [baseId, setBaseId] = useState<string | null>(null)
  const [escolhidas, setEscolhidas] = useState<string[]>([])
  const navegar = useNavigate()

  const base = pecas.find((p) => p.id === baseId)
  const pares = useMemo(() => (base ? parear(base, pecas) : null), [base, pecas])

  function escolherBase(id: string) {
    setBaseId(id)
    setEscolhidas([])
  }
  const alternar = (id: string) => setEscolhidas((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]))

  if (pecas.length < 2) {
    return <Vazio emoji="🧩" titulo="Poucas peças para parear" texto="Cadastre pelo menos duas peças no armário para ver o que combina com o quê." />
  }

  const total = pares ? PAPEIS.reduce((n, { papel }) => n + pares[papel].length, 0) : 0

  return (
    <div>
      <p className="mb-2 text-sm text-stone-600">Escolha uma peça:</p>
      <ul className="sem-barra -mx-4 flex gap-2 overflow-x-auto px-4 py-2">
        {pecas.map((p) => (
          <li key={p.id} className="shrink-0">
            <button onClick={() => escolherBase(p.id)} aria-pressed={p.id === baseId} aria-label={`Parear ${p.categoria} ${p.cor}`}>
              <FotoPeca
                foto={p.foto}
                className={`size-20 rounded-xl bg-stone-100 object-cover ${p.id === baseId ? 'ring-2 ring-sky-500 ring-offset-2 ring-offset-stone-50' : 'ring-1 ring-stone-200'}`}
              />
            </button>
          </li>
        ))}
      </ul>

      {!base && <p className="mt-4 text-center text-sm text-stone-500">Toque em uma peça para ver o que combina com ela.</p>}

      {base && pares && (
        <div className="mt-4 space-y-6">
          {total === 0 && (
            <Vazio
              emoji="🤷"
              titulo="Nada combina ainda"
              texto={`Não achei peças que combinem com este ${base.categoria}. Cadastre peças neutras ou do mesmo estilo (${base.estilo}).`}
            />
          )}
          {PAPEIS.filter(({ papel }) => pares[papel].length > 0).map(({ papel, titulo }) => (
            <section key={papel}>
              <h2 className="mb-2 font-display text-base font-semibold">{titulo}</h2>
              <ul className="grid grid-cols-2 gap-3">
                {pares[papel].map(({ peca, motivo }) => {
                  const marcada = escolhidas.includes(peca.id)
                  return (
                    <li key={peca.id}>
                      <button
                        onClick={() => alternar(peca.id)}
                        aria-pressed={marcada}
                        className={`relative w-full overflow-hidden rounded-2xl bg-card text-left sombra ring-1 ${marcada ? 'ring-2 ring-sky-500' : 'ring-stone-200'}`}
                      >
                        <FotoPeca foto={peca.foto} className="aspect-square w-full bg-stone-100 object-cover" />
                        {marcada && (
                          <span className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-sky-500 text-sm text-white">✓</span>
                        )}
                        <p className="p-2 text-xs text-stone-600 first-letter:uppercase">{motivo}</p>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}

          {total > 0 && (
            <button
              onClick={() => navegar('/montar', { state: { pecaIds: [base.id, ...escolhidas] } })}
              className="min-h-12 w-full rounded-2xl bg-sky-500 font-semibold text-white sombra-alta"
            >
              {escolhidas.length ? `Montar look com ${escolhidas.length + 1} peças` : 'Abrir só esta peça no Montar'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
