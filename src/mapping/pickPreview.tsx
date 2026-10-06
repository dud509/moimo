// 임시 — 조건에 맞는 이름 찾아보기 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { normalizeTable, type AnchorTable } from '../moimo/parts'
import type { MoimoGenes } from '../moimo/name'

// 몸통 01 = 뒤 글자 ㅈ(준·진 빼고), 눈 01 = 앞 글자 ㄴ·ㄹ·ㅌ

function Art({ g, cache, table, view = '60 50 392 400' }: { g: MoimoGenes; cache: PartsCache; table: AnchorTable; view?: string }) {
  const src = useMemo(() => moimoDataUri(composeMoimo(g, cache, table).replace(/viewBox="[^"]*"/, `viewBox="${view}"`)), [g, cache, table, view])
  return <img src={src} alt="" />
}


function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  const q = new URLSearchParams(location.search)
  const slot = (q.get('slot') ?? 'hair') as keyof MoimoGenes
  const part = Number(q.get('part') ?? 4)
  const view = q.get('view') ?? '120 120 272 100'
  return (
    <>
      <h1>{slot} {part} — 몸통 12종 크게</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {Array.from({ length: 12 }, (_, i) => (
          <figure key={i}><Art g={{ body: i + 1, color: Number(q.get('color') ?? 1), morph: 0, tone: 0, eye: 2, mouth: 9, cheek: 1, hair: 9, tail: 6, deco: 2, [slot]: part }} cache={cache} table={table} view={view} /><figcaption>몸통 {i + 1}</figcaption></figure>
        ))}
      </div>
    </>
  )
}

function App() {
  const [cache, setCache] = useState<PartsCache | null>(null)
  const table = useMemo<AnchorTable>(() => normalizeTable(anchorsJson), [])
  useEffect(() => { loadParts().then(setCache) }, [])
  return cache ? <Page cache={cache} table={table} /> : <p>불러오는 중…</p>
}
createRoot(document.getElementById('root')!).render(<App />)
