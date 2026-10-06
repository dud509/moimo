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
const DECO = ['', '01 리본', '02 방울', '03 가방', '04 스카프', '05 반다나', '06 날개']
const SHOW = [4, 5, 1]

function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  return (
    <>
      <h1>몸통 × 몸통장식 — 목 둘레만 크게</h1>
      <p className="hint">파랑 · 무늬 없음 · 눈 02 · 얼굴 아래부터 배까지만 잘라 봄</p>
      <div className="grid" style={{ gridTemplateColumns: '70px repeat(6, 1fr)', maxWidth: 1400 }}>
        <span />
        {BODY.slice(1, 7).map((d, i) => <b key={d}>{String(i + 1).padStart(2, '0')} {d}</b>)}
        {SHOW.map((d) => (
          <>
            <b key={d}>{DECO[d]}</b>
            {BODY.slice(1, 7).map((_, i) => (
              <figure key={`${d}-${i}`}><Art g={{ body: i + 1, color: 1, morph: 0, tone: 0, eye: 2, mouth: 9, cheek: 1, hair: 9, tail: 6, deco: d }} cache={cache} table={table} view="170 270 172 100" /></figure>
            ))}
          </>
        ))}
        <span />
        {BODY.slice(7).map((d, i) => <b key={d}>{String(i + 7).padStart(2, '0')} {d}</b>)}
        {SHOW.map((d) => (
          <>
            <b key={'b' + d}>{DECO[d]}</b>
            {BODY.slice(7).map((_, i) => (
              <figure key={`b${d}-${i}`}><Art g={{ body: i + 7, color: 1, morph: 0, tone: 0, eye: 2, mouth: 9, cheek: 1, hair: 9, tail: 6, deco: d }} cache={cache} table={table} view="170 270 172 100" /></figure>
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
