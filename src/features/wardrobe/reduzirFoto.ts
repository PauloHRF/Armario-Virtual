// Reduz a foto para caber bem no IndexedDB (fotos de celular têm vários MB).
export async function reduzirFoto(arquivo: File, ladoMax = 800): Promise<Blob> {
  const img = await createImageBitmap(arquivo)
  const escala = Math.min(1, ladoMax / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * escala)
  canvas.height = Math.round(img.height * escala)
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  img.close()
  return new Promise((ok, erro) =>
    canvas.toBlob((b) => (b ? ok(b) : erro(new Error('Falha ao processar a foto'))), 'image/jpeg', 0.8),
  )
}
