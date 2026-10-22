import { get, set } from 'idb-keyval'
import type { Combinacao, Medidas, Peca, TamanhoMarca } from './types'

const CHAVE_PECAS = 'pecas'

export async function listarPecas(): Promise<Peca[]> {
  return (await get<Peca[]>(CHAVE_PECAS)) ?? []
}

export async function salvarPeca(peca: Peca): Promise<void> {
  const pecas = await listarPecas()
  const i = pecas.findIndex((p) => p.id === peca.id)
  if (i >= 0) pecas[i] = peca
  else pecas.push(peca)
  await set(CHAVE_PECAS, pecas)
}

export async function removerPeca(id: string): Promise<void> {
  const pecas = await listarPecas()
  await set(CHAVE_PECAS, pecas.filter((p) => p.id !== id))
}

const CHAVE_COMBINACOES = 'combinacoes'

export async function listarCombinacoes(): Promise<Combinacao[]> {
  return (await get<Combinacao[]>(CHAVE_COMBINACOES)) ?? []
}

export async function salvarCombinacao(combinacao: Combinacao): Promise<void> {
  const todas = await listarCombinacoes()
  await set(CHAVE_COMBINACOES, [...todas, combinacao])
}

export async function removerCombinacao(id: string): Promise<void> {
  const todas = await listarCombinacoes()
  await set(CHAVE_COMBINACOES, todas.filter((c) => c.id !== id))
}

const CHAVE_MEDIDAS = 'medidas'
const CHAVE_TAMANHOS_MARCA = 'tamanhosMarca'

export async function lerMedidas(): Promise<Medidas> {
  return (await get<Medidas>(CHAVE_MEDIDAS)) ?? {}
}

export async function salvarMedidas(medidas: Medidas): Promise<void> {
  await set(CHAVE_MEDIDAS, medidas)
}

export async function listarTamanhosMarca(): Promise<TamanhoMarca[]> {
  return (await get<TamanhoMarca[]>(CHAVE_TAMANHOS_MARCA)) ?? []
}

export async function salvarTamanhosMarca(lista: TamanhoMarca[]): Promise<void> {
  await set(CHAVE_TAMANHOS_MARCA, lista)
}
