import { useEffect, useState } from 'react'
import Tela from '../../shared/Tela'
import {
  lerMedidas,
  listarTamanhosMarca,
  salvarMedidas,
  salvarTamanhosMarca,
} from '../../shared/storage'
import type { Medidas, TamanhoMarca } from '../../shared/types'
import { lojas, tamanhosNaLoja } from './calcular'

const CAMPOS: { chave: keyof Medidas; nome: string; unidade: string }[] = [
  { chave: 'altura', nome: 'Altura', unidade: 'cm' },
  { chave: 'peso', nome: 'Peso', unidade: 'kg' },
  { chave: 'peito', nome: 'Peito', unidade: 'cm' },
  { chave: 'cintura', nome: 'Cintura', unidade: 'cm' },
  { chave: 'quadril', nome: 'Quadril', unidade: 'cm' },
  { chave: 'pe', nome: 'Pé (comprimento)', unidade: 'cm' },
]

const campo = 'w-full rounded-lg border border-stone-300 bg-card p-2'

export default function Sizes() {
  // Os campos guardam texto; vazio = medida não informada.
  const [texto, setTexto] = useState<Record<string, string>>({})
  const [marcas, setMarcas] = useState<TamanhoMarca[]>([])
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    lerMedidas().then((m) =>
      setTexto(Object.fromEntries(Object.entries(m).map(([k, v]) => [k, String(v)]))),
    )
    listarTamanhosMarca().then(setMarcas)
  }, [])

  const medidas: Medidas = {}
  for (const { chave } of CAMPOS) {
    const n = parseFloat((texto[chave] ?? '').replace(',', '.'))
    if (!Number.isNaN(n) && n > 0) medidas[chave] = n
  }

  async function salvarTudo() {
    await salvarMedidas(medidas)
    await salvarTamanhosMarca(marcas.filter((m) => m.marca.trim() || m.tamanho.trim()))
    setSalvo(true)
  }

  function editarMarca(id: string, parte: Partial<TamanhoMarca>) {
    setMarcas(marcas.map((m) => (m.id === id ? { ...m, ...parte } : m)))
    setSalvo(false)
  }

  return (
    <Tela titulo="Tamanhos">
      <h2 className="mb-2 font-display text-secao font-semibold">Suas medidas</h2>
      <p className="mb-3 text-sm text-stone-500">Todas opcionais. Preencha o que souber.</p>
      <div className="grid grid-cols-2 gap-2">
        {CAMPOS.map((c) => (
          <label key={c.chave} className="block text-sm">
            {c.nome} ({c.unidade})
            <input
              className={campo}
              inputMode="decimal"
              value={texto[c.chave] ?? ''}
              onChange={(e) => {
                setTexto({ ...texto, [c.chave]: e.target.value })
                setSalvo(false)
              }}
            />
          </label>
        ))}
      </div>

      <h2 className="mb-2 mt-6 font-display text-secao font-semibold">Seu tamanho por marca</h2>
      <p className="mb-3 text-sm text-stone-500">O que você já sabe que serve, por marca ou loja.</p>
      <ul className="space-y-2">
        {marcas.map((m) => (
          <li key={m.id} className="flex gap-2">
            <input
              className={campo}
              placeholder="Marca ou loja"
              aria-label="Marca ou loja"
              value={m.marca}
              onChange={(e) => editarMarca(m.id, { marca: e.target.value })}
            />
            <input
              className="w-24 rounded-lg border border-stone-300 bg-card p-2"
              placeholder="Tam."
              aria-label="Tamanho"
              value={m.tamanho}
              onChange={(e) => editarMarca(m.id, { tamanho: e.target.value })}
            />
            <button
              onClick={() => {
                setMarcas(marcas.filter((x) => x.id !== m.id))
                setSalvo(false)
              }}
              aria-label="Remover"
              className="px-2 text-red-600"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={() => {
          setMarcas([...marcas, { id: crypto.randomUUID(), marca: '', tamanho: '' }])
          setSalvo(false)
        }}
        className="mt-2 min-h-11 text-sm underline"
      >
        + Adicionar marca
      </button>

      <button onClick={salvarTudo} className="mt-6 min-h-12 w-full rounded-2xl bg-sky-500 font-semibold text-white sombra-alta">
        {salvo ? 'Salvo ✓' : 'Salvar'}
      </button>

      <h2 className="mb-2 mt-8 font-display text-secao font-semibold">Seu tamanho em cada loja</h2>
      {Object.keys(medidas).length === 0 && (
        <p className="text-sm text-stone-500">Informe peito, cintura ou pé para ver o tamanho em cada loja.</p>
      )}
      <ul className="space-y-3">
        {lojas.map((loja) => {
          const t = tamanhosNaLoja(loja, medidas)
          return (
            <li key={loja.id} className="rounded-lg border border-stone-200 bg-card p-3">
              <p className="font-semibold">{loja.nome}</p>
              <dl className="mt-1 grid grid-cols-3 gap-2 text-sm">
                <div><dt className="text-stone-500">Camiseta</dt><dd>{t.camiseta}</dd></div>
                <div><dt className="text-stone-500">Calça</dt><dd>{t.calca}</dd></div>
                <div><dt className="text-stone-500">Calçado</dt><dd>{t.calcado}</dd></div>
              </dl>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-xs text-stone-400">Tabelas de demonstração: os valores são aproximados e ilustrativos.</p>
    </Tela>
  )
}
