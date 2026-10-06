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

const BODY = ['', '고양이', '코끼리', '햄스터', '강아지', '사막여우', '원숭이', '토끼', '코알라', '롭이어', '쥐', '고양이2', '롭이어2']

function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  const q = new URLSearchParams(location.search)
  const color = Number(q.get('color') ?? 4), tone = Number(q.get('tone') ?? 0), deco = Number(q.get('deco') ?? 4)
  return (
    <>
      <h1>몸통 12 × 무늬 6 — 머리·몸 나눈 뒤 (색 {color} · 누름 {tone} · 장식 {deco})</h1>
      <div className="grid" style={{ gridTemplateColumns: '70px repeat(6, 1fr)' }}>
        <span />
        {[0, 1, 2, 3, 4, 5].map((m) => <b key={m}>무늬 {m}</b>)}
        {BODY.slice(1).map((name, i) => (
          <>
            <b key={name}>{String(i + 1).padStart(2, '0')} {name}</b>
            {[0, 1, 2, 3, 4, 5].map((m) => (
              <figure key={`${i}-${m}`}><Art g={{ body: i + 1, color, morph: m, tone, eye: 2, mouth: 9, cheek: 1, hair: 9, tail: 6, deco }} cache={cache} table={table} /></figure>
            ))}
          </>
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
