import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Tela from '../../shared/Tela'
import Chips from '../../shared/Chips'
import Vazio from '../../shared/Vazio'
import Aviso from '../../shared/Aviso'
import FotoPeca from '../../shared/FotoPeca'
import { listarPerfumes, removerPerfume, salvarPerfume } from '../../shared/storage'
import {
  ESTACOES, INTENSIDADES, NOTAS, OCASIOES,
  type Estacao, type Intensidade, type Nota, type Ocasiao, type Perfume,
} from '../../shared/types'
import { reduzirFoto } from '../wardrobe/reduzirFoto'
import { chaveDia, estacaoAtual, sugerirPerfumes, ultimoUso } from './sugerir'

function Formulario({ perfume, aoSalvar, aoCancelar, aoExcluir }: {
  perfume: Perfume | null
  aoSalvar: (p: Perfume) => Promise<void>
  aoCancelar: () => void
  aoExcluir?: () => void
}) {
  const [nome, setNome] = useState(perfume?.nome ?? '')
  const [marca, setMarca] = useState(perfume?.marca ?? '')
  const [foto, setFoto] = useState<Blob | undefined>(perfume?.foto)
  const [notas, setNotas] = useState<Nota[]>(perfume?.notas ?? [])
  const [intensidade, setIntensidade] = useState<Intensidade[]>([perfume?.intensidade ?? 'moderado'])
  const [estacoes, setEstacoes] = useState<Estacao[]>(perfume?.estacoes ?? [])
  const [ocasioes, setOcasioes] = useState<Ocasiao[]>(perfume?.ocasioes ?? [])
  const [favorito, setFavorito] = useState(perfume?.favorito ?? false)
  const [erro, setErro] = useState('')

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return setErro('Dê um nome ao perfume.')
    await aoSalvar({
      id: perfume?.id ?? crypto.randomUUID(),
      nome: nome.trim(),
      marca: marca.trim(),
      foto,
      notas,
      intensidade: intensidade[0] ?? 'moderado',
      estacoes,
      ocasioes,
      favorito,
      usos: perfume?.usos ?? [],
    })
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <h1 className="text-[28px] leading-9 font-semibold tracking-tight">{perfume ? 'Editar perfume' : 'Novo perfume'}</h1>
      {foto && <FotoPeca foto={foto} className="mx-auto aspect-square w-40 rounded-2xl bg-stone-100 object-cover ring-1 ring-stone-200" />}
      <label className="block cursor-pointer rounded-xl bg-card p-3 text-center text-sm font-semibold ring-1 ring-stone-200">
        📷 {foto ? 'Trocar foto' : 'Adicionar foto (opcional)'}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const arquivo = e.target.files?.[0]
            if (arquivo) setFoto(await reduzirFoto(arquivo, 500).catch(() => foto))
          }}
        />
      </label>
      <label className="block text-sm">
        Nome
        <input className="mt-1 w-full" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Sauvage" />
      </label>
      <label className="block text-sm">
        Marca
        <input className="mt-1 w-full" value={marca} onChange={(e) => setMarca(e.target.value)} />
      </label>
      <Chips titulo="Notas" opcoes={NOTAS} valor={notas} aoMudar={setNotas} multiplo />
      <Chips titulo="Intensidade" opcoes={INTENSIDADES} valor={intensidade} aoMudar={setIntensidade} />
      <Chips titulo="Estações" opcoes={ESTACOES} valor={estacoes} aoMudar={setEstacoes} multiplo />
      <Chips titulo="Ocasiões" opcoes={OCASIOES} valor={ocasioes} aoMudar={setOcasioes} multiplo />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={favorito} onChange={(e) => setFavorito(e.target.checked)} />
        ★ Perfume favorito
      </label>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={aoCancelar} className="min-h-12 rounded-2xl bg-card font-semibold ring-1 ring-stone-200">Cancelar</button>
        <button type="submit" className="min-h-12 rounded-2xl bg-sky-500 font-semibold text-white">Salvar</button>
      </div>
      {aoExcluir && (
        <button type="button" onClick={aoExcluir} className="min-h-12 w-full rounded-2xl border border-red-200 text-red-600">Excluir perfume</button>
      )}
    </form>
  )
}

export default function Perfumes() {
  const [perfumes, setPerfumes] = useState<Perfume[]>([])
  const [carregou, setCarregou] = useState(false)
  const [editando, setEditando] = useState<Perfume | 'novo' | null>(null)
  const [estacao, setEstacao] = useState<Estacao[]>([estacaoAtual()])
  const [ocasiao, setOcasiao] = useState<Ocasiao[]>(['dia a dia'])
  const [avisos, setAvisos] = useState(0)

  async function carregar() {
    setPerfumes(await listarPerfumes())
    setCarregou(true)
  }
  useEffect(() => {
    carregar()
  }, [])

  const hoje = chaveDia(new Date())
  const sugestoes = useMemo(
    () => (estacao[0] && ocasiao[0] ? sugerirPerfumes(perfumes, estacao[0], ocasiao[0]) : []),
    [perfumes, estacao, ocasiao],
  )

  async function usarHoje(p: Perfume) {
    if (p.usos.includes(hoje)) return
    await salvarPerfume({ ...p, usos: [...p.usos, hoje] })
    await carregar()
    setAvisos((n) => n + 1)
  }

  if (editando) {
    const atual = editando === 'novo' ? null : editando
    return (
      <Formulario
        key={atual?.id ?? 'novo'}
        perfume={atual}
        aoCancelar={() => setEditando(null)}
        aoSalvar={async (p) => {
          await salvarPerfume(p)
          await carregar()
          setEditando(null)
        }}
        aoExcluir={
          atual
            ? async () => {
                if (!confirm(`Excluir "${atual.nome}"?`)) return
                await removerPerfume(atual.id)
                await carregar()
                setEditando(null)
              }
            : undefined
        }
      />
    )
  }

  const [melhor, ...outras] = sugestoes

  return (
    <Tela titulo="Perfumes">
      {carregou && perfumes.length === 0 ? (
        <Vazio
          emoji="💨"
          titulo="Sua coleção está vazia"
          texto="Cadastre seus perfumes e receba a sugestão do melhor para cada estação e ocasião."
          acao={
            <button onClick={() => setEditando('novo')} className="min-h-12 w-full rounded-2xl bg-sky-500 font-semibold text-white sombra-alta">
              Cadastrar primeiro perfume
            </button>
          }
        />
      ) : (
        <>
          <div className="space-y-3 rounded-2xl bg-card p-4 sombra ring-1 ring-stone-200">
            <h2 className="font-display text-base font-semibold">Qual usar hoje?</h2>
            <Chips titulo="Estação" opcoes={ESTACOES} valor={estacao} aoMudar={setEstacao} />
            <Chips titulo="Ocasião" opcoes={OCASIOES} valor={ocasiao} aoMudar={setOcasiao} />
            {melhor ? (
              <div className="rounded-xl bg-sky-500/10 p-3">
                <p className="text-xs text-stone-600">Sugestão</p>
                <p className="font-display text-base font-semibold">{melhor.perfume.nome}{melhor.perfume.marca && ` · ${melhor.perfume.marca}`}</p>
                <p className="mt-1 text-sm text-stone-600 first-letter:uppercase">{melhor.motivos.join(' · ')}</p>
                <button onClick={() => usarHoje(melhor.perfume)} disabled={melhor.perfume.usos.includes(hoje)} className="mt-3 min-h-11 w-full rounded-xl bg-sky-500 font-semibold text-white disabled:opacity-50">
                  {melhor.perfume.usos.includes(hoje) ? 'Já usado hoje ✓' : 'Vou usar este'}
                </button>
                {outras.length > 0 && <p className="mt-2 text-xs text-stone-500">Outras opções: {outras.slice(0, 3).map((s) => s.perfume.nome).join(', ')}</p>}
              </div>
            ) : (
              <p className="text-sm text-stone-500">Nenhum perfume combina com essa estação e ocasião. Cadastre as estações e ocasiões de cada um para melhorar as sugestões.</p>
            )}
          </div>

          <h2 className="mt-8 mb-2 font-display text-base font-semibold">Minha coleção</h2>
          <ul className="grid grid-cols-2 gap-3">
            {perfumes.map((p) => (
              <li key={p.id} className="overflow-hidden rounded-2xl bg-card sombra ring-1 ring-stone-200">
                <button onClick={() => setEditando(p)} className="block w-full text-left">
                  <div className="grid aspect-square place-items-center bg-stone-100">
                    {p.foto ? <FotoPeca foto={p.foto} className="size-full object-cover" /> : <svg viewBox="0 0 24 24" className="size-14 text-stone-400" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6v3H9V3Zm-2 3h10a1 1 0 0 1 1 1v3H6V7a1 1 0 0 1 1-1Zm-1 4h12v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-9Zm6 3v4" /></svg>}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold">{p.favorito && '★ '}{p.nome}</p>
                    <p className="truncate text-xs text-stone-500">{[p.marca, p.intensidade].filter(Boolean).join(' · ')}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {p.usos.length} {p.usos.length === 1 ? 'uso' : 'usos'}
                      {ultimoUso(p) && ` · último ${ultimoUso(p)!.split('-').reverse().slice(0, 2).join('/')}`}
                    </p>
                  </div>
                </button>
                <button onClick={() => usarHoje(p)} disabled={p.usos.includes(hoje)} className="min-h-11 w-full border-t border-stone-200 text-sm font-semibold text-acento disabled:text-stone-400">
                  {p.usos.includes(hoje) ? 'Usado hoje ✓' : 'Usei hoje'}
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setEditando('novo')}
            className="fixed right-5 bottom-24 flex items-center gap-1.5 rounded-full bg-sky-500 px-5 py-3 font-semibold text-white sombra-alta transition active:scale-95"
          >
            <span className="text-base leading-none">+</span> Novo perfume
          </button>
        </>
      )}
      <Aviso mensagem="Uso registrado ✓" chave={avisos} />
    </Tela>
  )
}
