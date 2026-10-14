// 임시 — 김다영 에게 눈 11가지를 다 씌워 본다 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { normalizeTable, type AnchorTable } from '../moimo/parts'
import { genesFromName, type MoimoGenes } from '../moimo/name'

const EYE = ['', '뾰족', '꽉 찬', '눈꺼풀', '점', '테두리 속', '속눈썹', '감은', '반짝', '가로획', '속 빈', '뱅글']

function Art({ g, cache, table }: { g: MoimoGenes; cache: PartsCache; table: AnchorTable }) {
  const src = useMemo(() => moimoDataUri(composeMoimo(g, cache, table).replace(/viewBox="[^"]*"/, 'viewBox="60 50 392 400"')), [g, cache, table])
  return <img src={src} alt="" />
}

function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  const name = new URLSearchParams(location.search).get('name') ?? '김다영'
  const g = genesFromName(name)!
  return (
    <>
      <h1>{name} — 눈 11가지 (지금은 눈 {String(g.eye).padStart(2, '0')})</h1>
      <div className="row" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {EYE.slice(1).map((e, i) => (
          <figure key={i} style={{ outline: g.eye === i + 1 ? '3px solid #e59aae' : 'none', borderRadius: 10 }}>
            <Art g={{ ...g, eye: i + 1 }} cache={cache} table={table} /><figcaption>눈 {String(i + 1).padStart(2, '0')} {e}</figcaption>
          </figure>
        ))}
      </div>
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
