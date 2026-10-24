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
}

export type LookMontado = {
  id: string
  nome: string
  fundo: string
  camadas: Camada[] // a ultima fica por cima
  criadoEm: string
}
