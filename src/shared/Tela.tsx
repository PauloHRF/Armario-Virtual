import type { ReactNode } from 'react'

export default function Tela({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h1 className="mb-4 text-xl font-bold">{titulo}</h1>
      {children}
    </section>
  )
}
