import type { ComponentType } from 'react'
import Wardrobe from './features/wardrobe/Wardrobe'
import Outfits from './features/outfits/Outfits'
import Studio from './features/studio/Studio'
import Diary from './features/diary/Diary'
import Packing from './features/packing/Packing'
import Shopping from './features/shopping/Shopping'
import Sizes from './features/sizes/Sizes'

export type Feature = {
  id: string
  nome: string
  rota: string
  icone: string
  componente: ComponentType
}

// Para adicionar uma função nova: criar a pasta em features/ e uma linha aqui.
export const features: Feature[] = [
  { id: 'armario', nome: 'Armário', rota: '/armario', icone: '👕', componente: Wardrobe },
  { id: 'combinacoes', nome: 'Looks', rota: '/combinacoes', icone: '✨', componente: Outfits },
  { id: 'montar', nome: 'Montar', rota: '/montar', icone: '🎨', componente: Studio },
  { id: 'diario', nome: 'Diário', rota: '/diario', icone: '📅', componente: Diary },
  { id: 'mala', nome: 'Mala', rota: '/mala', icone: '🧳', componente: Packing },
  { id: 'comprar', nome: 'Comprar', rota: '/comprar', icone: '🛍️', componente: Shopping },
  { id: 'tamanhos', nome: 'Tamanhos', rota: '/tamanhos', icone: '📏', componente: Sizes },
]
