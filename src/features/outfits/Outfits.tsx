import { useEffect, useMemo, useState } from 'react'
import Tela from '../../shared/Tela'
import FotoPeca from '../../shared/FotoPeca'
import {
  listarCombinacoes,
  listarPecas,
  removerCombinacao,
  salvarCombinacao,
} from '../../shared/storage'
import type { Combinacao, Peca } from '../../shared/types'
import { embaralhar, gerarLooks, idDoLook, type Look } from './gerar'

const POR_VEZ = 3

function Fotos({ pecas }: { pecas: Peca[] }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {pecas.map((p) => (
        <FotoPeca key={p.id} foto={p.foto} className="h-24 w-full rounded object-cover" />
      ))}
    </div>
  )
}

export default function Outfits() {
  const [pecas, setPecas] = useState<Peca[]>([])
  const [salvas, setSalvas] = useState<Combinacao[]>([])
  const [carregou, setCarregou] = useState(false)
  const [rodada, setRodada] = useState(0)
  const [inicio, setInicio] = useState(0)

  async function carregar() {
    const [p, s] = await Promise.all([listarPecas(), listarCombinacoes()])
    setPecas(p)
    setSalvas(s)
    setCarregou(true)
  }
  useEffect(() => {
    carregar()
  }, [])

  const looks = useMemo(() => embaralhar(gerarLooks(pecas)), [pecas, rodada])
  const visiveis = looks.slice(inicio, inicio + POR_VEZ)

  const idSalvo = (ids: string[]) => [...ids].sort().join('+')
  const jaSalvos = new Set(salvas.map((s) => idSalvo(s.pecaIds)))
  const ehSalvo = (l: Look) => jaSalvos.has(idSalvo([l.cima.id, l.baixo.id, l.calcado.id]))

  function outra() {
    if (inicio + POR_VEZ >= looks.length) {
      setRodada(rodada + 1)
      setInicio(0)
    } else {
      setInicio(inicio + POR_VEZ)
    }
  }

  async function salvar(l: Look) {
    await salvarCombinacao({ id: crypto.randomUUID(), pecaIds: [l.cima.id, l.baixo.id, l.calcado.id] })
    await carregar()
  }

  async function remover(id: string) {
    await removerCombinacao(id)
    await carregar()
  }

  const porId = new Map(pecas.map((p) => [p.id, p]))
  // Ignora combinações salvas cujas peças foram removidas do armário.
  const salvasValidas = salvas
    .map((s) => ({ s, partes: s.pecaIds.map((id) => porId.get(id)) }))
    .filter((x): x is { s: Combinacao; partes: Peca[] } => x.partes.every(Boolean))

  return (
    <Tela titulo="Combinações">
      {carregou && visiveis.length === 0 && (
        <p className="text-stone-500">
          {pecas.length < 6
            ? 'Cadastre pelo menos 6 peças (camisetas ou camisas, calças ou bermudas, e calçados) para ver combinações.'
            : 'Ainda não há combinação possível. Você precisa de uma peça de cima, uma de baixo e um calçado do mesmo estilo, com no máximo uma cor forte.'}
        </p>
      )}

      <ul className="space-y-4">
        {visiveis.map((l) => (
          <li key={idDoLook(l)} className="rounded-lg border border-stone-200 bg-white p-3">
            <Fotos pecas={[l.cima, l.baixo, l.calcado]} />
            <p className="mt-2 text-sm">{l.explicacao}</p>
            <button
              onClick={() => salvar(l)}
              disabled={ehSalvo(l)}
              className="mt-2 w-full rounded-lg border border-stone-300 p-2 text-sm disabled:text-stone-400"
            >
              {ehSalvo(l) ? 'Salva ✓' : 'Salvar combinação'}
            </button>
          </li>
        ))}
      </ul>

      {looks.length > POR_VEZ && (
        <button onClick={outra} className="mt-4 w-full rounded-lg bg-stone-900 p-2 text-white">
          Outra sugestão
        </button>
      )}

      {salvasValidas.length > 0 && (
        <>
          <h2 className="mb-2 mt-8 text-lg font-bold">Salvas</h2>
          <ul className="space-y-3">
            {salvasValidas.map(({ s, partes }) => (
              <li key={s.id} className="rounded-lg border border-stone-200 bg-white p-3">
                <Fotos pecas={partes} />
                <button onClick={() => remover(s.id)} className="mt-2 text-sm text-red-600">
                  Remover
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Tela>
  )
}
