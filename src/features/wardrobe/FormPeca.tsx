import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  CATEGORIAS, CORES, ESTACOES, ESTAMPAS, ESTILOS, MATERIAIS, OCASIOES, SUBTIPOS, cuidadosDe,
  type Categoria, type Estilo, type Peca,
} from '../../shared/types'
import Chips from '../../shared/Chips'
import { reduzirFoto } from './reduzirFoto'
import { recortarFundo } from './recortarFundo'
import { sugerirTags } from './sugerirTags'
import FotoPeca from '../../shared/FotoPeca'

export type RascunhoPeca = Omit<Peca, 'foto'> & { foto: Blob | null; original?: Blob }

type Props = {
  inicial: RascunhoPeca
  editando: boolean
  aoMudar: (dados: RascunhoPeca) => void
  aoSalvar: (peca: Peca) => Promise<void>
  aoCancelar: () => void
  aoRemover?: () => void
}

const campo = 'mt-1 w-full'

export default function FormPeca({ inicial, editando, aoMudar, aoSalvar, aoCancelar, aoRemover }: Props) {
  const [dados, setDados] = useState(inicial)
  const atual = useRef(inicial)
  const ativo = useRef(false)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [lendoFoto, setLendoFoto] = useState(false)
  const [recorte, setRecorte] = useState<number | null>(null)
  const ocupado = lendoFoto || salvando || recorte !== null
  const { foto, original, categoria, cor, estilo, marca, tamanho, estampa, material, estacoes, ocasioes, favorita, cuidado, subtipo } = dados

  useEffect(() => {
    ativo.current = true
    return () => { ativo.current = false }
  }, [])

  function alterar(mudanca: Partial<RascunhoPeca>) {
    if (salvando) return
    const atualizado = { ...atual.current, ...mudanca }
    atual.current = atualizado
    setDados(atualizado)
    aoMudar(atualizado)
  }

  async function tirarFundo() {
    if (!foto) return
    setErro('')
    setRecorte(0)
    try {
      const semFundo = await recortarFundo(foto, (progresso) => {
        if (ativo.current) setRecorte(progresso)
      })
      if (ativo.current) alterar({ original: foto, foto: semFundo })
    } catch {
      setErro('Não consegui recortar o fundo. Confira a conexão (o modelo é baixado na primeira vez) e tente de novo.')
    } finally {
      setRecorte(null)
    }
  }

  async function escolherFoto(arquivo?: File) {
    if (!arquivo || ocupado) return
    setErro('')
    setLendoFoto(true)
    try {
      const reduzida = await reduzirFoto(arquivo)
      if (!ativo.current) return
      alterar({ foto: reduzida, original: undefined })
      const antes = atual.current
      const tags = await sugerirTags(reduzida)
      if (ativo.current && Object.keys(tags).length > 0) {
        alterar({
          categoria: atual.current.categoria === antes.categoria ? tags.categoria ?? antes.categoria : atual.current.categoria,
          cor: atual.current.cor === antes.cor ? tags.cor ?? antes.cor : atual.current.cor,
          estilo: atual.current.estilo === antes.estilo ? tags.estilo ?? antes.estilo : atual.current.estilo,
        })
      }
    } catch {
      setErro('Não consegui ler essa foto. Tente outra.')
    } finally {
      setLendoFoto(false)
    }
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (ocupado) return
    if (!foto) {
      setErro('Adicione uma foto da peça.')
      return
    }
    setErro('')
    setSalvando(true)
    try {
      const { original: _original, ...peca } = dados
      await aoSalvar({
        ...peca,
        foto,
        marca: marca.trim(),
        tamanho: tamanho.trim(),
        cuidado: cuidado && cuidadosDe(categoria).includes(cuidado) ? cuidado : undefined,
        subtipo: categoria === 'acessório' ? subtipo : undefined,
      })
    } catch {
      setErro('Não consegui salvar. Tente de novo.')
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <h1 className="text-titulo font-semibold tracking-tight">{editando ? 'Editar peça' : 'Nova peça'}</h1>

      {foto && (
        <div className="space-y-2">
          <div
            className="h-44 overflow-hidden rounded-2xl bg-stone-100 sombra sm:h-56"
            // xadrez cinza-claro: deixa a transparência visível depois do recorte
            style={original ? { background: 'repeating-conic-gradient(#e8decd 0 25%, #fff 0 50%) 0 0 / 20px 20px' } : undefined}
          >
            <FotoPeca foto={foto} className="size-full object-contain" />
          </div>
          {original ? (
            <button type="button" disabled={ocupado} onClick={() => alterar({ foto: original, original: undefined })} className="w-full rounded-xl bg-card p-3 text-sm font-semibold ring-1 ring-stone-200">
              ↩ Voltar à foto original
            </button>
          ) : (
            <button type="button" onClick={tirarFundo} disabled={ocupado} className="w-full rounded-xl bg-card p-3 text-sm font-semibold ring-1 ring-stone-200 disabled:opacity-60">
              {recorte === null ? '✂️ Remover fundo' : `Recortando… ${Math.round(recorte * 100)}%`}
            </button>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <label className="cursor-pointer rounded-xl focus-within:ring-2 focus-within:ring-acento bg-fill p-3 text-center text-sm font-semibold text-on-fill">
          📷 Tirar foto
          <input type="file" accept="image/*" capture="environment" disabled={ocupado} className="sr-only" onChange={(e) => {
            void escolherFoto(e.currentTarget.files?.[0])
            e.currentTarget.value = ''
          }} />
        </label>
        <label className="cursor-pointer rounded-xl focus-within:ring-2 focus-within:ring-acento bg-card p-3 text-center text-sm font-semibold ring-1 ring-stone-200">
          🖼️ Galeria
          <input type="file" accept="image/*" disabled={ocupado} className="sr-only" onChange={(e) => {
            void escolherFoto(e.currentTarget.files?.[0])
            e.currentTarget.value = ''
          }} />
        </label>
      </div>

      {lendoFoto && <p role="status" className="text-sm text-stone-600">Preparando foto…</p>}

      <label className="block text-sm">
        Categoria
        <select className={campo} value={categoria} onChange={(e) => alterar({ categoria: e.target.value as Categoria })}>
          {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>

      <div className="text-sm">
        Cor principal
        <div className="mt-1 flex flex-wrap gap-2">
          {CORES.map((c) => (
            <button
              key={c.nome}
              type="button"
              title={c.nome}
              aria-label={c.nome}
              aria-pressed={cor === c.nome}
              onClick={() => alterar({ cor: c.nome })}
              className="grid size-11 place-items-center rounded-full"
            >
              <span aria-hidden className={`size-8 rounded-full border ${cor === c.nome ? 'ring-2 ring-fill ring-offset-2 ring-offset-stone-50' : 'border-stone-300'}`} style={{ backgroundColor: c.hex }} />
            </button>
          ))}
        </div>
        <span className="text-stone-500">{cor}</span>
      </div>

      <details className="rounded-2xl border border-stone-200 bg-card px-3">
        <summary className="min-h-11 cursor-pointer py-3 font-semibold">Mais detalhes</summary>
        <div className="space-y-4 pb-3">
          <label className="block text-sm">
            Estilo
            <select className={campo} value={estilo} onChange={(e) => alterar({ estilo: e.target.value as Estilo })}>
              {ESTILOS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>

          {categoria === 'acessório' && <Chips titulo="Tipo de acessório" opcoes={SUBTIPOS} valor={subtipo ? [subtipo] : []} aoMudar={(valor) => alterar({ subtipo: valor[0] })} />}
          <Chips titulo="Estampa" opcoes={ESTAMPAS} valor={estampa ? [estampa] : []} aoMudar={(valor) => alterar({ estampa: valor[0] })} />
          <Chips titulo="Material" opcoes={MATERIAIS} valor={material ? [material] : []} aoMudar={(valor) => alterar({ material: valor[0] })} />
          <Chips titulo="Estações" opcoes={ESTACOES} valor={estacoes ?? []} aoMudar={(valor) => alterar({ estacoes: valor })} multiplo />
          <Chips titulo="Ocasiões" opcoes={OCASIOES} valor={ocasioes ?? []} aoMudar={(valor) => alterar({ ocasioes: valor })} multiplo />

          <div className="rounded-2xl bg-stone-100 p-3">
            <Chips titulo="Precisa de cuidado? (sai das sugestões até ficar pronta)" opcoes={cuidadosDe(categoria)} valor={cuidado ? [cuidado] : []} aoMudar={(valor) => alterar({ cuidado: valor[0] })} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={favorita ?? false} onChange={(e) => alterar({ favorita: e.target.checked })} />
            ★ Peça favorita
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm">
              Marca
              <input className={campo} value={marca} onChange={(e) => alterar({ marca: e.target.value })} />
            </label>
            <label className="block text-sm">
              Tamanho
              <input className={campo} value={tamanho} onChange={(e) => alterar({ tamanho: e.target.value })} placeholder="M, 42…" />
            </label>
          </div>
          {aoRemover && (
            <button type="button" onClick={aoRemover} disabled={ocupado} className="min-h-11 w-full rounded-xl border border-perigo/30 text-perigo disabled:opacity-50">
              Remover peça
            </button>
          )}
        </div>
      </details>

      {erro && <p role="alert" className="text-sm text-perigo">{erro}</p>}

      <div className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-10 grid grid-cols-2 gap-2 rounded-2xl bg-stone-50/95 p-2 shadow-md backdrop-blur">
        <button type="button" onClick={aoCancelar} disabled={salvando} className="min-h-11 rounded-xl bg-card px-2 font-semibold ring-1 ring-stone-200 disabled:opacity-50">Cancelar</button>
        <button type="submit" disabled={ocupado} className="min-h-11 rounded-xl bg-sky-500 px-2 font-semibold text-white disabled:opacity-50">{salvando ? 'Salvando…' : 'Salvar peça'}</button>
      </div>
    </form>
  )
}
