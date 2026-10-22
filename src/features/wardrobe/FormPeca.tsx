import { useState, type FormEvent } from 'react'
import { CATEGORIAS, CORES, ESTILOS, type Categoria, type Cor, type Estilo, type Peca } from '../../shared/types'
import { reduzirFoto } from './reduzirFoto'
import { sugerirTags } from './sugerirTags'
import FotoPeca from './FotoPeca'

type Props = {
  peca: Peca | null // null = nova peça
  aoSalvar: (peca: Peca) => Promise<void>
  aoCancelar: () => void
}

const campo = 'w-full rounded-lg border border-stone-300 bg-white p-2'

export default function FormPeca({ peca, aoSalvar, aoCancelar }: Props) {
  const [foto, setFoto] = useState<Blob | null>(peca?.foto ?? null)
  const [categoria, setCategoria] = useState<Categoria>(peca?.categoria ?? 'camiseta')
  const [cor, setCor] = useState<Cor>(peca?.cor ?? 'preto')
  const [estilo, setEstilo] = useState<Estilo>(peca?.estilo ?? 'casual')
  const [marca, setMarca] = useState(peca?.marca ?? '')
  const [tamanho, setTamanho] = useState(peca?.tamanho ?? '')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function escolherFoto(arquivo?: File) {
    if (!arquivo) return
    setErro('')
    try {
      const reduzida = await reduzirFoto(arquivo)
      setFoto(reduzida)
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
        cadastradaEm: peca?.cadastradaEm ?? new Date().toISOString(),
      })
    } catch {
      setErro('Não consegui salvar. Tente de novo.')
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <h1 className="text-xl font-bold">{peca ? 'Editar peça' : 'Nova peça'}</h1>

      {foto && <FotoPeca foto={foto} className="mx-auto h-56 w-full rounded-lg object-cover" />}
      <div className="grid grid-cols-2 gap-2">
        <label className="cursor-pointer rounded-lg bg-stone-900 p-2 text-center text-sm text-white">
          📷 Tirar foto
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => escolherFoto(e.target.files?.[0])} />
        </label>
        <label className="cursor-pointer rounded-lg border border-stone-300 bg-white p-2 text-center text-sm">
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
              className={`h-9 w-9 rounded-full border ${cor === c.nome ? 'ring-2 ring-stone-900 ring-offset-2' : 'border-stone-300'}`}
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

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={aoCancelar} className="rounded-lg border border-stone-300 bg-white p-2">Cancelar</button>
        <button type="submit" disabled={salvando} className="rounded-lg bg-stone-900 p-2 text-white disabled:opacity-50">Salvar</button>
      </div>
    </form>
  )
}
