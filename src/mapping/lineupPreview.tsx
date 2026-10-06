// 임시 — 인형·키링용 색깔별 라인업 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { normalizeTable, type AnchorTable } from '../moimo/parts'
import { genesFromName, type MoimoGenes } from '../moimo/name'

const G = (body: number, color: number, morph: number, tone: number, eye: number, mouth: number, cheek: number, hair: number, deco: number, tail = 9): MoimoGenes =>
  ({ body, color, morph, tone, eye, mouth, cheek, hair, tail, deco })

// 줄마다 셋은 무늬 있게, 셋은 무늬 없게. 진갈색에는 무늬 01·03·04 를 주지 않는다
// 파랑은 체리, 민트는 민트초코(갈색 포인트 장식), 연보라는 초록 잎 꼭지
const LINEUPS: [string, string, MoimoGenes[]][] = [
  ['A', '인형용 · 단순한 실루엣', [G(5,1,4,0,2,9,1,2,2), G(2,2,0,0,10,9,1,4,1), G(6,3,0,0,2,5,5,1,5), G(11,4,5,1,2,9,1,10,4), G(4,5,0,0,10,9,1,3,1), G(10,6,1,0,2,5,2,5,2)]],
  ['B', '리본·하트', [G(9,1,5,0,10,5,5,2,1), G(7,2,1,0,2,9,1,3,2), G(12,3,0,0,2,9,1,10,4), G(3,4,0,0,10,5,5,1,1), G(6,5,4,0,2,9,1,4,5), G(8,6,0,0,10,9,1,5,1)]],
  ['C', '무늬 포인트', [G(6,1,1,0,10,9,1,2,2), G(4,2,5,0,2,9,1,1,5), G(7,3,4,0,10,5,1,4,1), G(9,4,0,0,2,9,1,10,2), G(3,5,0,0,10,5,5,3,4), G(12,6,0,0,2,9,1,5,5)]],
  ['D', '표정이 다양한', [G(1,1,0,0,3,3,2,2,2), G(5,2,0,0,7,9,1,10,4), G(2,3,4,0,11,6,5,3,1), G(6,4,5,1,9,7,1,1,5), G(12,5,1,0,2,3,1,4,1), G(4,6,0,0,6,9,5,5,1)]],
  ['E', '동글동글', [G(2,1,1,0,10,9,1,2,5), G(6,2,5,0,2,5,5,4,1), G(10,3,0,0,10,9,1,1,2), G(8,4,0,0,10,9,1,10,1), G(12,5,0,0,2,5,1,3,4), G(4,6,4,0,10,6,5,5,2)]],
  ['F', '시크·쿨', [G(3,1,0,0,1,7,2,2,4), G(1,2,4,0,3,9,2,9,3), G(5,3,0,0,9,4,1,11,5), G(7,4,5,0,3,3,1,8,2), G(9,5,1,0,1,7,2,4,4), G(11,6,0,0,9,9,1,5,3)]],
]
const COLORS = ['파랑', '노랑', '분홍', '갈색', '민트', '연보라']

/** 이름으로 고른 줄 — 색은 이름이 정한 그대로 */
const PICKED = ['최하늘', '정수빈', '최유진', '정한결', '황하린']

function Art({ g, cache, table }: { g: MoimoGenes; cache: PartsCache; table: AnchorTable }) {
  const src = useMemo(() => moimoDataUri(composeMoimo(g, cache, table).replace(/viewBox="[^"]*"/, 'viewBox="50 40 412 420"')), [g, cache, table])
  return <img src={src} alt="" />
}

function App() {
  const [cache, setCache] = useState<PartsCache | null>(null)
  const table = useMemo<AnchorTable>(() => normalizeTable(anchorsJson), [])
  useEffect(() => { loadParts().then(setCache) }, [])
  if (!cache) return <p>불러오는 중…</p>
  return (
    <>
      <h1>인형·키링 라인업 — 색깔별 하나씩</h1>
      <div className="grid">
        <span />
        {COLORS.map((c) => <b key={c} className="head">{c}</b>)}
        {LINEUPS.map(([id, label, gs]) => (
          <>
            <b key={id}>{id}<small>{label}</small></b>
            {gs.map((g, i) => <Art key={`${id}${i}`} g={g} cache={cache} table={table} />)}
          </>
        ))}
      </div>
      <h1 style={{ marginTop: 28 }}>고른 이름</h1>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${PICKED.length}, 1fr)` }}>
        {PICKED.map((n) => (
          <figure key={n} style={{ margin: 0, textAlign: 'center', fontWeight: 700, fontSize: 13 }}>
            <Art g={genesFromName(n)!} cache={cache} table={table} />
            <figcaption>{n} <small style={{ display: 'inline' }}>{COLORS[genesFromName(n)!.color - 1]}</small></figcaption>
          </figure>
        ))}
      </div>
    </>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
