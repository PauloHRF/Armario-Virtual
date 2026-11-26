import { del, get, set, update } from './bancoLocal'
import { useEffect, useState } from 'react'

type Registro<T> = { versao: string; dados: T }

export function useRascunho<T>(chave: 'rascunho-peca' | 'rascunho-look') {
  const [registro, setRegistro] = useState<Registro<T> | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    get<Registro<T>>(chave).then((atual) => {
      if (ativo) setRegistro(atual ?? null)
    }).catch(() => {
      if (ativo) setErro('Não consegui recuperar o rascunho deste aparelho.')
    }).finally(() => {
      if (ativo) setCarregando(false)
    })
    return () => { ativo = false }
  }, [chave])

  async function executar(operacao: Promise<void>) {
    try {
      await operacao
      setErro('')
    } catch {
      setErro('Não consegui atualizar o rascunho neste aparelho.')
    }
  }

  function guardar(dados: T | null) {
    const novo = dados === null ? null : { versao: crypto.randomUUID(), dados }
    setRegistro(novo)
    return executar(novo === null ? del(chave) : set(chave, novo))
  }

  async function concluir() {
    if (!registro) return
    setRegistro((atual) => atual?.versao === registro.versao ? null : atual)
    // Um cadastro concluído em outra aba não deve apagar uma edição mais recente.
    await executar(update<Registro<T> | undefined>(chave, (atual) => atual?.versao === registro.versao ? undefined : atual))
  }

  return { rascunho: registro?.dados ?? null, carregando, erro, guardar, concluir }
}
