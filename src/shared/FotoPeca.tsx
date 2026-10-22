import { useEffect, useMemo } from 'react'

export default function FotoPeca({ foto, className }: { foto: Blob; className?: string }) {
  const url = useMemo(() => URL.createObjectURL(foto), [foto])
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  return <img src={url} alt="" className={className} />
}
