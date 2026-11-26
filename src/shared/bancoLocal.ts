import { createStore, del as apagar, get as ler, set as gravar, update as atualizar, type UseStore } from 'idb-keyval'

// Uma página aberta usa sempre o mesmo banco, inclusive nas gravações assíncronas.
let banco: UseStore | undefined
let dono: string | undefined

export function selecionarConta(id: string) {
  if (dono === id) return
  if (dono !== undefined) throw new Error('Reabra a página para mudar de conta.')
  banco = createStore('armario-conta-' + id, 'dados')
  dono = id
}

export const get = <T = unknown>(chave: IDBValidKey) => ler<T>(chave, banco)
export const set = <T>(chave: IDBValidKey, valor: T) => gravar(chave, valor, banco)
export const del = (chave: IDBValidKey) => apagar(chave, banco)
export const update = <T>(chave: IDBValidKey, alterar: (valor: T | undefined) => T) => atualizar(chave, alterar, banco)
