import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Aviso from '../../shared/Aviso'
import FotoPeca from '../../shared/FotoPeca'
import Vazio from '../../shared/Vazio'
import { listarDesejos, removerDesejo, salvarDesejo, salvarPeca } from '../../shared/storage'
import { CATEGORIAS, CORES, type Categoria, type Cor, type Desejo } from '../../shared/types'
import { reduzirFoto } from '../wardrobe/reduzirFoto'

const reais = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Só aceita endereços http(s): evita abrir "javascript:" ou outros esquemas.
function linkSeguro(texto: string): string | undefined {
  const t = texto.trim()
  if (!t) return undefined
  try {
    const url = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}

function Formulario({ desejo, aoSalvar, aoCancelar, aoExcluir }: {
  desejo: Desejo | null
  aoSalvar: (d: Desejo) => Promise<void>
  aoCancelar: () => void
  aoExcluir?: () => void
}) {
  const [foto, setFoto] = useState<Blob | null>(desejo?.foto ?? null)
  const [nome, setNome] = useState(desejo?.nome ?? '')
  const [categoria, setCategoria] = useState<Categoria>(desejo?.categoria ?? 'camiseta')
  const [cor, setCor] = useState<Cor>(desejo?.cor ?? 'preto')
  const [marca, setMarca] = useState(desejo?.marca ?? '')
  const [preco, setPreco] = useState(desejo?.preco?.toString() ?? '')
  const [link, setLink] = useState(desejo?.link ?? '')
  const [urgente, setUrgente] = useState(desejo?.urgente ?? false)
  const [erro, setErro] = useState('')

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!foto) return setErro('Adicione uma foto (pode ser um print da loja).')
    if (!nome.trim()) return setErro('Dê um nome ao item.')
    if (link.trim() && !linkSeguro(link)) return setErro('Esse link não parece válido.')
    const valor = preco.trim() ? Number(preco.replace(',', '.')) : undefined
    if (valor !== undefined && (!Number.isFinite(valor) || valor < 0)) return setErro('Preço inválido.')
    await aoSalvar({
      id: desejo?.id ?? crypto.randomUUID(),
      nome: nome.trim(),
      categoria,
      cor,
      foto,
      marca: marca.trim(),
      preco: valor,
      link: linkSeguro(link),
      urgente,
      criadoEm: desejo?.criadoEm ?? new Date().toISOString(),
    })
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <h1 className="text-[28px] leading-9 font-semibold tracking-tight">{desejo ? 'Editar desejo' : 'Novo desejo'}</h1>
      {foto && <FotoPeca foto={foto} className="mx-auto aspect-square w-48 rounded-2xl bg-stone-100 object-cover ring-1 ring-stone-200" />}
      <label className="block cursor-pointer rounded-xl bg-card p-3 text-center text-sm font-semibold ring-1 ring-stone-200">
        🖼️ {foto ? 'Trocar foto' : 'Adicionar foto'}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const arquivo = e.target.files?.[0]
            if (arquivo) setFoto(await reduzirFoto(arquivo, 600).catch(() => foto))
          }}
        />
      </label>
      <label className="block text-sm">
        O que é?
        <input className="mt-1 w-full" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Tênis branco de couro" />
      </label>
      <label className="block text-sm">
        Categoria
        <select className="mt-1 w-full" value={categoria} onChange={(e) => setCategoria(e.target.value as Categoria)}>
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
              className={`size-9 rounded-full border ${cor === c.nome ? 'ring-2 ring-fill ring-offset-2 ring-offset-stone-50' : 'border-stone-300'}`}
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm">
          Marca
          <input className="mt-1 w-full" value={marca} onChange={(e) => setMarca(e.target.value)} />
        </label>
        <label className="block text-sm">
          Preço (R$)
          <input className="mt-1 w-full" inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="199,90" />
        </label>
      </div>
      <label className="block text-sm">
        Link da loja (opcional)
        <input className="mt-1 w-full" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="loja.com.br/produto" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={urgente} onChange={(e) => setUrgente(e.target.checked)} />
        Quero muito (aparece primeiro)
      </label>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={aoCancelar} className="min-h-12 rounded-2xl bg-card font-semibold ring-1 ring-stone-200">Cancelar</button>
        <button type="submit" className="min-h-12 rounded-2xl bg-sky-500 font-semibold text-white">Salvar</button>
      </div>
      {aoExcluir && <button type="button" onClick={aoExcluir} className="min-h-12 w-full rounded-2xl border border-red-200 text-red-600">Remover da lista</button>}
    </form>
  )
}

export default function Desejos({ aoEditar }: { aoEditar: (editando: boolean) => void }) {
  const [desejos, setDesejos] = useState<Desejo[]>([])
  const [carregou, setCarregou] = useState(false)
  const [editando, setEditando] = useState<Desejo | 'novo' | null>(null)
  const [avisos, setAvisos] = useState(0)

  async function carregar() {
    setDesejos(await listarDesejos())
    setCarregou(true)
  }
  useEffect(() => {
    carregar()
  }, [])
  useEffect(() => {
    aoEditar(editando !== null)
    return () => aoEditar(false)
  }, [editando, aoEditar])

  // "Comprei": o desejo vira peça do armário (com o preço pago) e sai da lista.
  async function comprei(d: Desejo) {
    await salvarPeca({
      id: crypto.randomUUID(),
      foto: d.foto,
      categoria: d.categoria,
      cor: d.cor,
      estilo: 'casual',
      marca: d.marca,
      tamanho: '',
      preco: d.preco,
      cadastradaEm: new Date().toISOString(),
    })
    await removerDesejo(d.id)
    await carregar()
    setAvisos((n) => n + 1)
  }

  if (editando) {
    const atual = editando === 'novo' ? null : editando
    return (
      <Formulario
        key={atual?.id ?? 'novo'}
        desejo={atual}
        aoCancelar={() => setEditando(null)}
        aoSalvar={async (d) => {
          await salvarDesejo(d)
          await carregar()
          setEditando(null)
        }}
        aoExcluir={
          atual
            ? async () => {
                if (!confirm(`Remover "${atual.nome}" da lista?`)) return
                await removerDesejo(atual.id)
                await carregar()
                setEditando(null)
              }
            : undefined
        }
      />
    )
  }

  const ordenados = [...desejos].sort((a, b) => Number(b.urgente) - Number(a.urgente) || b.criadoEm.localeCompare(a.criadoEm))
  const total = desejos.reduce((soma, d) => soma + (d.preco ?? 0), 0)

  return (
    <>
      {carregou && desejos.length === 0 ? (
        <Vazio
          emoji="🛍️"
          titulo="Nenhum desejo ainda"
          texto="Guarde aqui o que você quer comprar. Quando comprar, um toque move para o armário."
          acao={
            <button onClick={() => setEditando('novo')} className="min-h-12 w-full rounded-2xl bg-sky-500 font-semibold text-white sombra-alta">
              Adicionar o primeiro
            </button>
          }
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-stone-600">
            {desejos.length} {desejos.length === 1 ? 'item' : 'itens'}
            {total > 0 && <> · total <span className="font-semibold text-stone-900">{reais(total)}</span></>}
          </p>
          <ul className="space-y-3">
            {ordenados.map((d) => (
              <li key={d.id} className="flex gap-3 rounded-2xl bg-card p-3 sombra ring-1 ring-stone-200">
                <button onClick={() => setEditando(d)} aria-label={`Editar ${d.nome}`} className="shrink-0">
                  <FotoPeca foto={d.foto} className="size-24 rounded-xl bg-stone-100 object-cover" />
                </button>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="font-semibold">{d.urgente && <span className="text-acento">★ </span>}{d.nome}</p>
                  <p className="truncate text-xs text-stone-500 capitalize">{[d.categoria, d.cor, d.marca].filter(Boolean).join(' · ')}</p>
                  {d.preco !== undefined && <p className="mt-1 text-sm font-semibold">{reais(d.preco)}</p>}
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                    <button onClick={() => comprei(d)} className="min-h-11 rounded-xl bg-sky-500 px-4 text-sm font-semibold text-white">Comprei</button>
                    {d.link && (
                      <a href={d.link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-acento">
                        Ver na loja ↗
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setEditando('novo')}
            className="fixed right-5 bottom-24 flex items-center gap-1.5 rounded-full bg-sky-500 px-5 py-3 font-semibold text-white sombra-alta transition active:scale-95"
          >
            <span className="text-base leading-none">+</span> Novo desejo
          </button>
        </>
      )}
      <Aviso mensagem="Movida para o armário ✓" chave={avisos} />
      {avisos > 0 && (
        <Link to="/armario" className="mt-4 block text-center text-sm font-semibold text-acento">Ver no armário →</Link>
      )}
    </>
  )
}
