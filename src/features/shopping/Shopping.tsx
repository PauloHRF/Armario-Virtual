import { useEffect, useState } from 'react'
import Tela from '../../shared/Tela'
import { listarPecas } from '../../shared/storage'
import type { Peca } from '../../shared/types'
import { sugerirCompras } from './lacunas'

export default function Shopping() {
  const [pecas, setPecas] = useState<Peca[]>([])
  const [carregou, setCarregou] = useState(false)

  useEffect(() => {
    listarPecas().then((p) => {
      setPecas(p)
      setCarregou(true)
    })
  }, [])

  const sugestoes = sugerirCompras(pecas)

  return (
    <Tela titulo="O que comprar">
      {carregou && pecas.length === 0 && (
        <p className="text-stone-500">Cadastre suas peças no Armário para ver o que está faltando.</p>
      )}
      {carregou && pecas.length > 0 && sugestoes.length === 0 && (
        <p className="text-stone-500">Seu armário está bem equilibrado. Não encontramos nada essencial faltando.</p>
      )}
      <ol className="space-y-3">
        {sugestoes.map((s, i) => (
          <li key={s.titulo} className="rounded-lg border border-stone-200 bg-white p-3">
            <p className="font-semibold">{i + 1}. {s.titulo}</p>
            <p className="mt-1 text-sm text-stone-500">{s.motivo}</p>
          </li>
        ))}
      </ol>
    </Tela>
  )
}
