import { get, set } from 'idb-keyval'

// Tudo o que o app guarda no aparelho. Se uma função nova guardar dados, a chave entra aqui.
export const CHAVES = [
  'pecas',
  'combinacoes',
  'medidas',
  'tamanhosMarca',
  'looksMontados',
  'diario',
  'viagens',
  'perfumes',
  'desejos',
] as const

const VERSAO = 1
type Cru = Record<string, unknown>

const paraDataUrl = (blob: Blob) =>
  new Promise<string>((ok, erro) => {
    const r = new FileReader()
    r.onload = () => ok(r.result as string)
    r.onerror = () => erro(r.error)
    r.readAsDataURL(blob)
  })

// Fotos (Blob) viram texto no arquivo: { __blob: "data:image/jpeg;base64,..." }.
async function codificar(v: unknown): Promise<unknown> {
  if (v instanceof Blob) return { __blob: await paraDataUrl(v) }
  if (Array.isArray(v)) return Promise.all(v.map(codificar))
  if (v && typeof v === 'object') {
    return Object.fromEntries(await Promise.all(Object.entries(v).map(async ([k, x]) => [k, await codificar(x)])))
  }
  return v
}

async function decodificar(v: unknown): Promise<unknown> {
  if (v && typeof v === 'object' && '__blob' in v && typeof (v as Cru).__blob === 'string') {
    const url = (v as Cru).__blob as string
    if (!url.startsWith('data:image/')) throw new Error('Arquivo com foto inválida')
    return (await fetch(url)).blob()
  }
  if (Array.isArray(v)) return Promise.all(v.map(decodificar))
  if (v && typeof v === 'object') {
    return Object.fromEntries(await Promise.all(Object.entries(v).map(async ([k, x]) => [k, await decodificar(x)])))
  }
  return v
}

export async function exportarTudo(): Promise<Blob> {
  const dados: Cru = {}
  for (const chave of CHAVES) {
    const valor = await get(chave)
    if (valor !== undefined) dados[chave] = await codificar(valor)
  }
  const arquivo = { app: 'armario-virtual', versao: VERSAO, exportadoEm: new Date().toISOString(), dados }
  return new Blob([JSON.stringify(arquivo)], { type: 'application/json' })
}

export type Resumo = Record<string, number> // chave -> quantos itens novos entraram

const ehLista = (v: unknown): v is Cru[] => Array.isArray(v)
const ehObjeto = (v: unknown): v is Cru => !!v && typeof v === 'object' && !Array.isArray(v)

// Importa SEM apagar nada: itens com id novo entram; os que já existem ficam como estão.
export async function importarArquivo(texto: string): Promise<Resumo> {
  let arquivo: unknown
  try {
    arquivo = JSON.parse(texto)
  } catch {
    throw new Error('Esse arquivo não é um backup do Armário Virtual.')
  }
  if (!ehObjeto(arquivo) || arquivo.app !== 'armario-virtual' || !ehObjeto(arquivo.dados)) {
    throw new Error('Esse arquivo não é um backup do Armário Virtual.')
  }
  if (typeof arquivo.versao !== 'number' || arquivo.versao > VERSAO) {
    throw new Error('Backup de uma versão mais nova do app. Atualize o app e tente de novo.')
  }
  const resumo: Resumo = {}
  for (const chave of CHAVES) {
    const entrada = arquivo.dados[chave]
    if (entrada === undefined) continue
    const novo = await decodificar(entrada)
    const atual = await get(chave)
    if (ehLista(novo)) {
      const lista = ehLista(atual) ? atual : []
      const ids = new Set(lista.map((i) => i?.id))
      const entram = novo.filter((i) => ehObjeto(i) && typeof i.id === 'string' && !ids.has(i.id))
      if (entram.length) await set(chave, [...lista, ...entram])
      resumo[chave] = entram.length
    } else if (ehObjeto(novo)) {
      const base = ehObjeto(atual) ? atual : {}
      const entram = Object.keys(novo).filter((k) => !(k in base))
      if (entram.length) await set(chave, { ...novo, ...base })
      resumo[chave] = entram.length
    }
  }
  return resumo
}
