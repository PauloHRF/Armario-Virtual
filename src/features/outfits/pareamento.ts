import { CORES_NEUTRAS, type Categoria, type Peca } from '../../shared/types'

export type Papel = 'cima' | 'baixo' | 'calçado' | 'agasalho' | 'acessório'

export const PAPEIS: { papel: Papel; titulo: string }[] = [
  { papel: 'cima', titulo: 'Parte de cima' },
  { papel: 'baixo', titulo: 'Parte de baixo' },
  { papel: 'calçado', titulo: 'Calçados' },
  { papel: 'agasalho', titulo: 'Agasalhos' },
  { papel: 'acessório', titulo: 'Acessórios' },
]

const PAPEL: Record<Categoria, Papel> = {
  camiseta: 'cima',
  camisa: 'cima',
  calça: 'baixo',
  bermuda: 'baixo',
  jaqueta: 'agasalho',
  calçado: 'calçado',
  acessório: 'acessório',
}

export const papelDe = (p: Peca): Papel => PAPEL[p.categoria]

export type Par = { peca: Peca; pontos: number; motivo: string }

const neutra = (p: Peca) => CORES_NEUTRAS.includes(p.cor)

// Pontua o quanto `outra` combina com `base`. Sem pontos suficientes, não é sugerida.
// Regras: mesmo estilo, cor neutra em pelo menos uma das duas (duas cores fortes brigam),
// e estação/ocasião em comum quando cadastradas.
export function parear(base: Peca, todas: Peca[]): Record<Papel, Par[]> {
  const resultado: Record<Papel, Par[]> = { cima: [], baixo: [], calçado: [], agasalho: [], acessório: [] }
  for (const outra of todas) {
    if (outra.id === base.id || outra.cuidado || papelDe(outra) === papelDe(base)) continue
    const motivos: string[] = []
    let pontos = 0
    if (outra.estilo === base.estilo) {
      pontos += 2
      motivos.push(`estilo ${base.estilo} nas duas`)
    } else {
      pontos -= 2
    }
    if (neutra(outra) && neutra(base)) {
      pontos += 2
      motivos.push('as duas são cores neutras')
    } else if (neutra(outra) || neutra(base)) {
      pontos += 1
      motivos.push(`${neutra(outra) ? outra.cor : base.cor} (neutra) deixa o ${neutra(outra) ? base.cor : outra.cor} aparecer`)
    } else if (outra.cor === base.cor) {
      pontos += 1
      motivos.push(`mesmo tom (${base.cor})`)
    } else {
      pontos -= 3 // duas cores fortes diferentes
    }
    // cinto e sapato da mesma cor é a regra clássica
    const par = [base, outra]
    const cinto = par.find((p) => p.subtipo === 'cinto')
    const sapato = par.find((p) => p.categoria === 'calçado')
    if (cinto && sapato) {
      if (cinto.cor === sapato.cor) {
        pontos += 3
        motivos.push('cinto e sapato da mesma cor')
      } else {
        pontos -= 2
      }
    }
    if (outra.subtipo) motivos.unshift(outra.subtipo)
    const estacaoEmComum = (base.estacoes ?? []).some((e) => outra.estacoes?.includes(e))
    if (estacaoEmComum) {
      pontos += 1
      motivos.push('mesma estação')
    }
    const ocasiaoEmComum = (base.ocasioes ?? []).some((o) => outra.ocasioes?.includes(o))
    if (ocasiaoEmComum) {
      pontos += 1
      motivos.push('mesma ocasião')
    }
    if (pontos >= 2) resultado[papelDe(outra)].push({ peca: outra, pontos, motivo: motivos.join(' · ') })
  }
  for (const k of Object.keys(resultado) as Papel[]) resultado[k].sort((a, b) => b.pontos - a.pontos)
  return resultado
}
