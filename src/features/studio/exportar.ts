import type { Camada, Peca } from '../../shared/types'

export const LARGURA = 900
export const ALTURA = 1200

function carregar(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((ok, erro) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => (URL.revokeObjectURL(url), ok(img))
    img.onerror = erro
    img.src = url
  })
}

// Desenha as camadas com a mesma matemática do quadro na tela e devolve um PNG.
export async function exportarPng(fundo: string, camadas: Camada[], pecas: Map<string, Peca>): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = LARGURA
  canvas.height = ALTURA
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = fundo
  ctx.fillRect(0, 0, LARGURA, ALTURA)
  for (const c of camadas) {
    ctx.save()
    ctx.translate(c.x * LARGURA, c.y * ALTURA)
    ctx.rotate((c.rot * Math.PI) / 180)
    if (c.espelho) ctx.scale(-1, 1)
    const peca = c.pecaId ? pecas.get(c.pecaId) : undefined
    if (peca) {
      const img = await carregar(peca.foto)
      const w = c.tam * LARGURA
      const h = (w * img.height) / img.width
      ctx.drawImage(img, -w / 2, -h / 2, w, h)
    } else if (c.texto) {
      ctx.font = `bold ${c.tam * LARGURA}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#111'
      ctx.fillText(c.texto, 0, 0)
    }
    ctx.restore()
  }
  return new Promise((ok, erro) => canvas.toBlob((b) => (b ? ok(b) : erro(new Error('png'))), 'image/png'))
}
