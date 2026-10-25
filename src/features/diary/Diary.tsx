import { useEffect, useMemo, useState } from 'react'
import Tela from '../../shared/Tela'
import FotoPeca from '../../shared/FotoPeca'
import { definirDia, lerDiario, listarLooks, listarPecas, type Diario } from '../../shared/storage'
import { CORES, type LookMontado, type Peca } from '../../shared/types'

const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const chaveDia = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function Barras({ titulo, linhas }: { titulo: string; linhas: { nome: string; n: number; cor?: string }[] }) {
  const max = Math.max(1, ...linhas.map((l) => l.n))
  return (
    <div className="rounded-2xl bg-card p-4 sombra ring-1 ring-stone-200">
      <h3 className="mb-2 font-display text-base font-semibold">{titulo}</h3>
      {linhas.length === 0 && <p className="text-sm text-stone-500">Sem dados ainda.</p>}
      <ul className="space-y-1.5">
        {linhas.map((l) => (
          <li key={l.nome} className="flex items-center gap-2 text-sm">
            <span className="w-24 shrink-0 truncate capitalize">{l.nome}</span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-100">
              <span className="block h-full rounded-full bg-sky-500" style={{ width: `${(l.n / max) * 100}%`, background: l.cor }} />
            </span>
            <span className="w-5 text-right text-stone-500">{l.n}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Diary() {
  const [pecas, setPecas] = useState<Peca[]>([])
  const [looks, setLooks] = useState<LookMontado[]>([])
  const [diario, setDiario] = useState<Diario>({})
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [dia, setDia] = useState<string | null>(null)

  async function carregar() {
    const [p, l, d] = await Promise.all([listarPecas(), listarLooks(), lerDiario()])
    setPecas(p)
    setLooks(l)
    setDiario(d)
  }
  useEffect(() => {
    carregar()
  }, [])

  const lookPorId = useMemo(() => new Map(looks.map((l) => [l.id, l])), [looks])
  const pecaPorId = useMemo(() => new Map(pecas.map((p) => [p.id, p])), [pecas])
  const pecasDoLook = (l: LookMontado) =>
    l.camadas.flatMap((c) => (c.pecaId && pecaPorId.has(c.pecaId) ? [pecaPorId.get(c.pecaId)!] : []))

  // Quantas vezes cada peça foi usada (cada dia do diário conta uma vez por peça).
  const usos = useMemo(() => {
    const m = new Map<string, number>()
    for (const lookId of Object.values(diario)) {
      const l = lookPorId.get(lookId)
      if (l) for (const id of new Set(l.camadas.map((c) => c.pecaId))) if (id) m.set(id, (m.get(id) ?? 0) + 1)
    }
    return m
  }, [diario, lookPorId])

  const maisUsadas = [...pecas].sort((a, b) => (usos.get(b.id) ?? 0) - (usos.get(a.id) ?? 0)).filter((p) => usos.get(p.id)).slice(0, 5)
  const paradas = pecas.filter((p) => !usos.get(p.id))
  const contar = <T extends string>(valor: (p: Peca) => T | undefined) => {
    const m = new Map<T, number>()
    for (const p of pecas) {
      const v = valor(p)
      if (v) m.set(v, (m.get(v) ?? 0) + 1)
    }
    return [...m].sort((a, b) => b[1] - a[1])
  }

  const primeiro = mes.getDay()
  const diasNoMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const hoje = chaveDia(new Date())
  const nomeMes = mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  async function escolher(lookId: string | null) {
    if (!dia) return
    await definirDia(dia, lookId)
    await carregar()
    setDia(null)
  }

  return (
    <Tela titulo="Diário de looks">
      <div className="rounded-2xl bg-card p-3 sombra ring-1 ring-stone-200">
        <div className="mb-2 flex items-center justify-between">
          <button aria-label="Mês anterior" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} className="size-11 rounded-full text-base hover:bg-stone-100">‹</button>
          <p className="font-display text-base font-semibold capitalize">{nomeMes}</p>
          <button aria-label="Próximo mês" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} className="size-11 rounded-full text-base hover:bg-stone-100">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-stone-500">
          {SEMANA.map((s, i) => <span key={i}>{s}</span>)}
          {Array.from({ length: primeiro }, (_, i) => <span key={`v${i}`} />)}
          {Array.from({ length: diasNoMes }, (_, i) => {
            const chave = chaveDia(new Date(mes.getFullYear(), mes.getMonth(), i + 1))
            const look = lookPorId.get(diario[chave])
            const capa = look && pecasDoLook(look)[0]
            return (
              <button
                key={chave}
                onClick={() => setDia(chave)}
                className={`relative aspect-square overflow-hidden rounded-xl text-sm ${chave === hoje ? 'ring-2 ring-sky-500' : 'ring-1 ring-stone-200'} ${capa ? 'text-white' : 'bg-stone-50 text-stone-900'}`}
              >
                {capa && <FotoPeca foto={capa.foto} className="absolute inset-0 size-full object-cover brightness-75" />}
                <span className="relative">{i + 1}</span>
              </button>
            )
          })}
        </div>
      </div>

      {dia && (
        <div className="mt-3 rounded-2xl bg-card p-4 sombra ring-1 ring-stone-200">
          <p className="mb-2 font-semibold">Look de {dia.split('-').reverse().join('/')}</p>
          {looks.length === 0 ? (
            <p className="text-sm text-stone-500">Salve um look na aba Montar para registrá-lo aqui.</p>
          ) : (
            <ul className="space-y-1">
              {looks.map((l) => (
                <li key={l.id}>
                  <button onClick={() => escolher(l.id)} className={`flex w-full items-center gap-2 rounded-xl p-2 text-left ${diario[dia] === l.id ? 'bg-stone-100' : ''}`}>
                    <span className="flex -space-x-3">
                      {pecasDoLook(l).slice(0, 3).map((p) => (
                        <FotoPeca key={p.id} foto={p.foto} className="size-10 rounded-full bg-card object-cover ring-2 ring-white" />
                      ))}
                    </span>
                    {l.nome}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex gap-2 text-sm">
            {diario[dia] && <button onClick={() => escolher(null)} className="rounded-xl min-h-11 px-4 text-red-700 ring-1 ring-red-200">Limpar dia</button>}
            <button onClick={() => setDia(null)} className="rounded-xl min-h-11 px-4 ring-1 ring-stone-200">Fechar</button>
          </div>
        </div>
      )}

      <h2 className="mt-6 mb-2 font-display text-base font-semibold">Estatísticas</h2>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            [pecas.length, 'peças'],
            [Object.keys(diario).length, 'dias com look'],
            [paradas.length, 'sem uso'],
          ].map(([n, t]) => (
            <div key={t} className="rounded-2xl bg-card p-3 sombra ring-1 ring-stone-200">
              <p className="font-display text-[28px] leading-9 font-semibold">{n}</p>
              <p className="text-xs text-stone-500">{t}</p>
            </div>
          ))}
        </div>
        <Barras
          titulo="Mais usadas"
          linhas={maisUsadas.map((p) => ({ nome: `${p.categoria} ${p.cor}`, n: usos.get(p.id) ?? 0 }))}
        />
        <Barras titulo="Por categoria" linhas={contar((p) => p.categoria).map(([nome, n]) => ({ nome, n }))} />
        <Barras
          titulo="Por cor"
          linhas={contar((p) => p.cor).map(([nome, n]) => ({ nome, n, cor: CORES.find((c) => c.nome === nome)?.hex }))}
        />
      </div>
    </Tela>
  )
}
