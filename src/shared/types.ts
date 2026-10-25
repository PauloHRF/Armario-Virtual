export const CATEGORIAS = ['camiseta', 'camisa', 'calça', 'bermuda', 'jaqueta', 'calçado', 'acessório'] as const
export const ESTILOS = ['casual', 'social', 'esporte'] as const
export const CORES = [
  { nome: 'preto', hex: '#111111' },
  { nome: 'branco', hex: '#ffffff' },
  { nome: 'cinza', hex: '#9ca3af' },
  { nome: 'bege', hex: '#d6c3a1' },
  { nome: 'marrom', hex: '#7c4a2d' },
  { nome: 'azul-marinho', hex: '#1e3a5f' },
  { nome: 'azul', hex: '#2563eb' },
  { nome: 'verde', hex: '#16a34a' },
  { nome: 'vermelho', hex: '#dc2626' },
  { nome: 'amarelo', hex: '#facc15' },
  { nome: 'laranja', hex: '#f97316' },
  { nome: 'rosa', hex: '#ec4899' },
  { nome: 'roxo', hex: '#7c3aed' },
] as const

export const ESTAMPAS = ['lisa', 'listrada', 'xadrez', 'floral', 'poá', 'estampada'] as const
export const MATERIAIS = ['algodão', 'jeans', 'linho', 'lã', 'couro', 'sintético'] as const
export const ESTACOES = ['verão', 'outono', 'inverno', 'primavera'] as const
export const OCASIOES = ['dia a dia', 'trabalho', 'festa', 'academia', 'viagem'] as const

export type Estampa = (typeof ESTAMPAS)[number]
export type Material = (typeof MATERIAIS)[number]
export type Estacao = (typeof ESTACOES)[number]
export type Ocasiao = (typeof OCASIOES)[number]
export type Categoria = (typeof CATEGORIAS)[number]
export type Estilo = (typeof ESTILOS)[number]
export type Cor = (typeof CORES)[number]['nome']

export type Peca = {
  id: string
  foto: Blob
  categoria: Categoria
  cor: Cor
  estilo: Estilo
  marca: string
  tamanho: string
  // Opcionais: peças cadastradas antes destes campos continuam válidas.
  estampa?: Estampa
  material?: Material
  estacoes?: Estacao[]
  ocasioes?: Ocasiao[]
  favorita?: boolean
  preco?: number // valor pago, em reais
  cuidado?: Cuidado // se tem valor, a peça está fora de uso até ficar pronta
  subtipo?: Subtipo // só para acessórios
  cadastradaEm: string // ISO
}

export type Combinacao = {
  id: string
  pecaIds: string[]
  nota?: string
}

export type Medidas = {
  altura?: number
  peso?: number
  peito?: number
  cintura?: number
  quadril?: number
  pe?: number
}

export const CORES_NEUTRAS: readonly Cor[] = ['preto', 'branco', 'cinza', 'bege', 'marrom', 'azul-marinho']

export type TamanhoMarca = {
  id: string
  marca: string
  tamanho: string
}

// Montador de looks: cada camada e uma peca ou um texto sobre o quadro.
// x, y = centro (0..1 do quadro); tam = largura (peca) ou tamanho da fonte (texto), fracao da largura.
export type Camada = {
  id: string
  pecaId?: string
  texto?: string
  x: number
  y: number
  tam: number
  rot: number // graus
  espelho?: boolean
}

export type LookMontado = {
  id: string
  nome: string
  fundo: string
  camadas: Camada[] // a ultima fica por cima
  criadoEm: string
}

export type Viagem = {
  id: string
  nome: string
  dias: number
  estacao?: Estacao
  pecaIds: string[] // peças planejadas para a mala
  empacotadas: string[] // as que já estão na mala
  criadaEm: string
}

export const NOTAS = ['cítrico', 'aromático', 'amadeirado', 'especiado', 'aquático', 'doce', 'couro', 'baunilha'] as const
export const INTENSIDADES = ['suave', 'moderado', 'forte'] as const
export type Nota = (typeof NOTAS)[number]
export type Intensidade = (typeof INTENSIDADES)[number]

export type Perfume = {
  id: string
  nome: string
  marca: string
  foto?: Blob
  notas: Nota[]
  intensidade: Intensidade
  estacoes: Estacao[]
  ocasioes: Ocasiao[]
  favorito: boolean
  usos: string[] // dias (AAAA-MM-DD) em que foi usado
}

export const CUIDADOS_ROUPA = ['lavar', 'passar', 'costurar'] as const
export const CUIDADOS_CALCADO = ['engraxar', 'impermeabilizar', 'sapateiro'] as const
export const SUBTIPOS = ['relógio', 'óculos', 'cinto', 'gravata', 'boné', 'mochila', 'carteira'] as const
export type Cuidado = (typeof CUIDADOS_ROUPA)[number] | (typeof CUIDADOS_CALCADO)[number]
export type Subtipo = (typeof SUBTIPOS)[number]

export const cuidadosDe = (c: Categoria): readonly Cuidado[] => (c === 'calçado' ? CUIDADOS_CALCADO : CUIDADOS_ROUPA)

export type Desejo = {
  id: string
  nome: string
  categoria: Categoria
  cor: Cor
  foto: Blob
  marca: string
  preco?: number
  link?: string
  urgente: boolean // "quero muito": aparece primeiro
  criadoEm: string
}
