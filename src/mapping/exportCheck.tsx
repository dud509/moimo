// 임시 — 화면 그림과 굿즈 SVG 를 나란히 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { normalizeTable, type AnchorTable } from '../moimo/parts'
import { genesFromName } from '../moimo/name'
import { goodsSvg } from '../moimo/exportSvg'

function App() {
  const [cache, setCache] = useState<PartsCache | null>(null)
  const [out, setOut] = useState<Record<string, string>>({})
  const table = useMemo<AnchorTable>(() => normalizeTable(anchorsJson), [])
  const names = (new URLSearchParams(location.search).get('names') ?? '신경민').split(',')
  useEffect(() => { loadParts().then(setCache) }, [])
  useEffect(() => {
    if (!cache) return
    ;(async () => {
      const o: Record<string, string> = {}
      for (const n of names) o[n] = await goodsSvg(genesFromName(n)!, n, cache, table)
      ;(window as unknown as { __goods: Record<string, string> }).__goods = o
      setOut(o)
    })()
  }, [cache])
  if (!cache) return <p>불러오는 중…</p>
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
      {names.flatMap((n) => [
        <figure key={n + 'a'}><img src={moimoDataUri(composeMoimo(genesFromName(n)!, cache, table))} style={{ width: '100%', background: '#fff' }} /><figcaption>{n} 화면</figcaption></figure>,
        <figure key={n + 'b'}>{out[n] && <img src={moimoDataUri(out[n])} style={{ width: '100%', background: '#fff' }} />}<figcaption>{n} 굿즈 SVG</figcaption></figure>,
      ])}
    </div>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
