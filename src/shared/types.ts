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
