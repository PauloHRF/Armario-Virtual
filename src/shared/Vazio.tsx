import type { ReactNode } from 'react'

// Estado vazio com guia e ação (nunca uma tela em branco com um aviso solto).
export default function Vazio({ emoji, titulo, texto, acao }: { emoji: string; titulo: string; texto: string; acao?: ReactNode }) {
  return (
    <div className="mx-auto mt-8 flex max-w-72 flex-col items-center text-center">
      <span className="grid size-24 place-items-center rounded-full bg-marca-50 text-5xl" aria-hidden>
        {emoji}
      </span>
      <h2 className="mt-6 font-display text-secao font-semibold">{titulo}</h2>
      <p className="mt-2 text-sm text-stone-600">{texto}</p>
      {acao && <div className="mt-6 w-full">{acao}</div>}
    </div>
  )
}
