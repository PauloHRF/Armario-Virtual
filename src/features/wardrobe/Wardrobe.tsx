import { useEffect, useState } from 'react'
import Tela from '../../shared/Tela'
import { listarPecas, removerPeca, salvarPeca } from '../../shared/storage'
import { CATEGORIAS, CORES, ESTACOES, OCASIOES, type Categoria, type Peca } from '../../shared/types'
import FormPeca from './FormPeca'
import FotoPeca from '../../shared/FotoPeca'

export default function Wardrobe() {
  const [pecas, setPecas] = useState<Peca[]>([])
  const [carregou, setCarregou] = useState(false)
  const [filtro, setFiltro] = useState<Categoria | 'todas'>('todas')
  const [extra, setExtra] = useState('') // '', '★', uma estação ou uma ocasião
  const [editando, setEditando] = useState<Peca | 'nova' | null>(null)

  async function recarregar() {
    setPecas(await listarPecas())
    setCarregou(true)
  }
  useEffect(() => {
    recarregar()
  }, [])

  async function salvar(peca: Peca) {
    await salvarPeca(peca)
    await recarregar()
    setEditando(null)
  }

  async function remover(peca: Peca) {
    if (!confirm(`Remover esta ${peca.categoria}?`)) return
    await removerPeca(peca.id)
    await recarregar()
    setEditando(null)
  }

  if (editando) {
    return (
      <>
        <FormPeca
          key={editando === 'nova' ? 'nova' : editando.id}
          peca={editando === 'nova' ? null : editando}
          aoSalvar={salvar}
          aoCancelar={() => setEditando(null)}
        />
        {editando !== 'nova' && (
          <button onClick={() => remover(editando)} className="mt-4 w-full rounded-xl border border-red-200 p-3 text-red-600">
            Remover peça
          </button>
        )}
      </>
    )
  }

  const combinaExtra = (p: Peca) =>
    !extra ||
    (extra === '★' ? !!p.favorita : [...(p.estacoes ?? []), ...(p.ocasioes ?? [])].some((t) => t === extra))
  const visiveis = pecas.filter((p) => (filtro === 'todas' || p.categoria === filtro) && combinaExtra(p))

  return (
    <Tela titulo="Meu armário">
      <div className="sem-barra -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {(['todas', ...CATEGORIAS] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFiltro(c)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm capitalize transition ${filtro === c ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-600'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="sem-barra -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {(['★', ...ESTACOES, ...OCASIOES] as const).map((t) => (
          <button
            key={t}
            onClick={() => setExtra(extra === t ? '' : t)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs transition ${extra === t ? 'bg-sky-500 text-white' : 'bg-stone-100 text-stone-600'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {carregou && pecas.length === 0 && (
        <p className="text-stone-500">Seu armário está vazio. Toque em “Adicionar peça” para cadastrar a primeira.</p>
      )}
      {pecas.length > 0 && visiveis.length === 0 && <p className="text-stone-500">Nenhuma peça nessa categoria.</p>}

      <ul className="grid grid-cols-2 gap-3">
        {visiveis.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => setEditando(p)}
              className="group relative w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-stone-200 transition active:scale-[0.98]"
            >
              <div className="aspect-4/5 bg-stone-100">
                <FotoPeca foto={p.foto} className="size-full object-cover" />
              </div>
              {p.favorita && (
                <span className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-white/90 text-sky-500 shadow">★</span>
              )}
              <div className="p-3">
                <p className="font-medium capitalize">{p.categoria}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-500">
                  <span
                    className="size-3 shrink-0 rounded-full ring-1 ring-stone-300"
                    style={{ background: CORES.find((c) => c.nome === p.cor)?.hex }}
                  />
                  <span className="truncate">{[p.cor, p.estampa, p.material, p.marca].filter(Boolean).join(' · ')}</span>
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={() => setEditando('nova')}
        className="fixed right-5 bottom-24 flex items-center gap-1.5 rounded-full bg-sky-500 px-5 py-3 font-medium text-white shadow-lg shadow-sky-500/30 transition active:scale-95"
      >
        <span className="text-xl leading-none">+</span> Adicionar peça
      </button>
    </Tela>
  )
}
