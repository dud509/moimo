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
  const COLORS = ['파랑', '노랑', '분홍', '진갈색', '민트', '연보라']
  return (
    <>
      <h1>꼬리 08 — 포인트 색</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {COLORS.map((c) => <b key={c}>{c}</b>)}
        {[1, 2, 3, 4, 5, 6].map((c) => (
          <figure key={c}><Art g={{ body: 10, color: c, morph: 0, tone: 0, eye: 2, mouth: 9, cheek: 1, hair: 9, tail: 8, deco: 2 }} cache={cache} table={table} view="220 230 220 170" /></figure>
        ))}
        {[1, 2, 3, 4, 5, 6].map((c) => (
          <figure key={'m' + c}><Art g={{ body: 3, color: c, morph: 2, tone: 1, eye: 2, mouth: 9, cheek: 1, hair: 9, tail: 8, deco: 2 }} cache={cache} table={table} view="220 230 220 170" /></figure>
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
