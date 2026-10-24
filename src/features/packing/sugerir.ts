import { CORES_NEUTRAS, type Estacao, type Peca } from '../../shared/types'
import { embaralhar, serve } from '../outfits/gerar'

// Quantas peças de cada tipo levar numa viagem de `dias` dias.
// Regra simples: uma peça de cima por dia, uma de baixo a cada dois dias, até 2 calçados,
// 1 agasalho se for frio e até 2 acessórios.
function quantidades(dias: number, estacao?: Estacao) {
  const frio = estacao === 'inverno' || estacao === 'outono'
  return {
    cima: dias,
    baixo: Math.ceil(dias / 2),
    calçado: Math.min(2, Math.ceil(dias / 4)),
    jaqueta: frio ? 1 : 0,
    acessório: Math.min(2, Math.ceil(dias / 5)),
  }
}

const grupo = (p: Peca) => (p.categoria === 'camiseta' || p.categoria === 'camisa' ? 'cima' : p.categoria === 'calça' || p.categoria === 'bermuda' ? 'baixo' : p.categoria)

// Favoritas primeiro, depois cores neutras (combinam entre si); o resto, em ordem aleatória.
export function sugerirMala(pecas: Peca[], dias: number, estacao?: Estacao): string[] {
  const usaveis = pecas.filter((p) => serve(p.estacoes, estacao))
  const q = quantidades(dias, estacao)
  const ids: string[] = []
  for (const [g, n] of Object.entries(q)) {
    const candidatas = embaralhar(usaveis.filter((p) => grupo(p) === g)).sort(
      (a, b) => Number(!!b.favorita) - Number(!!a.favorita) || Number(CORES_NEUTRAS.includes(b.cor)) - Number(CORES_NEUTRAS.includes(a.cor)),
    )
    ids.push(...candidatas.slice(0, n).map((p) => p.id))
  }
  return ids
}
