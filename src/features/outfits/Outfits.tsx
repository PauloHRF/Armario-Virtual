import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Chips from '../../shared/Chips'
import Tela from '../../shared/Tela'
import FotoPeca from '../../shared/FotoPeca'
import {
  listarCombinacoes,
  listarPecas,
  removerCombinacao,
  salvarCombinacao,
} from '../../shared/storage'
import { ESTACOES, OCASIOES, type Combinacao, type Estacao, type Ocasiao, type Peca } from '../../shared/types'
import { embaralhar, gerarLooks, idDoLook, type Look } from './gerar'

const POR_VEZ = 3

function Fotos({ pecas }: { pecas: Peca[] }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {pecas.map((p) => (
        <FotoPeca key={p.id} foto={p.foto} className="aspect-square w-full rounded-xl bg-stone-100 object-cover" />
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
  const [estacao, setEstacao] = useState<Estacao[]>([])
  const [ocasiao, setOcasiao] = useState<Ocasiao[]>([])
  const navegar = useNavigate()

  async function carregar() {
    const [p, s] = await Promise.all([listarPecas(), listarCombinacoes()])
    setPecas(p)
    setSalvas(s)
    setCarregou(true)
  }
  useEffect(() => {
    carregar()
  }, [])

  const looks = useMemo(
    () => embaralhar(gerarLooks(pecas, { estacao: estacao[0], ocasiao: ocasiao[0] })),
    // rodada força um novo sorteio
    [pecas, estacao, ocasiao, rodada],
  )
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
      <div className="mb-4 space-y-3">
        <Chips titulo="Estação" opcoes={ESTACOES} valor={estacao} aoMudar={(v) => (setEstacao(v), setInicio(0))} />
        <Chips titulo="Ocasião" opcoes={OCASIOES} valor={ocasiao} aoMudar={(v) => (setOcasiao(v), setInicio(0))} />
      </div>

      {carregou && visiveis.length === 0 && (
        <p className="text-stone-500">
          {estacao.length || ocasiao.length
            ? 'Nenhuma combinação para essa estação/ocasião. Tire um filtro ou cadastre mais peças.'
            : pecas.length < 6
              ? 'Cadastre pelo menos 6 peças (camisetas ou camisas, calças ou bermudas, e calçados) para ver combinações.'
              : 'Ainda não há combinação possível. Você precisa de uma peça de cima, uma de baixo e um calçado do mesmo estilo, com no máximo uma cor forte.'}
        </p>
      )}

      <ul className="space-y-4">
        {visiveis.map((l) => (
          <li key={idDoLook(l)} className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-200">
            <Fotos pecas={[l.cima, l.baixo, l.calcado]} />
            <p className="mt-2 text-sm">{l.explicacao}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => salvar(l)}
                disabled={ehSalvo(l)}
                className="rounded-xl bg-white p-2 text-sm font-medium ring-1 ring-stone-200 disabled:text-stone-400"
              >
                {ehSalvo(l) ? 'Salva ✓' : 'Salvar'}
              </button>
              <button
                onClick={() => navegar('/montar', { state: { pecaIds: [l.cima.id, l.baixo.id, l.calcado.id] } })}
                className="rounded-xl bg-stone-900 p-2 text-sm font-medium text-white"
              >
                Abrir no Montar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {looks.length > POR_VEZ && (
        <button onClick={outra} className="mt-4 w-full rounded-xl bg-sky-500 p-3 font-medium text-white">
          Outra sugestão
        </button>
      )}

      {salvasValidas.length > 0 && (
        <>
          <h2 className="mb-2 mt-8 font-display text-2xl font-semibold">Salvas</h2>
          <ul className="space-y-3">
            {salvasValidas.map(({ s, partes }) => (
              <li key={s.id} className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-200">
                <Fotos pecas={partes} />
                <div className="mt-2 flex gap-4 text-sm">
                  <button onClick={() => navegar('/montar', { state: { pecaIds: s.pecaIds } })} className="font-medium">Abrir no Montar</button>
                  <button onClick={() => remover(s.id)} className="text-red-600">Remover</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Tela>
  )
}
