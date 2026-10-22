import type { Categoria, Cor, Estilo } from '../../shared/types'

export type Tags = Partial<{ categoria: Categoria; cor: Cor; estilo: Estilo }>

// Ponto de entrada para a IA de visão. Hoje não sugere nada.
export async function sugerirTags(_foto: Blob): Promise<Tags> {
  return {}
}
