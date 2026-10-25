import { useEffect, useState } from 'react'

// Aviso rápido de sucesso (momento de recompensa). Mostra `mensagem` por 2,5 s toda vez que `chave` muda.
export default function Aviso({ mensagem, chave }: { mensagem: string; chave: number }) {
  const [visivel, setVisivel] = useState(false)
  useEffect(() => {
    if (!chave) return
    setVisivel(true)
    const t = setTimeout(() => setVisivel(false), 2500)
    return () => clearTimeout(t)
  }, [chave])
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-0 bottom-28 z-30 mx-auto w-fit max-w-[90%] rounded-full bg-fill px-6 py-3 text-sm font-semibold text-on-fill sombra-alta transition-all duration-300 ${visivel ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
    >
      {mensagem}
    </div>
  )
}
