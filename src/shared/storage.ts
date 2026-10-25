import { get, set } from 'idb-keyval'
import type { Combinacao, Desejo, LookMontado, Medidas, Peca, Perfume, TamanhoMarca, Viagem } from './types'

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

const CHAVE_LOOKS = 'looksMontados'

export async function listarLooks(): Promise<LookMontado[]> {
  return (await get<LookMontado[]>(CHAVE_LOOKS)) ?? []
}

export async function salvarLook(look: LookMontado): Promise<void> {
  const todos = await listarLooks()
  const i = todos.findIndex((l) => l.id === look.id)
  if (i >= 0) todos[i] = look
  else todos.push(look)
  await set(CHAVE_LOOKS, todos)
}

export async function removerLook(id: string): Promise<void> {
  await set(CHAVE_LOOKS, (await listarLooks()).filter((l) => l.id !== id))
}

// Diário: dia (AAAA-MM-DD) -> id do look usado naquele dia.
const CHAVE_DIARIO = 'diario'
export type Diario = Record<string, string>

export async function lerDiario(): Promise<Diario> {
  return (await get<Diario>(CHAVE_DIARIO)) ?? {}
}

export async function definirDia(dia: string, lookId: string | null): Promise<void> {
  const { [dia]: _, ...resto } = await lerDiario()
  await set(CHAVE_DIARIO, lookId ? { ...resto, [dia]: lookId } : resto)
}
const CHAVE_VIAGENS = 'viagens'

export async function listarViagens(): Promise<Viagem[]> {
  return (await get<Viagem[]>(CHAVE_VIAGENS)) ?? []
}

export async function salvarViagem(viagem: Viagem): Promise<void> {
  const todas = await listarViagens()
  const i = todas.findIndex((v) => v.id === viagem.id)
  if (i >= 0) todas[i] = viagem
  else todas.push(viagem)
  await set(CHAVE_VIAGENS, todas)
}

export async function removerViagem(id: string): Promise<void> {
  await set(CHAVE_VIAGENS, (await listarViagens()).filter((v) => v.id !== id))
}

const CHAVE_PERFUMES = 'perfumes'

export async function listarPerfumes(): Promise<Perfume[]> {
  return (await get<Perfume[]>(CHAVE_PERFUMES)) ?? []
}

export async function salvarPerfume(perfume: Perfume): Promise<void> {
  const todos = await listarPerfumes()
  const i = todos.findIndex((p) => p.id === perfume.id)
  if (i >= 0) todos[i] = perfume
  else todos.push(perfume)
  await set(CHAVE_PERFUMES, todos)
}

export async function removerPerfume(id: string): Promise<void> {
  await set(CHAVE_PERFUMES, (await listarPerfumes()).filter((p) => p.id !== id))
}

const CHAVE_DESEJOS = 'desejos'

export async function listarDesejos(): Promise<Desejo[]> {
  return (await get<Desejo[]>(CHAVE_DESEJOS)) ?? []
}

export async function salvarDesejo(desejo: Desejo): Promise<void> {
  const todos = await listarDesejos()
  const i = todos.findIndex((d) => d.id === desejo.id)
  if (i >= 0) todos[i] = desejo
  else todos.push(desejo)
  await set(CHAVE_DESEJOS, todos)
}

export async function removerDesejo(id: string): Promise<void> {
  await set(CHAVE_DESEJOS, (await listarDesejos()).filter((d) => d.id !== id))
}
