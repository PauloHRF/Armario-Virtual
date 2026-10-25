type Props<T extends string> = {
  titulo: string
  opcoes: readonly T[]
  valor: T[] // seleção; no modo único tem 0 ou 1 item
  aoMudar: (v: T[]) => void
  multiplo?: boolean
}

// Chips de seleção (um ou vários), no lugar de selects, como no cadastro do acloset.
export default function Chips<T extends string>({ titulo, opcoes, valor, aoMudar, multiplo }: Props<T>) {
  function alternar(o: T) {
    const marcado = valor.includes(o)
    if (multiplo) aoMudar(marcado ? valor.filter((v) => v !== o) : [...valor, o])
    else aoMudar(marcado ? [] : [o])
  }
  return (
    <div className="text-sm">
      <p className="font-semibold text-stone-600">{titulo}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={valor.includes(o)}
            onClick={() => alternar(o)}
            className={`rounded-full min-h-11 px-4 transition ${valor.includes(o) ? 'bg-fill text-on-fill' : 'bg-card text-stone-600 ring-1 ring-stone-200'}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}
