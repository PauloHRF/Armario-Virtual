import { useEffect, useMemo, useRef, useState } from 'react'
import Tela from '../../shared/Tela'
import FotoPeca from '../../shared/FotoPeca'
import { listarLooks, listarPecas, removerLook, salvarLook } from '../../shared/storage'
import type { Camada, LookMontado, Peca } from '../../shared/types'
import { exportarPng } from './exportar'

const FUNDOS = ['#ffffff', '#f5f5f4', '#fde68a', '#fbcfe8', '#bfdbfe', '#bbf7d0', '#292524']
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

  async function carregar() {
    const [p, l] = await Promise.all([listarPecas(), listarLooks()])
    setPecas(p)
    setLooks(l)
  }
  useEffect(() => {
    carregar()
  }, [])

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

  function arrastar(e: React.PointerEvent, c: Camada) {
    setSel(c.id)
    // selecionar traz a camada para o topo
    setCamadas((cs) => [...cs.filter((x) => x.id !== c.id), c])
    const r = quadro.current!.getBoundingClientRect()
    const dx = c.x - (e.clientX - r.left) / r.width
    const dy = c.y - (e.clientY - r.top) / r.height
    const mover = (m: PointerEvent) =>
      alterar(c.id, {
        x: limitar((m.clientX - r.left) / r.width + dx, 0, 1),
        y: limitar((m.clientY - r.top) / r.height + dy, 0, 1),
      })
    const soltar = () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
    }
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
  }

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
        className="relative mx-auto aspect-3/4 w-full touch-none overflow-hidden rounded-2xl shadow-md ring-1 ring-stone-200 select-none"
        style={{ background: fundo, containerType: 'inline-size' }}
      >
        {visiveis.map((c) => {
          const peca = c.pecaId ? porId.get(c.pecaId) : undefined
          return (
            <div
              key={c.id}
              onPointerDown={(e) => arrastar(e, c)}
              className={`absolute cursor-grab ${c.id === sel ? 'outline-2 outline-dashed outline-sky-500' : ''}`}
              style={{
                left: `${c.x * 100}%`,
                top: `${c.y * 100}%`,
                width: peca ? `${c.tam * 100}%` : undefined,
                fontSize: peca ? undefined : `${c.tam * 100}cqw`,
                transform: `translate(-50%, -50%) rotate(${c.rot}deg)`,
              }}
            >
              {peca ? (
                <FotoPeca foto={peca.foto} className="pointer-events-none w-full" />
              ) : (
                <span className="pointer-events-none block font-bold whitespace-nowrap text-stone-900">{c.texto}</span>
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
        <div className="mt-3 space-y-2 rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-stone-200">
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
          <div className="flex gap-2">
            <button onClick={duplicar} className="rounded-xl bg-white px-3 py-2 ring-1 ring-stone-200 border-0">Duplicar</button>
            <button onClick={remover} className="rounded-xl bg-white px-3 py-2 text-red-700 ring-1 ring-red-200">Remover</button>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        {FUNDOS.map((f) => (
          <button
            key={f}
            aria-label={`Fundo ${f}`}
            onClick={() => setFundo(f)}
            className={`size-7 rounded-full border ${f === fundo ? 'ring-2 ring-sky-500' : 'border-stone-300'}`}
            style={{ background: f }}
          />
        ))}
        <button onClick={adicionarTexto} className="ml-auto rounded-xl bg-white px-3 py-2 ring-1 ring-stone-200 border-0 text-sm">+ Texto</button>
      </div>

      <h2 className="mt-5 mb-2 font-display text-lg font-semibold">Suas peças</h2>
      {pecas.length === 0 ? (
        <p className="text-sm text-stone-500">Cadastre peças na aba Armário para montar looks.</p>
      ) : (
        <ul className="sem-barra flex gap-2 overflow-x-auto pb-2">
          {pecas.map((p) => (
            <li key={p.id} className="shrink-0">
              <button onClick={() => adicionar({ pecaId: p.id })}>
                <FotoPeca foto={p.foto} className="size-20 rounded-xl bg-white object-contain p-1 ring-1 ring-stone-200" />
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
        <button onClick={salvar} disabled={!visiveis.length} className="rounded-xl bg-sky-500 px-4 py-2 font-medium text-white disabled:opacity-40">Salvar</button>
        <button onClick={baixar} disabled={!visiveis.length} className="rounded-xl bg-white px-3 py-2 ring-1 ring-stone-200 border-0 disabled:opacity-40">PNG</button>
        <button onClick={novo} className="rounded-xl bg-white px-3 py-2 ring-1 ring-stone-200 border-0">Novo</button>
      </div>

      {looks.length > 0 && (
        <>
          <h2 className="mt-5 mb-2 font-display text-lg font-semibold">Looks salvos</h2>
          <ul className="space-y-1">
            {looks.map((l) => (
              <li key={l.id} className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm">
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
    </Tela>
  )
}
