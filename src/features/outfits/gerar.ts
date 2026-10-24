import { CORES_NEUTRAS, type Categoria, type Estacao, type Ocasiao, type Peca } from '../../shared/types'

export type Look = {
  cima: Peca
  baixo: Peca
  calcado: Peca
  explicacao: string
}

const CIMA: Categoria[] = ['camiseta', 'camisa']
const BAIXO: Categoria[] = ['calça', 'bermuda']

const neutra = (p: Peca) => CORES_NEUTRAS.includes(p.cor)

function artigo(categoria: Categoria) {
  return categoria === 'calçado' ? 'do' : 'da'
}

function explicar(partes: Peca[]): string {
  const estilo = partes[0].estilo
  const fortes = partes.filter((p) => !neutra(p))
  if (fortes.length === 0) {
    return `Todas as peças são de cores neutras, que combinam entre si, e o estilo é ${estilo} em tudo.`
  }
  const f = fortes[0]
  return `O destaque é o ${f.cor} ${artigo(f.categoria)} ${f.categoria}; o resto é neutro, então a cor não briga, e o estilo é ${estilo} em tudo.`
}

export type Filtro = { estacao?: Estacao; ocasiao?: Ocasiao }

// Peça sem estações/ocasiões cadastradas serve para qualquer uma (não é excluída).
export const serve = <T extends string>(lista: T[] | undefined, v: T | undefined) => !v || !lista?.length || lista.includes(v)

// Todas as combinações válidas: 1 de cima + 1 de baixo + calçado,
// mesmo estilo, no máximo uma cor forte e, se pedido, para a estação/ocasião escolhida.
export function gerarLooks(todas: Peca[], filtro: Filtro = {}): Look[] {
  const pecas = todas.filter((p) => serve(p.estacoes, filtro.estacao) && serve(p.ocasioes, filtro.ocasiao))
  const cimas = pecas.filter((p) => CIMA.includes(p.categoria))
  const baixos = pecas.filter((p) => BAIXO.includes(p.categoria))
  const calcados = pecas.filter((p) => p.categoria === 'calçado')
  const looks: Look[] = []
  for (const cima of cimas)
    for (const baixo of baixos)
      for (const calcado of calcados) {
        const partes = [cima, baixo, calcado]
        if (!partes.every((p) => p.estilo === cima.estilo)) continue
        if (partes.filter((p) => !neutra(p)).length > 1) continue
        looks.push({ cima, baixo, calcado, explicacao: explicar(partes) })
      }
  return looks
}

export function idDoLook(l: Look): string {
  return [l.cima.id, l.baixo.id, l.calcado.id].join('+')
}

export function embaralhar<T>(lista: T[]): T[] {
  const r = [...lista]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}
