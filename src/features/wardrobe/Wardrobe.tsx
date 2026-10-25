import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Tela from '../../shared/Tela'
import { listarPecas, removerPeca, salvarPeca } from '../../shared/storage'
import { CATEGORIAS, CORES, ESTACOES, OCASIOES, type Categoria, type Peca } from '../../shared/types'
import FormPeca from './FormPeca'
import FotoPeca from '../../shared/FotoPeca'
import Vazio from '../../shared/Vazio'
import Aviso from '../../shared/Aviso'

export default function Wardrobe() {
  const [pecas, setPecas] = useState<Peca[]>([])
  const [carregou, setCarregou] = useState(false)
  const [filtro, setFiltro] = useState<Categoria | 'todas'>('todas')
  const [extra, setExtra] = useState('') // '', '★', uma estação ou uma ocasião
  const [avisos, setAvisos] = useState(0)
  const [editando, setEditando] = useState<Peca | 'nova' | null>(null)

  async function recarregar() {
    setPecas(await listarPecas())
    setCarregou(true)
  }
  useEffect(() => {
    recarregar()
  }, [])

  async function salvar(peca: Peca) {
    const nova = !pecas.some((p) => p.id === peca.id)
    await salvarPeca(peca)
    await recarregar()
    setEditando(null)
    if (nova) setAvisos((n) => n + 1)
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
    (extra === '★' ? !!p.favorita : extra === 'em cuidado' ? !!p.cuidado : [...(p.estacoes ?? []), ...(p.ocasioes ?? [])].some((t) => t === extra))
  const visiveis = pecas.filter((p) => (filtro === 'todas' || p.categoria === filtro) && combinaExtra(p))

  return (
    <Tela titulo="Meu armário">
      <Link
        to="/guias"
        className="mb-4 flex min-h-16 items-center gap-3 rounded-2xl bg-fill p-4 text-on-fill sombra-alta transition active:scale-[0.98]"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-on-fill/10 text-xl" aria-hidden>📖</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Guias de estilo</span>
          <span className="block text-sm text-on-fill/70">Barba, cores e como combinar</span>
        </span>
        <span aria-hidden>›</span>
      </Link>
      {pecas.length > 0 && (
        <>
      <div className="sem-barra -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {(['todas', ...CATEGORIAS] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFiltro(c)}
            className={`shrink-0 rounded-full border min-h-11 px-4 text-sm capitalize transition ${filtro === c ? 'border-fill bg-fill text-on-fill' : 'border-stone-200 bg-card text-stone-600'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="sem-barra -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {(['★', 'em cuidado', ...ESTACOES, ...OCASIOES] as const).map((t) => (
          <button
            key={t}
            onClick={() => setExtra(extra === t ? '' : t)}
            className={`shrink-0 rounded-full min-h-11 px-3.5 text-xs transition ${extra === t ? 'bg-sky-500 text-white' : 'bg-stone-100 text-stone-600'}`}
          >
            {t}
          </button>
        ))}
      </div>
        </>
      )}

      {carregou && pecas.length === 0 && (
        <Vazio
          emoji="👕"
          titulo="Seu armário está vazio"
          texto="Fotografe sua primeira peça. Com 6 peças já dá para receber sugestões de looks."
          acao={
            <button onClick={() => setEditando('nova')} className="min-h-12 w-full rounded-2xl bg-sky-500 font-semibold text-white sombra-alta">
              Cadastrar primeira peça
            </button>
          }
        />
      )}
      {pecas.length > 0 && visiveis.length === 0 && (
        <Vazio emoji="🔍" titulo="Nada por aqui" texto="Nenhuma peça combina com esses filtros. Tire um filtro para ver o resto." />
      )}
      <Aviso mensagem="Peça adicionada ao armário ✓" chave={avisos} />

      <ul className="grid grid-cols-2 gap-3">
        {visiveis.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => setEditando(p)}
              className="group relative w-full overflow-hidden rounded-2xl bg-card text-left sombra ring-1 ring-stone-200 transition active:scale-[0.98]"
            >
              <div className="aspect-4/5 bg-stone-100">
                <FotoPeca foto={p.foto} className="size-full object-cover" />
              </div>
              {p.cuidado && (
                <span className="absolute top-2 left-2 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white">{p.cuidado}</span>
              )}
              {p.favorita && (
                <span className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-card/90 text-acento shadow">★</span>
              )}
              <div className="p-3">
                <p className="font-semibold capitalize">{p.categoria}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-500">
                  <span
                    className="size-3 shrink-0 rounded-full ring-1 ring-stone-300"
                    style={{ background: CORES.find((c) => c.nome === p.cor)?.hex }}
                  />
                  <span className="truncate">{[p.subtipo, p.cor, p.estampa, p.material, p.marca].filter(Boolean).join(' · ')}</span>
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {pecas.length > 0 && (
      <button
        onClick={() => setEditando('nova')}
        className="fixed right-5 bottom-24 flex items-center gap-1.5 rounded-full bg-sky-500 px-5 py-3 font-semibold text-white sombra-alta transition active:scale-95"
      >
        <span className="text-base leading-none">+</span> Adicionar peça
      </button>
      )}
    </Tela>
  )
}
