import { useEffect, useState } from 'react'

// A URL nasce e morre dentro do effect: o StrictMode (desmonta e remonta em dev) não deixa uma URL já revogada.
export default function FotoPeca({ foto, className }: { foto: Blob; className?: string }) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    const u = URL.createObjectURL(foto)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [foto])
  return <img src={url} alt="" className={className} />
}
