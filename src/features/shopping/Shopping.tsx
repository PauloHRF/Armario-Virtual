import { useEffect, useState } from 'react'
import Tela from '../../shared/Tela'
import Vazio from '../../shared/Vazio'
import { listarPecas } from '../../shared/storage'
import type { Peca } from '../../shared/types'
import Desejos from './Desejos'
import { sugerirCompras } from './lacunas'

export default function Shopping() {
  const [pecas, setPecas] = useState<Peca[]>([])
  const [carregou, setCarregou] = useState(false)
  const [aba, setAba] = useState<'falta' | 'desejos'>('falta')
  const [editando, setEditando] = useState(false) // o formulário de desejo ocupa a tela toda

  useEffect(() => {
    listarPecas().then((p) => {
      setPecas(p)
      setCarregou(true)
    })
  }, [])

  const sugestoes = sugerirCompras(pecas)

  return (
    <Tela titulo="O que comprar">
      {!editando && (
        <div role="tablist" className="mb-4 grid grid-cols-2 rounded-2xl bg-stone-100 p-1 text-sm font-semibold">
          {([['falta', 'O que falta'], ['desejos', 'Lista de desejos']] as const).map(([id, nome]) => (
            <button
              key={id}
              role="tab"
              aria-selected={aba === id}
              onClick={() => setAba(id)}
              className={`min-h-11 rounded-xl transition ${aba === id ? 'bg-card sombra' : 'text-stone-500'}`}
            >
              {nome}
            </button>
          ))}
        </div>
      )}

      {aba === 'desejos' ? (
        <Desejos aoEditar={setEditando} />
      ) : (
        <>
          {carregou && pecas.length === 0 && (
            <Vazio emoji="👕" titulo="Armário vazio" texto="Cadastre suas peças no Armário e eu mostro o que está faltando." />
          )}
          {carregou && pecas.length > 0 && sugestoes.length === 0 && (
            <Vazio emoji="✅" titulo="Armário equilibrado" texto="Não encontramos nada essencial faltando. Se quiser algo, guarde na lista de desejos." />
          )}
          <ol className="space-y-3">
            {sugestoes.map((s, i) => (
              <li key={s.titulo} className="rounded-2xl bg-card p-4 sombra">
                <p className="font-semibold">{i + 1}. {s.titulo}</p>
                <p className="mt-1 text-sm text-stone-500">{s.motivo}</p>
              </li>
            ))}
          </ol>
        </>
      )}
    </Tela>
  )
}
