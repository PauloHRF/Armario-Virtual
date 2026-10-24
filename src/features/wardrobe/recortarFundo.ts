// Recorte de fundo 100% no navegador (@imgly/background-removal, licença AGPL-3.0).
// Na primeira vez baixa o modelo (alguns MB) e o guarda em cache; depois funciona offline.
// Import dinâmico: a biblioteca só entra no carregamento quando alguém pede o recorte.
export async function recortarFundo(foto: Blob, aoProgredir?: (fracao: number) => void): Promise<Blob> {
  const { removeBackground } = await import('@imgly/background-removal')
  return removeBackground(foto, {
    model: 'isnet_quint8', // o menor dos modelos
    output: { format: 'image/png' },
    progress: (_chave, atual, total) => total && aoProgredir?.(atual / total),
  })
}
