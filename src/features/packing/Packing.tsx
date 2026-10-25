import { useEffect, useMemo, useState } from 'react'
import Tela from '../../shared/Tela'
import Chips from '../../shared/Chips'
import FotoPeca from '../../shared/FotoPeca'
import { listarPecas, listarViagens, removerViagem, salvarViagem } from '../../shared/storage'
import { ESTACOES, type Estacao, type Peca, type Viagem } from '../../shared/types'
import Vazio from '../../shared/Vazio'
import { sugerirMala } from './sugerir'

export default function Packing() {
  const [pecas, setPecas] = useState<Peca[]>([])
  const [viagens, setViagens] = useState<Viagem[]>([])
  const [abertaId, setAbertaId] = useState<string | null>(null)
  const [criando, setCriando] = useState(false)
  const [nome, setNome] = useState('')
  const [dias, setDias] = useState(5)
  const [estacao, setEstacao] = useState<Estacao[]>([])
  const [adicionando, setAdicionando] = useState(false)

  async function carregar() {
    const [p, v] = await Promise.all([listarPecas(), listarViagens()])
    setPecas(p)
    setViagens(v)
  }
  useEffect(() => {
    carregar()
  }, [])

  const porId = useMemo(() => new Map(pecas.map((p) => [p.id, p])), [pecas])
  const aberta = viagens.find((v) => v.id === abertaId)
  // Ignora peças que saíram do armário depois de entrarem na mala.
  const naLista = (v: Viagem) => v.pecaIds.filter((id) => porId.has(id))

  async function salvar(v: Viagem) {
    await salvarViagem(v)
    await carregar()
  }

  async function criar() {
    const d = Math.min(60, Math.max(1, Math.round(dias) || 1))
    const v: Viagem = {
      id: crypto.randomUUID(),
      nome: nome.trim() || 'Minha viagem',
      dias: d,
      estacao: estacao[0],
      pecaIds: sugerirMala(pecas, d, estacao[0]),
      empacotadas: [],
      criadaEm: new Date().toISOString(),
    }
    await salvar(v)
    setCriando(false)
    setNome('')
    setAbertaId(v.id)
  }

  const alternar = (v: Viagem, id: string) =>
    salvar({ ...v, empacotadas: v.empacotadas.includes(id) ? v.empacotadas.filter((x) => x !== id) : [...v.empacotadas, id] })
  const tirar = (v: Viagem, id: string) =>
    salvar({ ...v, pecaIds: v.pecaIds.filter((x) => x !== id), empacotadas: v.empacotadas.filter((x) => x !== id) })
  const incluir = (v: Viagem, id: string) => salvar({ ...v, pecaIds: [...v.pecaIds, id] })

  if (aberta) {
    const ids = naLista(aberta)
    const feitas = ids.filter((id) => aberta.empacotadas.includes(id)).length
    const fora = pecas.filter((p) => !aberta.pecaIds.includes(p.id))
    return (
      <Tela titulo={aberta.nome}>
        <button onClick={() => (setAbertaId(null), setAdicionando(false))} className="mb-3 text-sm text-stone-500">← Todas as viagens</button>
        <p className="text-sm text-stone-600">
          {aberta.dias} {aberta.dias === 1 ? 'dia' : 'dias'}{aberta.estacao && ` · ${aberta.estacao}`}
        </p>
        <div className="my-3">
          <div className="h-2.5 overflow-hidden rounded-full bg-stone-200">
            <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${ids.length ? (feitas / ids.length) * 100 : 0}%` }} />
          </div>
          <p className="mt-1 text-sm text-stone-600">{feitas} de {ids.length} na mala</p>
        </div>
        {ids.length > 0 && feitas === ids.length && (
          <div className="mb-3 rounded-2xl bg-marca-50 p-4 text-center ring-1 ring-marca-200">
            <p className="text-5xl" aria-hidden>🎉</p>
            <p className="mt-2 font-display text-secao font-semibold">Mala pronta!</p>
            <p className="text-sm text-acento">Tudo separado para {aberta.nome}. Boa viagem!</p>
          </div>
        )}

        {ids.length === 0 && <p className="text-stone-500">Nenhuma peça na lista. Adicione abaixo ou refaça a sugestão.</p>}
        <ul className="grid grid-cols-2 gap-3">
          {ids.map((id) => {
            const p = porId.get(id)!
            const pronta = aberta.empacotadas.includes(id)
            return (
              <li key={id} className={`relative overflow-hidden rounded-2xl bg-card sombra ${pronta ? 'opacity-60' : ''}`}>
                <button onClick={() => alternar(aberta, id)} aria-pressed={pronta} className="block w-full text-left">
                  <div className="aspect-square bg-stone-100">
                    <FotoPeca foto={p.foto} className="size-full object-cover" />
                  </div>
                  <p className="p-2 text-sm capitalize">{p.categoria}</p>
                  <span className={`absolute top-2 left-2 grid size-7 place-items-center rounded-full text-sm ${pronta ? 'bg-sky-500 text-white' : 'bg-card/90 ring-1 ring-stone-300'}`}>
                    {pronta ? '✓' : ''}
                  </span>
                </button>
                <button onClick={() => tirar(aberta, id)} aria-label="Tirar da mala" className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-card/90 text-stone-500 ring-1 ring-stone-300">×</button>
              </li>
            )
          })}
        </ul>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <button onClick={() => setAdicionando(!adicionando)} className="rounded-xl bg-card p-3 font-semibold ring-1 ring-stone-200">+ Adicionar peça</button>
          <button
            onClick={() => salvar({ ...aberta, pecaIds: sugerirMala(pecas, aberta.dias, aberta.estacao), empacotadas: [] })}
            className="rounded-xl bg-card p-3 font-semibold ring-1 ring-stone-200"
          >
            Refazer sugestão
          </button>
        </div>

        {adicionando && (
          <ul className="sem-barra mt-3 flex gap-2 overflow-x-auto pb-1">
            {fora.length === 0 && <li className="text-sm text-stone-500">Todas as peças já estão na lista.</li>}
            {fora.map((p) => (
              <li key={p.id} className="shrink-0">
                <button onClick={() => incluir(aberta, p.id)} aria-label={`Adicionar ${p.categoria}`}>
                  <FotoPeca foto={p.foto} className="size-20 rounded-xl bg-card object-cover ring-1 ring-stone-200" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={async () => {
            if (!confirm(`Excluir a viagem "${aberta.nome}"?`)) return
            await removerViagem(aberta.id)
            setAbertaId(null)
            await carregar()
          }}
          className="mt-6 w-full rounded-xl border border-red-200 p-3 text-sm text-red-600"
        >
          Excluir viagem
        </button>
      </Tela>
    )
  }

  return (
    <Tela titulo="Mala de viagem">
      {criando ? (
        <div className="space-y-4 rounded-2xl bg-card p-4 sombra">
          <label className="block text-sm">
            Para onde vai?
            <input className="mt-1 w-full" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Praia, fim de semana" />
          </label>
          <label className="block text-sm">
            Quantos dias?
            <input className="mt-1 w-full" type="number" min={1} max={60} value={dias} onChange={(e) => setDias(+e.target.value)} />
          </label>
          <Chips titulo="Estação (opcional)" opcoes={ESTACOES} valor={estacao} aoMudar={setEstacao} />
          <p className="text-xs text-stone-500">Vamos sugerir as peças do seu armário. Você pode trocar tudo depois.</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setCriando(false)} className="rounded-xl bg-card p-3 font-semibold ring-1 ring-stone-200">Cancelar</button>
            <button onClick={criar} className="rounded-xl bg-sky-500 p-3 font-semibold text-white">Montar mala</button>
          </div>
        </div>
      ) : (
        <>
          {viagens.length === 0 && (
            <Vazio emoji="🧳" titulo="Para onde vamos?" texto="Crie uma viagem e receba uma sugestão do que levar, com checklist para ir marcando." />
          )}
          <ul className="space-y-3">
            {viagens.map((v) => {
              const ids = naLista(v)
              const feitas = ids.filter((id) => v.empacotadas.includes(id)).length
              return (
                <li key={v.id}>
                  <button onClick={() => setAbertaId(v.id)} className="w-full rounded-2xl bg-card p-4 text-left sombra">
                    <p className="font-display text-secao font-semibold">{v.nome}</p>
                    <p className="text-sm text-stone-500">
                      {v.dias} {v.dias === 1 ? 'dia' : 'dias'} · {feitas}/{ids.length} na mala
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>
          <button
            onClick={() => setCriando(true)}
            className="fixed right-5 bottom-24 flex items-center gap-2 rounded-full bg-sky-500 px-6 py-3 font-semibold text-white sombra-alta active:scale-95"
          >
            <span className="text-base leading-none">+</span> Nova viagem
          </button>
        </>
      )}
    </Tela>
  )
}
