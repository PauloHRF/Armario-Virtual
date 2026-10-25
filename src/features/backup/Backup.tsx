import { useEffect, useState } from 'react'
import { get } from 'idb-keyval'
import Tela from '../../shared/Tela'
import Aviso from '../../shared/Aviso'
import { CHAVES, exportarTudo, importarArquivo, type Resumo } from '../../shared/backup'

const NOMES: Record<string, string> = {
  pecas: 'peças',
  combinacoes: 'combinações salvas',
  medidas: 'medidas',
  tamanhosMarca: 'tamanhos por marca',
  looksMontados: 'looks montados',
  diario: 'dias no diário',
  viagens: 'viagens',
  perfumes: 'perfumes',
  desejos: 'desejos',
}

const quantos = (v: unknown) => (Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : 0)

export default function Backup() {
  const [contagem, setContagem] = useState<Resumo>({})
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const [importado, setImportado] = useState<Resumo | null>(null)
  const [avisos, setAvisos] = useState(0)

  async function contar() {
    const c: Resumo = {}
    for (const chave of CHAVES) c[chave] = quantos(await get(chave))
    setContagem(c)
  }
  useEffect(() => {
    contar()
  }, [])

  async function exportar() {
    setOcupado(true)
    setErro('')
    try {
      const url = URL.createObjectURL(await exportarTudo())
      const a = document.createElement('a')
      a.href = url
      a.download = `armario-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setAvisos((n) => n + 1)
    } catch {
      setErro('Não consegui gerar o backup. Tente de novo.')
    } finally {
      setOcupado(false)
    }
  }

  async function importar(arquivo?: File) {
    if (!arquivo) return
    setOcupado(true)
    setErro('')
    setImportado(null)
    try {
      setImportado(await importarArquivo(await arquivo.text()))
      await contar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui importar esse arquivo.')
    } finally {
      setOcupado(false)
    }
  }

  const total = Object.values(contagem).reduce((a, b) => a + b, 0)
  const entraram = importado ? Object.entries(importado).filter(([, n]) => n > 0) : []

  return (
    <Tela titulo="Backup">
      <p className="mb-4 text-sm text-stone-600">
        Seus dados ficam só neste aparelho. Se você limpar os dados do navegador, tudo some. Exporte um arquivo de vez em quando
        e use a importação para levar o armário para outro aparelho.
      </p>

      <section className="rounded-2xl bg-card p-4 sombra">
        <h2 className="font-display text-secao font-semibold">O que está guardado aqui</h2>
        {total === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Nada ainda.</p>
        ) : (
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {CHAVES.filter((c) => contagem[c]).map((c) => (
              <li key={c} className="flex justify-between">
                <span className="text-stone-600">{NOMES[c]}</span>
                <span className="font-semibold">{contagem[c]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button onClick={exportar} disabled={ocupado || total === 0} className="mt-4 min-h-12 w-full rounded-2xl bg-sky-500 font-semibold text-white sombra-alta disabled:opacity-50">
        Exportar backup
      </button>
      <label className={`mt-3 flex min-h-12 w-full cursor-pointer items-center justify-center rounded-2xl bg-card font-semibold ring-1 ring-stone-200 ${ocupado ? 'opacity-50' : ''}`}>
        Importar backup
        <input
          type="file"
          accept="application/json,.json"
          className="hidden"
          disabled={ocupado}
          onChange={(e) => {
            importar(e.target.files?.[0])
            e.target.value = '' // permite escolher o mesmo arquivo de novo
          }}
        />
      </label>
      <p className="mt-2 text-xs text-stone-500">A importação não apaga nada: entra só o que ainda não existe aqui.</p>

      {erro && <p role="alert" className="mt-4 text-sm text-red-600">{erro}</p>}
      {importado && (
        <div role="status" className="mt-4 rounded-2xl bg-marca-50 p-4 text-sm ring-1 ring-marca-200">
          {entraram.length === 0 ? (
            <p>Nada novo no arquivo: tudo o que ele tem já está aqui.</p>
          ) : (
            <>
              <p className="font-semibold">Importado ✓</p>
              <ul className="mt-1 text-acento">
                {entraram.map(([c, n]) => <li key={c}>+{n} {NOMES[c]}</li>)}
              </ul>
            </>
          )}
        </div>
      )}
      <Aviso mensagem="Backup exportado ✓" chave={avisos} />
    </Tela>
  )
}
