import type { Medidas } from '../../shared/types'
import tabelas from './tabelas.json'

type Faixa = { tamanho: string; ate: number }
export type Loja = (typeof tabelas.lojas)[number]

export const lojas: Loja[] = tabelas.lojas

// Primeira faixa cujo limite superior (exclusivo) fica acima da medida.
function buscar(faixas: Faixa[], medida?: number): string {
  if (medida === undefined) return '—'
  if (faixas.length === 0) return 'sem tabela'
  return faixas.find((f) => medida < f.ate)?.tamanho ?? 'acima da tabela'
}

export function tamanhosNaLoja(loja: Loja, m: Medidas) {
  return {
    camiseta: buscar(loja.camiseta, m.peito),
    calca: buscar(loja.calca, m.cintura),
    calcado: buscar(loja.calcado, m.pe),
  }
}
