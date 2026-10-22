import { CORES_NEUTRAS, type Peca } from '../../shared/types'

export type Sugestao = {
  titulo: string
  motivo: string
}

type Regra = {
  // Verdadeiro quando o armário tem essa lacuna.
  falta: (pecas: Peca[]) => boolean
  sugestao: (pecas: Peca[]) => Sugestao
}

const MIN_CAMISETAS_BASICAS = 3

const neutra = (p: Peca) => CORES_NEUTRAS.includes(p.cor)
const camisetasBasicas = (pecas: Peca[]) =>
  pecas.filter((p) => p.categoria === 'camiseta' && neutra(p)).length

// Em ordem de prioridade: as primeiras lacunas aparecem antes.
const regras: Regra[] = [
  {
    falta: (pecas) => !pecas.some((p) => p.categoria === 'calçado'),
    sugestao: () => ({
      titulo: 'Um tênis casual em cor neutra',
      motivo: 'Você ainda não tem nenhum calçado cadastrado, e sem ele nenhum look fica completo.',
    }),
  },
  {
    falta: (pecas) => !pecas.some((p) => p.categoria === 'calça' && neutra(p)),
    sugestao: () => ({
      titulo: 'Uma calça em cor neutra (preta, cinza ou azul-marinho)',
      motivo: 'É a peça de baixo que combina com quase tudo e você não tem nenhuma.',
    }),
  },
  {
    falta: (pecas) => camisetasBasicas(pecas) < MIN_CAMISETAS_BASICAS,
    sugestao: (pecas) => ({
      titulo: 'Mais camisetas básicas lisas (branca, preta ou cinza)',
      motivo: `Você tem ${camisetasBasicas(pecas)} de ${MIN_CAMISETAS_BASICAS} camisetas neutras, que são a base da maioria dos looks.`,
    }),
  },
  {
    falta: (pecas) => !pecas.some((p) => p.categoria === 'calçado' && p.estilo === 'social'),
    sugestao: () => ({
      titulo: 'Um calçado social (sapato ou sapatênis)',
      motivo: 'Sem calçado social você não consegue montar um look social completo.',
    }),
  },
  {
    falta: (pecas) => !pecas.some((p) => p.categoria === 'camisa' && p.estilo === 'social'),
    sugestao: () => ({
      titulo: 'Uma camisa social lisa (branca ou azul)',
      motivo: 'Para entrevistas, eventos e ocasiões em que a camiseta não serve.',
    }),
  },
  {
    falta: (pecas) => !pecas.some((p) => p.categoria === 'jaqueta'),
    sugestao: () => ({
      titulo: 'Uma jaqueta em cor neutra',
      motivo: 'Completa o look nos dias mais frios e combina com qualquer peça básica.',
    }),
  },
  {
    falta: (pecas) => !pecas.some((p) => p.categoria === 'bermuda'),
    sugestao: () => ({
      titulo: 'Uma bermuda em cor neutra',
      motivo: 'Para os dias quentes, já que você só tem opções de calça.',
    }),
  },
]

export function sugerirCompras(pecas: Peca[], max = 3): Sugestao[] {
  return regras
    .filter((r) => r.falta(pecas))
    .slice(0, max)
    .map((r) => r.sugestao(pecas))
}
