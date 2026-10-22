import { useEffect, useState } from 'react'
import Tela from '../../shared/Tela'
import { listarPecas, removerPeca, salvarPeca } from '../../shared/storage'
import { CATEGORIAS, type Categoria, type Peca } from '../../shared/types'
import FormPeca from './FormPeca'
import FotoPeca from '../../shared/FotoPeca'

export default function Wardrobe() {
  const [pecas, setPecas] = useState<Peca[]>([])
  const [carregou, setCarregou] = useState(false)
  const [filtro, setFiltro] = useState<Categoria | 'todas'>('todas')
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
          <button onClick={() => remover(editando)} className="mt-4 w-full rounded-lg border border-red-300 p-2 text-red-600">
            Remover peça
          </button>
        )}
      </>
    )
  }

  const visiveis = filtro === 'todas' ? pecas : pecas.filter((p) => p.categoria === filtro)

  return (
    <Tela titulo="Meu armário">
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {(['todas', ...CATEGORIAS] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFiltro(c)}
            className={`shrink-0 rounded-full border px-3 py-1 text-sm ${filtro === c ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 bg-white'}`}
          >
            {c}
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
            <button onClick={() => setEditando(p)} className="w-full overflow-hidden rounded-lg border border-stone-200 bg-white text-left">
              <FotoPeca foto={p.foto} className="h-36 w-full object-cover" />
              <div className="p-2 text-sm">
                <p className="font-medium">{p.categoria}</p>
                <p className="text-stone-500">{[p.cor, p.estilo, p.marca, p.tamanho].filter(Boolean).join(' · ')}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={() => setEditando('nova')}
        className="fixed bottom-20 right-4 rounded-full bg-stone-900 px-5 py-3 text-white shadow-lg"
      >
        + Adicionar peça
      </button>
    </Tela>
  )
}
