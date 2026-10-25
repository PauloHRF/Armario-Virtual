import type { Estacao, Ocasiao, Perfume } from '../../shared/types'

export const chaveDia = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Estações do hemisfério sul (Brasil).
export function estacaoAtual(d = new Date()): Estacao {
  const m = d.getMonth() + 1
  return m === 12 || m <= 2 ? 'verão' : m <= 5 ? 'outono' : m <= 8 ? 'inverno' : 'primavera'
}

export type Sugestao = { perfume: Perfume; pontos: number; motivos: string[] }

const diasDesde = (dia: string, hoje: Date) => Math.floor((hoje.getTime() - new Date(`${dia}T00:00:00`).getTime()) / 86_400_000)

export const ultimoUso = (p: Perfume) => [...p.usos].sort().at(-1)

// Pontua cada perfume para a estação e a ocasião escolhidas.
// Calor pede perfume mais leve, frio e noite pedem mais intenso, e o que você não usa há dias ganha vez.
export function sugerirPerfumes(perfumes: Perfume[], estacao: Estacao, ocasiao: Ocasiao, hoje = new Date()): Sugestao[] {
  const quente = estacao === 'verão' || estacao === 'primavera'
  return perfumes
    .map((perfume) => {
      const motivos: string[] = []
      let pontos = 0
      const soma = (n: number, m: string) => ((pontos += n), motivos.push(m))
      if (perfume.estacoes.includes(estacao)) soma(2, `bom para ${estacao}`)
      if (perfume.ocasioes.includes(ocasiao)) soma(2, `serve para ${ocasiao}`)
      if (quente && perfume.intensidade === 'suave') soma(1, 'leve para o calor')
      if (!quente && perfume.intensidade === 'forte') soma(1, 'marcante para o frio')
      if (ocasiao === 'festa' && perfume.intensidade !== 'suave') soma(1, 'presença para a noite')
      if ((ocasiao === 'trabalho' || ocasiao === 'academia') && perfume.intensidade !== 'forte') soma(1, 'discreto para o dia')
      if (perfume.favorito) soma(1, 'seu favorito')
      const ultimo = ultimoUso(perfume)
      if (!ultimo) soma(1, 'ainda não usado')
      else if (diasDesde(ultimo, hoje) >= 3) soma(1, 'há dias sem usar')
      else if (diasDesde(ultimo, hoje) === 0) pontos -= 2 // já usou hoje
      return { perfume, pontos, motivos }
    })
    .filter((s) => s.pontos >= 2)
    .sort((a, b) => b.pontos - a.pontos)
}
