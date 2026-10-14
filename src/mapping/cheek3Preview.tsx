// 임시 — 볼 03 을 «01 + 04» 로 바꾸면 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, innards, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { normalizeTable, type AnchorTable } from '../moimo/parts'
import { genesFromName, type MoimoGenes } from '../moimo/name'

const NAMES = ['정윤지', '이나영', '김동건', '한도현', '진채영', '백지성']

function Art({ g, cache, table }: { g: MoimoGenes; cache: PartsCache; table: AnchorTable }) {
  const src = useMemo(() => moimoDataUri(composeMoimo(g, cache, table).replace(/viewBox="[^"]*"/, 'viewBox="130 180 252 160"')), [g, cache, table])
  return <img loading="lazy" src={src} alt="" style={{ background: '#fff', borderRadius: 10 }} />
}

function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  // 새 볼 03 = 01 그림 위에 04 그림, 자리는 01 과 같게
  const [newCache, newTable] = useMemo(() => {
    const c = new Map(cache)
    const one = cache.get('/parts/cheek/01.svg')!, four = cache.get('/parts/cheek/04.svg')!
    c.set('/parts/cheek/03.svg', one.replace(/<\/svg>\s*$/, innards(four) + '</svg>'))
    const t: AnchorTable = JSON.parse(JSON.stringify(table))
    t.parts.cheek = { ...(t.parts.cheek ?? {}), 3: { ...t.parts.cheek![1] } }
    for (const k of Object.keys(t.cheekEye)) if (k.startsWith('c03:')) delete t.cheekEye[k]
    for (const [k, v] of Object.entries(t.cheekEye)) if (k.startsWith('c01:')) t.cheekEye['c03:' + k.slice(4)] = v
    return [c, t]
  }, [cache, table])
  const cols: [string, number, boolean][] = [['볼 01', 1, false], ['볼 04', 4, false], ['볼 03 지금', 3, false], ['볼 03 새로 (01+04)', 3, true]]
  return (
    <>
      <h1>볼 03 을 01 + 04 로 바꾸면</h1>
      <div className="row" style={{ gridTemplateColumns: '70px repeat(4, 1fr)' }}><div />{cols.map(([l]) => <b key={l} style={{ fontSize: 12, textAlign: 'center' }}>{l}</b>)}</div>
      {NAMES.map((n) => { const g = genesFromName(n)!; return (
        <div key={n} className="row" style={{ gridTemplateColumns: '70px repeat(4, 1fr)' }}>
          <div className="label"><b>{n}</b><small>눈 {String(g.eye).padStart(2, '0')}</small></div>
          {cols.map(([l, cheek, neu]) => <figure key={l}><Art g={{ ...g, cheek }} cache={neu ? newCache : cache} table={neu ? newTable : table} /></figure>)}
        </div>
      ) })}
    </>
  )
}

function App() {
  const [cache, setCache] = useState<PartsCache | null>(null)
  const table = useMemo<AnchorTable>(() => normalizeTable(anchorsJson), [])
  useEffect(() => { loadParts().then(setCache) }, [])
  return cache ? <Page cache={cache} table={table} /> : <p style={{ padding: 16 }}>불러오는 중…</p>
}

createRoot(document.getElementById('root')!).render(<App />)
