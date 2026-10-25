import { useState, type FormEvent } from 'react'
import {
  CATEGORIAS, CORES, ESTACOES, ESTAMPAS, ESTILOS, MATERIAIS, OCASIOES, SUBTIPOS, cuidadosDe,
  type Categoria, type Cor, type Cuidado, type Subtipo, type Estacao, type Estampa, type Estilo, type Material, type Ocasiao, type Peca,
} from '../../shared/types'
import Chips from '../../shared/Chips'
import { reduzirFoto } from './reduzirFoto'
import { recortarFundo } from './recortarFundo'
import { sugerirTags } from './sugerirTags'
import FotoPeca from '../../shared/FotoPeca'

type Props = {
  peca: Peca | null // null = nova peça
  aoSalvar: (peca: Peca) => Promise<void>
  aoCancelar: () => void
}

const campo = 'mt-1 w-full'

export default function FormPeca({ peca, aoSalvar, aoCancelar }: Props) {
  const [foto, setFoto] = useState<Blob | null>(peca?.foto ?? null)
  const [categoria, setCategoria] = useState<Categoria>(peca?.categoria ?? 'camiseta')
  const [cor, setCor] = useState<Cor>(peca?.cor ?? 'preto')
  const [estilo, setEstilo] = useState<Estilo>(peca?.estilo ?? 'casual')
  const [marca, setMarca] = useState(peca?.marca ?? '')
  const [tamanho, setTamanho] = useState(peca?.tamanho ?? '')
  const [estampa, setEstampa] = useState<Estampa[]>(peca?.estampa ? [peca.estampa] : [])
  const [material, setMaterial] = useState<Material[]>(peca?.material ? [peca.material] : [])
  const [estacoes, setEstacoes] = useState<Estacao[]>(peca?.estacoes ?? [])
  const [ocasioes, setOcasioes] = useState<Ocasiao[]>(peca?.ocasioes ?? [])
  const [favorita, setFavorita] = useState(peca?.favorita ?? false)
  const [cuidado, setCuidado] = useState<Cuidado[]>(peca?.cuidado ? [peca.cuidado] : [])
  const [subtipo, setSubtipo] = useState<Subtipo[]>(peca?.subtipo ? [peca.subtipo] : [])
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [original, setOriginal] = useState<Blob | null>(null) // foto antes do recorte, para desfazer
  const [recorte, setRecorte] = useState<number | null>(null) // null = parado; 0..1 = progresso

  async function tirarFundo() {
    if (!foto) return
    setErro('')
    setRecorte(0)
    try {
      const semFundo = await recortarFundo(foto, setRecorte)
      setOriginal(foto)
      setFoto(semFundo)
    } catch {
      setErro('Não consegui recortar o fundo. Confira a conexão (o modelo é baixado na primeira vez) e tente de novo.')
    } finally {
      setRecorte(null)
    }
  }

  async function escolherFoto(arquivo?: File) {
    if (!arquivo) return
    setErro('')
    try {
      const reduzida = await reduzirFoto(arquivo)
      setFoto(reduzida)
      setOriginal(null)
      const tags = await sugerirTags(reduzida)
      if (tags.categoria) setCategoria(tags.categoria)
      if (tags.cor) setCor(tags.cor)
      if (tags.estilo) setEstilo(tags.estilo)
    } catch {
      setErro('Não consegui ler essa foto. Tente outra.')
    }
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!foto) {
      setErro('Adicione uma foto da peça.')
      return
    }
    setSalvando(true)
    try {
      await aoSalvar({
        id: peca?.id ?? crypto.randomUUID(),
        foto,
        categoria,
        cor,
        estilo,
        marca: marca.trim(),
        tamanho: tamanho.trim(),
        estampa: estampa[0],
        material: material[0],
        estacoes,
        ocasioes,
        favorita,
        preco: peca?.preco,
        cuidado: cuidado.find((c) => cuidadosDe(categoria).includes(c)),
        subtipo: categoria === 'acessório' ? subtipo[0] : undefined,
        cadastradaEm: peca?.cadastradaEm ?? new Date().toISOString(),
      })
    } catch {
      setErro('Não consegui salvar. Tente de novo.')
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <h1 className="text-titulo font-semibold tracking-tight">{peca ? 'Editar peça' : 'Nova peça'}</h1>

      {foto && (
        <div className="space-y-2">
          <div
            className="aspect-4/5 overflow-hidden rounded-2xl sombra"
            // xadrez cinza-claro: deixa a transparência visível depois do recorte
            style={original ? { background: 'repeating-conic-gradient(#e8decd 0 25%, #fff 0 50%) 0 0 / 20px 20px' } : undefined}
          >
            <FotoPeca foto={foto} className={`size-full ${original ? 'object-contain' : 'object-cover'}`} />
          </div>
          {original ? (
            <button type="button" onClick={() => (setFoto(original), setOriginal(null))} className="w-full rounded-xl bg-card p-3 text-sm font-semibold ring-1 ring-stone-200">
              ↩ Voltar à foto original
            </button>
          ) : (
            <button type="button" onClick={tirarFundo} disabled={recorte !== null} className="w-full rounded-xl bg-card p-3 text-sm font-semibold ring-1 ring-stone-200 disabled:opacity-60">
              {recorte === null ? '✂️ Remover fundo' : `Recortando… ${Math.round(recorte * 100)}%`}
            </button>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <label className="cursor-pointer rounded-xl bg-fill p-3 text-center text-sm font-semibold text-on-fill">
          📷 Tirar foto
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => escolherFoto(e.target.files?.[0])} />
        </label>
        <label className="cursor-pointer rounded-xl bg-card p-3 text-center text-sm font-semibold ring-1 ring-stone-200">
          🖼️ Galeria
          <input type="file" accept="image/*" className="hidden" onChange={(e) => escolherFoto(e.target.files?.[0])} />
        </label>
      </div>

      <label className="block text-sm">
        Categoria
        <select className={campo} value={categoria} onChange={(e) => setCategoria(e.target.value as Categoria)}>
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
              onClick={() => setCor(c.nome)}
              style={{ backgroundColor: c.hex }}
              className={`h-9 w-9 rounded-full border ${cor === c.nome ? 'ring-2 ring-fill ring-offset-2 ring-offset-stone-50' : 'border-stone-300'}`}
            />
          ))}
        </div>
        <span className="text-stone-500">{cor}</span>
      </div>

      <label className="block text-sm">
        Estilo
        <select className={campo} value={estilo} onChange={(e) => setEstilo(e.target.value as Estilo)}>
          {ESTILOS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>

      {categoria === 'acessório' && <Chips titulo="Tipo de acessório" opcoes={SUBTIPOS} valor={subtipo} aoMudar={setSubtipo} />}
      <Chips titulo="Estampa" opcoes={ESTAMPAS} valor={estampa} aoMudar={setEstampa} />
      <Chips titulo="Material" opcoes={MATERIAIS} valor={material} aoMudar={setMaterial} />
      <Chips titulo="Estações" opcoes={ESTACOES} valor={estacoes} aoMudar={setEstacoes} multiplo />
      <Chips titulo="Ocasiões" opcoes={OCASIOES} valor={ocasioes} aoMudar={setOcasioes} multiplo />

      <div className="rounded-2xl bg-stone-100 p-3">
        <Chips titulo="Precisa de cuidado? (sai das sugestões até ficar pronta)" opcoes={cuidadosDe(categoria)} valor={cuidado} aoMudar={setCuidado} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={favorita} onChange={(e) => setFavorita(e.target.checked)} />
        ★ Peça favorita
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm">
          Marca
          <input className={campo} value={marca} onChange={(e) => setMarca(e.target.value)} />
        </label>
        <label className="block text-sm">
          Tamanho
          <input className={campo} value={tamanho} onChange={(e) => setTamanho(e.target.value)} placeholder="M, 42…" />
        </label>
      </div>

      {erro && <p className="text-sm text-perigo">{erro}</p>}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={aoCancelar} className="rounded-xl bg-card p-3 font-semibold ring-1 ring-stone-200">Cancelar</button>
        <button type="submit" disabled={salvando} className="rounded-xl bg-sky-500 p-3 font-semibold text-white disabled:opacity-50">Salvar</button>
      </div>
    </form>
  )
}
