import { contaSelecionada } from './bancoLocal'
import { chave, cliente, url } from './supabase'
import type { Peca } from './types'

type Linha = {
  id: string
  dados: Omit<Peca, 'id' | 'foto' | 'cadastradaEm'>
  foto_path: string
  cadastrada_em: string
}

const tabela = '/rest/v1/pecas'
const objetos = '/storage/v1/object'
const bucket = 'fotos-pecas'
const cacheFotos = new Map<string, Blob>()
const apagarDepois = new Set<string>()

class ErroHTTP extends Error {
  status: number

  constructor(status: number) {
    super('Falha no acesso às peças (' + status + ').')
    this.status = status
  }
}

async function acesso() {
  const { data, error } = await cliente!.getSession()
  const sessao = data.session
  if (error || !sessao || sessao.user.id !== contaSelecionada()) {
    throw new Error('Entre novamente para acessar suas peças.')
  }
  const userId = sessao.user.id

  async function requisitar(caminho: string, opcoes: RequestInit = {}) {
    const headers = new Headers(opcoes.headers)
    headers.set('apikey', chave)
    headers.set('Authorization', 'Bearer ' + sessao!.access_token)
    const resposta = await fetch(url.replace(/\/$/, '') + caminho, { ...opcoes, headers, cache: 'no-store' })
    if (!resposta.ok) throw new ErroHTTP(resposta.status)
    return resposta
  }

  async function limparFoto(path: string) {
    if (!path.startsWith(userId + '/')) return
    try {
      await requisitar(objetos + '/' + bucket, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefixes: [path] }),
      })
      cacheFotos.delete(path)
      apagarDepois.delete(path)
    } catch {
      apagarDepois.add(path)
    }
  }

  return { userId, requisitar, limparFoto }
}

function caminhoFoto(path: string, dono: string) {
  const partes = path.split('/')
  if (partes[0] !== dono || partes.some((p) => !p || p === '.' || p === '..')) throw new Error('Caminho da foto inválido.')
  return partes.map(encodeURIComponent).join('/')
}

export async function listarNuvem(): Promise<Peca[]> {
  const { userId, requisitar, limparFoto } = await acesso()
  const pecas: Peca[] = []
  const vistos = new Set<string>()
  let depois = ''
  for (;;) {
    const params = new URLSearchParams({
      select: 'id,dados,foto_path,cadastrada_em', user_id: 'eq.' + userId, order: 'id.asc', limit: '100',
    })
    if (depois) params.set('id', 'gt.' + depois)
    const linhas: Linha[] = await (await requisitar(tabela + '?' + params)).json()
    if (!linhas.length) break
    for (let i = 0; i < linhas.length; i += 6) {
      const grupo = await Promise.all(linhas.slice(i, i + 6).map(async (linha) => {
        const path = caminhoFoto(linha.foto_path, userId)
        let foto = cacheFotos.get(path)
        if (!foto) {
          foto = await (await requisitar(objetos + '/authenticated/' + bucket + '/' + path)).blob()
          cacheFotos.set(path, foto)
        }
        vistos.add(path)
        return { ...linha.dados, id: linha.id, foto, cadastradaEm: linha.cadastrada_em }
      }))
      pecas.push(...grupo)
    }
    depois = linhas[linhas.length - 1].id
  }
  for (const path of cacheFotos.keys()) if (!vistos.has(path)) cacheFotos.delete(path)
  for (const path of [...apagarDepois]) await limparFoto(path)
  return pecas.sort((a, b) => a.cadastradaEm.localeCompare(b.cadastradaEm))
}

export async function salvarNuvem(peca: Peca, apenasNova = false) {
  const { userId, requisitar, limparFoto } = await acesso()
  const { id, foto, cadastradaEm, ...dados } = peca
  const filtro = new URLSearchParams({ user_id: 'eq.' + userId, id: 'eq.' + id })
  const anteriores: Pick<Linha, 'foto_path'>[] = await (await requisitar(tabela + '?' + filtro + '&select=foto_path')).json()
  const anterior = anteriores[0]?.foto_path
  if (anterior && apenasNova) return false
  // Cada gravação tem sua própria foto. Uma atualização interrompida mantém a versão anterior legível.
  const path = userId + '/' + crypto.randomUUID()
  await requisitar(objetos + '/' + bucket + '/' + path, {
    method: 'POST', body: foto, headers: { 'Content-Type': foto.type || 'application/octet-stream' },
  })

  if (anterior) filtro.set('foto_path', 'eq.' + anterior)
  const linha = { id, user_id: userId, dados, foto_path: path, cadastrada_em: cadastradaEm }
  const destino = anterior ? tabela + '?' + filtro : tabela
  // Uma resposta perdida pode ter sido gravada pelo banco. Nesse caso conserve a foto enviada.
  let gravadas: { id: string }[]
  try {
    gravadas = await (await requisitar(destino + (anterior ? '&' : '?') + 'select=id', {
      method: anterior ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(linha),
    })).json()
  } catch (erro) {
    if (erro instanceof ErroHTTP && erro.status >= 400 && erro.status < 500) {
      await limparFoto(path)
      if (apenasNova && erro.status === 409) return false
    }
    throw erro
  }
  if (!gravadas.length) {
    await limparFoto(path)
    throw new Error('A peça foi alterada em outro aparelho. Atualize o armário.')
  }
  cacheFotos.set(path, foto)
  if (anterior) await limparFoto(anterior)
  return true
}

export async function removerNuvem(id: string) {
  const { userId, requisitar, limparFoto } = await acesso()
  const params = new URLSearchParams({ id: 'eq.' + id, user_id: 'eq.' + userId, select: 'foto_path' })
  const removidas: Pick<Linha, 'foto_path'>[] = await (await requisitar(tabela + '?' + params, {
    method: 'DELETE', headers: { Prefer: 'return=representation' },
  })).json()
  for (const linha of removidas) await limparFoto(linha.foto_path)
}
