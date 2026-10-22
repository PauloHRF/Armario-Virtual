import { get, set } from 'idb-keyval'
import type { Peca } from './types'

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
