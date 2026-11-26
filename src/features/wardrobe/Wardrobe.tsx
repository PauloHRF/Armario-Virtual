import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Tela from '../../shared/Tela'
import { listarPecas, removerPeca, salvarPeca } from '../../shared/storage'
import { CATEGORIAS, CORES, ESTACOES, OCASIOES, type Categoria, type Peca } from '../../shared/types'
import FormPeca, { type RascunhoPeca } from './FormPeca'
import { useRascunho } from '../../shared/rascunho'
import FotoPeca from '../../shared/FotoPeca'
import Vazio from '../../shared/Vazio'
import Aviso from '../../shared/Aviso'

const normalizar = (texto: string) => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

function novaPeca(): RascunhoPeca {
  return {
    id: crypto.randomUUID(),
    foto: null,
    categoria: 'camiseta',
    cor: 'preto',
    estilo: 'casual',
    marca: '',
    tamanho: '',
    cadastradaEm: new Date().toISOString(),
  }
}

export default function Wardrobe() {
  const [pecas, setPecas] = useState<Peca[]>([])
  const [carregou, setCarregou] = useState(false)
  const [filtro, setFiltro] = useState<Categoria | 'todas'>('todas')
  const [extra, setExtra] = useState('') // '', '★', uma estação ou uma ocasião
  const [avisos, setAvisos] = useState(0)
  const [editando, setEditando] = useState<RascunhoPeca | null>(null)
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState('')
  const { rascunho, carregando, erro: erroRascunho, guardar, concluir } = useRascunho<RascunhoPeca>('rascunho-peca')

  async function recarregar() {
    setErro('')
    try {
      setPecas(await listarPecas())
      setCarregou(true)
    } catch {
      setErro('Não consegui carregar as peças. Confira sua conexão e tente novamente.')
    }
  }
  useEffect(() => {
    void recarregar()
  }, [])

  async function salvar(peca: Peca) {
    const nova = !pecas.some((p) => p.id === peca.id)
    await salvarPeca(peca)
    setPecas((lista) => nova ? [...lista, peca] : lista.map((item) => item.id === peca.id ? peca : item))
    await concluir()
    setEditando(null)
    if (nova) setAvisos((n) => n + 1)
  }

  async function remover(peca: RascunhoPeca) {
    if (!confirm(`Remover esta ${peca.categoria}?`)) return
    try {
      await removerPeca(peca.id)
      setPecas((lista) => lista.filter((item) => item.id !== peca.id))
      await concluir()
      setEditando(null)
      setErro('')
    } catch {
      setErro('Não consegui remover a peça. Tente de novo.')
    }
  }

  function abrir(peca: RascunhoPeca) {
    if (rascunho && rascunho.id !== peca.id && !confirm('Descartar o rascunho da peça anterior?')) return
    if (rascunho && rascunho.id !== peca.id) void guardar(null)
    setErro('')
    setEditando(rascunho?.id === peca.id ? rascunho : peca)
    window.scrollTo(0, 0)
  }

  function cancelar() {
    if (rascunho && !confirm('Descartar as alterações desta peça?')) return
    if (rascunho) void guardar(null)
    setEditando(null)
    setErro('')
  }

  if (editando) {
    const existente = pecas.some((p) => p.id === editando.id)
    return (
      <>
        {(erroRascunho || erro) && <p role="alert" className="mb-3 text-sm text-perigo">{erro || erroRascunho}</p>}
        <FormPeca
          key={editando.id}
          inicial={editando}
          editando={existente}
          aoMudar={guardar}
          aoSalvar={salvar}
          aoCancelar={cancelar}
          aoRemover={existente ? () => remover(editando) : undefined}
        />
      </>
    )
  }

  function limparFiltros() {
    setFiltro('todas')
    setExtra('')
    setBusca('')
  }

  const combinaExtra = (p: Peca) =>
    !extra ||
    (extra === '★' ? !!p.favorita : extra === 'em cuidado' ? !!p.cuidado : [...(p.estacoes ?? []), ...(p.ocasioes ?? [])].some((t) => t === extra))
  const termos = normalizar(busca).trim().split(/\s+/).filter(Boolean)
  const visiveis = pecas.filter((p) => {
    if ((filtro !== 'todas' && p.categoria !== filtro) || !combinaExtra(p)) return false
    if (!termos.length) return true
    const descricao = normalizar([p.categoria, p.subtipo, p.cor, p.estampa, p.material, p.marca, p.tamanho, p.estilo].filter(Boolean).join(' '))
    return termos.every((termo) => descricao.includes(termo))
  })
  const filtrosAtivos = [filtro === 'todas' ? '' : filtro, extra === '★' ? 'Favoritas' : extra].filter(Boolean)
  const botaoSecundario = 'min-h-11 rounded-xl bg-card px-3 text-sm font-semibold ring-1 ring-stone-200'

  return (
    <Tela titulo="Meu armário">
      {!carregou && !erro && <p role="status" className="mb-3 text-sm">Carregando peças…</p>}
      {!carregou && erro && <button onClick={recarregar} className={botaoSecundario}>Tentar novamente</button>}
      {(erroRascunho || erro) && <p role="alert" className="mb-3 text-sm text-perigo">{erro || erroRascunho}</p>}
      {rascunho && !carregando && (
        <button onClick={() => abrir(rascunho)} className="mb-4 min-h-11 w-full rounded-xl bg-fill px-3 font-semibold text-on-fill">
          Continuar edição da peça
        </button>
      )}
      <Link
        to="/guias"
        className="mb-4 flex min-h-16 items-center gap-3 rounded-2xl bg-fill p-4 text-on-fill sombra-alta transition active:scale-[0.98]"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-on-fill/10 text-xl" aria-hidden>📖</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Guias de estilo</span>
          <span className="block text-sm text-on-fill-suave">Barba, cores e como combinar</span>
        </span>
        <span aria-hidden>›</span>
      </Link>
      {pecas.length > 0 && (
        <div className="mb-4 space-y-2">
          <input
            aria-label="Buscar peças"
            type="search"
            placeholder="Buscar peças"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full"
          />
          <details className="rounded-xl border border-stone-200 bg-card px-3">
            <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">
              Filtros{filtrosAtivos.length > 0 && ` (${filtrosAtivos.length})`}
            </summary>
            <div className="grid gap-3 pb-3">
              <label className="grid gap-1 text-sm">
                Categoria
                <select value={filtro} onChange={(e) => setFiltro(e.target.value as typeof filtro)}>
                  <option value="todas">Todas</option>
                  {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                Estação, ocasião ou estado
                <select value={extra} onChange={(e) => setExtra(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="★">Favoritas</option>
                  <option>em cuidado</option>
                  <optgroup label="Estações">
                    {ESTACOES.map((t) => <option key={t}>{t}</option>)}
                  </optgroup>
                  <optgroup label="Ocasiões">
                    {OCASIOES.map((t) => <option key={t}>{t}</option>)}
                  </optgroup>
                </select>
              </label>
            </div>
          </details>
          {filtrosAtivos.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {filtrosAtivos.map((f) => <span key={f} className="rounded-full bg-fill px-3 py-1 text-sm capitalize text-on-fill">{f}</span>)}
              <button onClick={limparFiltros} className={botaoSecundario}>Limpar filtros</button>
            </div>
          )}
        </div>
      )}

      {carregou && pecas.length === 0 && (
        <Vazio
          emoji="👕"
          titulo="Seu armário está vazio"
          texto="Fotografe sua primeira peça. Com 6 peças já dá para receber sugestões de looks."
          acao={
            <button onClick={() => abrir(novaPeca())} disabled={carregando} className="min-h-12 w-full rounded-2xl bg-sky-500 font-semibold text-white sombra-alta">
              Cadastrar primeira peça
            </button>
          }
        />
      )}
      {pecas.length > 0 && visiveis.length === 0 && (
        <Vazio
          emoji="🔍"
          titulo="Nenhuma peça encontrada"
          texto="Ajuste a busca ou os filtros para ver mais peças."
          acao={<button onClick={limparFiltros} className={botaoSecundario}>Limpar busca e filtros</button>}
        />
      )}
      <Aviso mensagem="Peça adicionada ao armário ✓" chave={avisos} />

      <ul className="grid grid-cols-2 gap-3 pb-14">
        {visiveis.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => abrir(p)} disabled={carregando}
              className="group relative w-full overflow-hidden rounded-2xl bg-card text-left sombra transition active:scale-[0.98]"
            >
              <div className="aspect-4/5 bg-stone-100">
                <FotoPeca foto={p.foto} className="size-full object-cover" />
              </div>
              {p.cuidado && (
                <span className="absolute top-2 left-2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">{p.cuidado}</span>
              )}
              {p.favorita && (
                <span className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-card/90 text-acento shadow">★</span>
              )}
              <div className="p-3">
                <p className="font-semibold capitalize">{p.categoria}</p>
                <p className="mt-1 flex items-center gap-2 text-xs text-stone-500">
                  <span
                    className="size-3 shrink-0 rounded-full ring-1 ring-stone-300"
                    style={{ background: CORES.find((c) => c.nome === p.cor)?.hex }}
                  />
                  <span className="truncate">{[p.subtipo, p.cor, p.estampa, p.material, p.marca].filter(Boolean).join(' · ')}</span>
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {pecas.length > 0 && (
        <button
          onClick={() => abrir(novaPeca())} disabled={carregando}
          className="fixed right-5 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-10 flex items-center gap-2 rounded-full bg-sky-500 px-6 py-3 font-semibold text-white sombra-alta transition active:scale-95"
        >
          <span className="text-base leading-none">+</span> Adicionar peça
        </button>
      )}
    </Tela>
  )
}
