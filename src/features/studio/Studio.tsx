import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { papelDe, type Papel } from '../outfits/pareamento'
import Tela from '../../shared/Tela'
import FotoPeca from '../../shared/FotoPeca'
import { listarLooks, listarPecas, removerLook, salvarLook } from '../../shared/storage'
import type { Camada, LookMontado, Peca } from '../../shared/types'
import Aviso from '../../shared/Aviso'
import { exportarPng } from './exportar'

const FUNDOS = ['#ffffff', '#e5e7eb', '#cbd5e1', '#bfdbfe', '#bbf7d0', '#334155', '#0b0f14']
const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export default function Studio() {
  const [pecas, setPecas] = useState<Peca[]>([])
  const [looks, setLooks] = useState<LookMontado[]>([])
  const [id, setId] = useState<string>(() => crypto.randomUUID())
  const [nome, setNome] = useState('')
  const [fundo, setFundo] = useState(FUNDOS[0])
  const [camadas, setCamadas] = useState<Camada[]>([])
  const [sel, setSel] = useState<string | null>(null)
  const quadro = useRef<HTMLDivElement>(null)
  const [avisos, setAvisos] = useState(0)

  async function carregar() {
    const [p, l] = await Promise.all([listarPecas(), listarLooks()])
    setPecas(p)
    setLooks(l)
  }
  useEffect(() => {
    carregar()
  }, [])

  // Vindo de "Abrir no Montar": monta o look com as peças no lugar de cada tipo.
  const { state } = useLocation()
  useEffect(() => {
    const ids: string[] | undefined = state?.pecaIds
    if (!ids?.length) return
    history.replaceState({}, '') // recarregar a página não refaz a montagem
    // posição por tipo de peça; o agasalho fica por cima da camiseta e o acessório ao lado
    const lugar: Record<Papel, { x: number; y: number; tam: number }> = {
      cima: { x: 0.5, y: 0.27, tam: 0.46 },
      agasalho: { x: 0.5, y: 0.3, tam: 0.5 },
      baixo: { x: 0.5, y: 0.6, tam: 0.4 },
      calçado: { x: 0.5, y: 0.86, tam: 0.26 },
      acessório: { x: 0.82, y: 0.56, tam: 0.16 },
    }
    const ordem: Papel[] = ['baixo', 'calçado', 'cima', 'agasalho', 'acessório'] // a última fica por cima
    listarPecas().then((todas) => {
      const achadas = ids.flatMap((id) => todas.filter((p) => p.id === id))
      setCamadas(
        achadas
          .sort((a, b) => ordem.indexOf(papelDe(a)) - ordem.indexOf(papelDe(b)))
          .map((p) => ({ id: crypto.randomUUID(), pecaId: p.id, rot: 0, ...lugar[papelDe(p)] })),
      )
      setSel(null)
    })
  }, [state])

  const porId = useMemo(() => new Map(pecas.map((p) => [p.id, p])), [pecas])
  // Ignora camadas cujas peças foram removidas do armário.
  const visiveis = camadas.filter((c) => c.texto !== undefined || (c.pecaId && porId.has(c.pecaId)))
  const atual = visiveis.find((c) => c.id === sel)

  const alterar = (cid: string, mudanca: Partial<Camada>) =>
    setCamadas((cs) => cs.map((c) => (c.id === cid ? { ...c, ...mudanca } : c)))

  function adicionar(extra: Partial<Camada>) {
    const nova: Camada = { x: 0.5, y: 0.5, tam: 0.4, rot: 0, ...extra, id: crypto.randomUUID() }
    setCamadas((cs) => [...cs, nova])
    setSel(nova.id)
  }

  function adicionarTexto() {
    const texto = prompt('Texto:')?.trim()
    if (texto) adicionar({ texto, tam: 0.08 })
  }

  // Gestos: 1 dedo arrasta; 2 dedos na camada fazem pinça (tamanho) e giro ao mesmo tempo.
  // Toda vez que entra ou sai um dedo, a base do gesto é refeita a partir da camada atual.
  const dedos = useRef(new Map<number, { x: number; y: number }>())
  const gesto = useRef<{ id: string; c: Camada; pts: { x: number; y: number }[] } | null>(null)
  const camadasRef = useRef(camadas)
  camadasRef.current = camadas

  const pontos = () => [...dedos.current.values()]
  const rebasear = () => {
    const c = gesto.current && camadasRef.current.find((x) => x.id === gesto.current!.id)
    if (c && dedos.current.size) gesto.current = { id: c.id, c, pts: pontos() }
  }

  function tocar(e: React.PointerEvent, c: Camada) {
    try {
      quadro.current!.setPointerCapture(e.pointerId) // o dedo continua valendo mesmo fora do quadro
    } catch {
      // ponteiro já inativo: segue sem captura
    }
    dedos.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (!gesto.current || dedos.current.size === 1) {
      gesto.current = { id: c.id, c, pts: [] }
      setSel(c.id)
      // selecionar traz a camada para o topo
      setCamadas((cs) => [...cs.filter((x) => x.id !== c.id), c])
    }
    rebasear()
  }

  function mexer(e: React.PointerEvent) {
    const g = gesto.current
    if (!g || !dedos.current.has(e.pointerId)) return
    dedos.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const r = quadro.current!.getBoundingClientRect()
    const agora = pontos().slice(0, 2)
    const antes = g.pts.slice(0, 2)
    const centro = (p: { x: number; y: number }[]) => ({ x: p.reduce((s, q) => s + q.x, 0) / p.length, y: p.reduce((s, q) => s + q.y, 0) / p.length })
    const [a, b] = [centro(antes), centro(agora)]
    const mudanca: Partial<Camada> = {
      x: limitar(g.c.x + (b.x - a.x) / r.width, 0, 1),
      y: limitar(g.c.y + (b.y - a.y) / r.height, 0, 1),
    }
    if (agora.length === 2 && antes.length === 2) {
      const d = (p: { x: number; y: number }[]) => Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y)
      const ang = (p: { x: number; y: number }[]) => Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x)
      mudanca.tam = limitar((g.c.tam * d(agora)) / Math.max(1, d(antes)), 0.04, g.c.texto !== undefined ? 0.4 : 1)
      mudanca.rot = Math.round(g.c.rot + ((ang(agora) - ang(antes)) * 180) / Math.PI)
    }
    alterar(g.id, mudanca)
  }

  function soltar(e: React.PointerEvent) {
    dedos.current.delete(e.pointerId)
    if (dedos.current.size === 0) gesto.current = null
    else rebasear()
  }

  const paraTras = () => atual && setCamadas((cs) => [cs.find((c) => c.id === atual.id)!, ...cs.filter((c) => c.id !== atual.id)])

  function duplicar() {
    if (atual) adicionar({ ...atual, x: limitar(atual.x + 0.05, 0, 1), y: limitar(atual.y + 0.05, 0, 1) })
  }

  function remover() {
    setCamadas((cs) => cs.filter((c) => c.id !== sel))
    setSel(null)
  }

  function novo() {
    setId(crypto.randomUUID())
    setNome('')
    setFundo(FUNDOS[0])
    setCamadas([])
    setSel(null)
  }

  async function salvar() {
    await salvarLook({ id, nome: nome.trim() || 'Look sem nome', fundo, camadas: visiveis, criadoEm: new Date().toISOString() })
    await carregar()
    setAvisos((n) => n + 1)
  }

  function abrir(l: LookMontado) {
    setId(l.id)
    setNome(l.nome)
    setFundo(l.fundo)
    setCamadas(l.camadas)
    setSel(null)
  }

  async function baixar() {
    const url = URL.createObjectURL(await exportarPng(fundo, visiveis, porId))
    const a = document.createElement('a')
    a.href = url
    a.download = `${nome.trim() || 'look'}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Tela titulo="Montar look">
      <div
        ref={quadro}
        onPointerDown={(e) => e.target === e.currentTarget && setSel(null)}
        onPointerMove={mexer}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        className="relative mx-auto aspect-3/4 w-full touch-none overflow-hidden rounded-2xl shadow-md ring-1 ring-stone-200 select-none"
        style={{ background: fundo, containerType: 'inline-size' }}
      >
        {visiveis.map((c) => {
          const peca = c.pecaId ? porId.get(c.pecaId) : undefined
          return (
            <div
              key={c.id}
              onPointerDown={(e) => tocar(e, c)}
              className={`absolute cursor-grab ${c.id === sel ? 'outline-2 outline-dashed outline-sky-500' : ''}`}
              style={{
                left: `${c.x * 100}%`,
                top: `${c.y * 100}%`,
                width: peca ? `${c.tam * 100}%` : undefined,
                fontSize: peca ? undefined : `${c.tam * 100}cqw`,
                transform: `translate(-50%, -50%) rotate(${c.rot}deg) scaleX(${c.espelho ? -1 : 1})`,
              }}
            >
              {peca ? (
                <FotoPeca foto={peca.foto} className="pointer-events-none w-full" />
              ) : (
                <span className="pointer-events-none block font-semibold whitespace-nowrap text-[#111]">{c.texto}</span>
              )}
            </div>
          )
        })}
        {visiveis.length === 0 && (
          <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-stone-500">
            Toque em uma peça abaixo para colocá-la no quadro.
          </p>
        )}
      </div>

      {atual && (
        <div className="mt-3 space-y-2 rounded-2xl bg-card p-4 text-sm sombra">
          <label className="flex items-center gap-2">
            Tamanho
            <input
              type="range"
              min={0.04}
              max={atual.texto !== undefined ? 0.3 : 1}
              step={0.01}
              value={atual.tam}
              onChange={(e) => alterar(atual.id, { tam: +e.target.value })}
              className="flex-1"
            />
          </label>
          <label className="flex items-center gap-2">
            Giro
            <input
              type="range"
              min={-180}
              max={180}
              value={atual.rot}
              onChange={(e) => alterar(atual.id, { rot: +e.target.value })}
              className="flex-1"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => alterar(atual.id, { espelho: !atual.espelho })} className="rounded-xl bg-card min-h-11 px-4 ring-1 ring-stone-200 border-0">Espelhar</button>
            <button onClick={paraTras} className="rounded-xl bg-card min-h-11 px-4 ring-1 ring-stone-200 border-0">Para trás</button>
            <button onClick={duplicar} className="rounded-xl bg-card min-h-11 px-4 ring-1 ring-stone-200 border-0">Duplicar</button>
            <button onClick={remover} className="rounded-xl bg-card min-h-11 px-4 text-red-700 ring-1 ring-red-200">Remover</button>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        {FUNDOS.map((f) => (
          <button
            key={f}
            aria-label={`Fundo ${f}`}
            onClick={() => setFundo(f)}
            className="grid size-11 place-items-center"
          >
            <span
              className={`size-7 rounded-full border ${f === fundo ? 'ring-2 ring-sky-500 ring-offset-2 ring-offset-stone-50' : 'border-stone-300'}`}
              style={{ background: f }}
            />
          </button>
        ))}
        <button onClick={adicionarTexto} className="ml-auto whitespace-nowrap rounded-xl bg-card min-h-11 px-4 ring-1 ring-stone-200 border-0 text-sm">+ Texto</button>
      </div>

      <h2 className="mt-6 mb-2 font-display text-secao font-semibold">Suas peças</h2>
      {pecas.length === 0 ? (
        <p className="text-sm text-stone-500">Cadastre peças na aba Armário para montar looks.</p>
      ) : (
        <ul className="sem-barra flex gap-2 overflow-x-auto pb-2">
          {pecas.map((p) => (
            <li key={p.id} className="shrink-0">
              <button onClick={() => adicionar({ pecaId: p.id })}>
                <FotoPeca foto={p.foto} className="size-20 rounded-xl bg-card object-contain p-1 ring-1 ring-stone-200" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do look"
          className="min-w-0 flex-1"
        />
        <button onClick={salvar} disabled={!visiveis.length} className="rounded-xl bg-sky-500 min-h-11 px-6 font-semibold text-white disabled:opacity-40">Salvar</button>
        <button onClick={baixar} disabled={!visiveis.length} className="rounded-xl bg-card min-h-11 px-4 ring-1 ring-stone-200 border-0 disabled:opacity-40">PNG</button>
        <button onClick={novo} className="rounded-xl bg-card min-h-11 px-4 ring-1 ring-stone-200 border-0">Novo</button>
      </div>

      {looks.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 font-display text-secao font-semibold">Looks salvos</h2>
          <ul className="space-y-1">
            {looks.map((l) => (
              <li key={l.id} className="flex items-center gap-2 rounded-xl border border-stone-200 bg-card min-h-11 px-4 text-sm">
                <button onClick={() => abrir(l)} className="flex-1 text-left">{l.nome}</button>
                <button
                  onClick={async () => {
                    await removerLook(l.id)
                    await carregar()
                  }}
                  className="text-red-700"
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <Aviso mensagem="Look salvo ✓" chave={avisos} />
    </Tela>
  )
}
