import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Tela from '../../shared/Tela'
import Chips from '../../shared/Chips'
import { CORES, type Cor } from '../../shared/types'

// Dicas gerais de estilo (não substituem a opinião de um barbeiro ou profissional de saúde).

const ROSTOS = {
  oval: {
    barba: 'Quase qualquer comprimento funciona. Mantenha o contorno limpo e o volume uniforme.',
    cabelo: 'É o formato mais versátil: de degradê baixo a topetes e cabelo mais comprido.',
  },
  redondo: {
    barba: 'Deixe mais comprida no queixo e curta nas laterais para alongar o rosto.',
    cabelo: 'Laterais baixas e volume no topo (pompadour, quiff) criam altura.',
  },
  quadrado: {
    barba: 'Barba curta e bem aparada valoriza a mandíbula; evite volume exagerado nas laterais.',
    cabelo: 'Corte curto e texturizado (crew cut, side part) combina com a linha forte do rosto.',
  },
  alongado: {
    barba: 'Barba cheia nas laterais dá largura; evite deixar muito comprida no queixo.',
    cabelo: 'Evite muito volume no topo. Franja ou laterais com mais volume equilibram.',
  },
  'em coração': {
    barba: 'Barba cheia no queixo equilibra a testa mais larga.',
    cabelo: 'Topo mais baixo e franja para os lados suavizam a testa; evite laterais muito curtas.',
  },
} as const

const SUBTONS = {
  quente: {
    sinais: 'Veias esverdeadas, fica bronzeado com facilidade, ouro cai bem.',
    cores: ['marrom', 'bege', 'verde', 'laranja', 'amarelo'] as Cor[],
    evitar: 'Azuis muito frios e cinza muito azulado podem apagar o rosto.',
  },
  frio: {
    sinais: 'Veias azuladas, queima fácil no sol, prata cai bem.',
    cores: ['azul-marinho', 'azul', 'cinza', 'roxo', 'branco'] as Cor[],
    evitar: 'Laranja e amarelo-mostarda tendem a pesar.',
  },
  neutro: {
    sinais: 'Veias de cor mista e boa tolerância a ouro e prata.',
    cores: ['preto', 'branco', 'cinza', 'azul-marinho', 'verde'] as Cor[],
    evitar: 'Quase nada é proibido; prefira o que você mais gosta de vestir.',
  },
} as const

const REGRAS: { id: string; titulo: string; itens: string[] }[] = [
  {
    id: 'acessorios',
    titulo: 'Cinto, sapato e acessórios',
    itens: [
      'Cinto e sapato da mesma cor (preto com preto, marrom com marrom).',
      'Metais parecidos: fivela do cinto e relógio no mesmo tom (prata ou dourado).',
      'Meias na cor da calça ou do sapato disfarçam a transição; meias estampadas, só se for de propósito.',
    ],
  },
  {
    id: 'caimento',
    titulo: 'Caimento',
    itens: [
      'Costura do ombro da camisa no osso do ombro, nem caindo, nem repuxando.',
      'Barra da calça encostando de leve no sapato; sobra demais amontoa.',
      'Manga da camisa termina no pulso, deixando a ponta do punho visível sob a jaqueta.',
    ],
  },
  {
    id: 'estampas',
    titulo: 'Cores e estampas',
    itens: [
      'Use no máximo 3 cores por look; duas neutras e uma de destaque funciona sempre.',
      'Só uma peça estampada por vez, ou estampas de tamanhos bem diferentes.',
      'Jeans escuro e liso é a base mais fácil de combinar em qualquer ocasião.',
    ],
  },
  {
    id: 'cuidados',
    titulo: 'Cuidado com as peças',
    itens: [
      'Lave o jeans do avesso e com pouca frequência para manter a cor.',
      'Pendure as camisas e passe do avesso as peças delicadas.',
      'Limpe e hidrate o couro do sapato; use fôrma ou jornal para manter o formato.',
    ],
  },
]

type Guia = { id: string; titulo: string; resumo: string; emoji: string }

const GUIAS: Guia[] = [
  { id: 'rosto', titulo: 'Barba e cabelo', resumo: 'O corte e a barba certos para o formato do seu rosto', emoji: '💈' },
  { id: 'cores', titulo: 'Cores que favorecem', resumo: 'Descubra seu subtom e as cores que mais combinam com você', emoji: '🎨' },
  { id: 'acessorios', titulo: 'Cinto, sapato e acessórios', resumo: 'O que combinar com o quê, sem errar', emoji: '⌚' },
  { id: 'caimento', titulo: 'Caimento', resumo: 'Como a roupa deve ficar no corpo', emoji: '📐' },
  { id: 'estampas', titulo: 'Cores e estampas', resumo: 'Quantas cores e estampas usar num look', emoji: '👕' },
  { id: 'cuidados', titulo: 'Cuidado com as peças', resumo: 'Lavar, guardar e conservar do jeito certo', emoji: '🧺' },
]

// Lista de guias: cada um abre em uma página própria, já aberto.
export default function Guias() {
  return (
    <Tela titulo="Guias de estilo">
      <ul className="space-y-3">
        {GUIAS.map((g) => (
          <li key={g.id}>
            <Link to={`/guias/${g.id}`} className="flex min-h-20 items-center gap-4 rounded-2xl bg-card p-4 sombra transition active:scale-[0.98]">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-marca-50 text-2xl" aria-hidden>{g.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{g.titulo}</span>
                <span className="block text-sm text-stone-600">{g.resumo}</span>
              </span>
              <span className="text-stone-500" aria-hidden>›</span>
            </Link>
          </li>
        ))}
      </ul>
    </Tela>
  )
}

// Página de um guia, com o conteúdo todo aberto.
export function GuiaPagina() {
  const { id } = useParams()
  const [rosto, setRosto] = useState<(keyof typeof ROSTOS)[]>([])
  const [subtom, setSubtom] = useState<(keyof typeof SUBTONS)[]>([])
  const indice = GUIAS.findIndex((g) => g.id === id)
  if (indice < 0) return <Navigate to="/guias" replace />
  const guia = GUIAS[indice]
  const proximo = GUIAS[(indice + 1) % GUIAS.length]
  const r = rosto[0] ? ROSTOS[rosto[0]] : null
  const s = subtom[0] ? SUBTONS[subtom[0]] : null
  const regras = REGRAS.find((g) => g.id === id)

  return (
    <Tela titulo={guia.titulo}>
      <Link to="/guias" className="mb-4 inline-flex min-h-11 items-center text-sm text-stone-500">← Todos os guias</Link>
      <p className="mb-4 text-sm text-stone-600">{guia.resumo}.</p>

      {id === 'rosto' && (
        <div className="space-y-4 rounded-2xl bg-card p-4 sombra">
          <Chips titulo="Qual é o seu formato de rosto?" opcoes={Object.keys(ROSTOS) as (keyof typeof ROSTOS)[]} valor={rosto} aoMudar={setRosto} />
          {r ? (
            <div className="space-y-3 text-sm text-stone-600">
              <p><span className="font-semibold text-stone-900">Barba: </span>{r.barba}</p>
              <p><span className="font-semibold text-stone-900">Cabelo: </span>{r.cabelo}</p>
            </div>
          ) : (
            <p className="text-sm text-stone-600">Dica: o rosto vai da linha do cabelo até o queixo. Compare a largura da testa, das maçãs e da mandíbula.</p>
          )}
        </div>
      )}

      {id === 'cores' && (
        <div className="space-y-4 rounded-2xl bg-card p-4 sombra">
          <Chips titulo="Qual é o seu subtom?" opcoes={Object.keys(SUBTONS) as (keyof typeof SUBTONS)[]} valor={subtom} aoMudar={setSubtom} />
          {s ? (
            <div className="space-y-3 text-sm text-stone-600">
              <p>{s.sinais}</p>
              <div className="flex flex-wrap gap-2" aria-label="Cores sugeridas">
                {s.cores.map((nome) => (
                  <span key={nome} className="flex items-center gap-2 rounded-full bg-stone-100 py-1 pr-3 pl-2 text-xs capitalize">
                    <span className="size-5 rounded-full ring-1 ring-stone-300" style={{ background: CORES.find((c) => c.nome === nome)?.hex }} />
                    {nome}
                  </span>
                ))}
              </div>
              <p><span className="font-semibold text-stone-900">Atenção: </span>{s.evitar}</p>
            </div>
          ) : (
            <p className="text-sm text-stone-600">Vire o pulso para cima, olhe as veias à luz do dia e escolha o que mais se parece com o seu caso.</p>
          )}
        </div>
      )}

      {regras && (
        <ul className="space-y-3">
          {regras.itens.map((item, n) => (
            <li key={item} className="flex gap-3 rounded-2xl bg-card p-4 text-sm sombra">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-marca-50 text-xs font-semibold text-acento">{n + 1}</span>
              <span className="text-stone-700">{item}</span>
            </li>
          ))}
        </ul>
      )}

      <Link to={`/guias/${proximo.id}`} className="mt-6 flex min-h-14 items-center justify-between rounded-2xl bg-fill px-6 font-semibold text-on-fill sombra-alta">
        <span>Próximo: {proximo.titulo}</span>
        <span aria-hidden>›</span>
      </Link>
    </Tela>
  )
}
