// 임시 — 강아지(04) 에 하트(03)·클로버(10) 자리 후보 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { normalizeTable, type AnchorTable } from '../moimo/parts'
import type { MoimoGenes } from '../moimo/name'

const CANDS: [string, number, number][] = [
  ['지금', NaN, NaN],
  ['A 머리 안쪽', 12, 22],
  ['B 귀 안쪽 경계 위', 20, 14],
  ['C 귀 위에 완전히', 52, 62],
  ['D 귀 끝 아래', 58, 84],
]

function Art({ g, cache, table }: { g: MoimoGenes; cache: PartsCache; table: AnchorTable }) {
  const src = useMemo(() => moimoDataUri(composeMoimo(g, cache, table).replace(/viewBox="[^"]*"/, 'viewBox="60 30 392 330"')), [g, cache, table])
  return <img src={src} alt="" />
}

function Page({ cache, base }: { cache: PartsCache; base: AnchorTable }) {
  return (
    <>
      <h1>강아지(04) — 머리장식 자리 후보</h1>
      <p className="hint">숫자는 anchors.json 의 b04:hair:NN x / y</p>
      {[3, 10].map((hair) => (
        <section key={hair}>
          <h2>머리장식 {String(hair).padStart(2, '0')} {hair === 3 ? '하트' : '클로버'}</h2>
          <div className="row" style={{ gridTemplateColumns: '150px repeat(5, 1fr)' }}>
            <div className="label"><b>색 파랑 · 분홍</b></div>
            {CANDS.map(([label, x, y]) => {
              const key = `b04:hair:${String(hair).padStart(2, '0')}`
              const cur = base.overrides[key]
              const t = Number.isNaN(x) ? base : { ...base, overrides: { ...base.overrides, [key]: { ...cur, x, y } } }
              const g: MoimoGenes = { body: 4, color: hair === 3 ? 3 : 1, morph: 0, tone: 0, eye: 2, mouth: 9, cheek: 1, hair, tail: 6, deco: 2 }
              return <figure key={label}><Art g={g} cache={cache} table={t} /><figcaption>{label}{Number.isNaN(x) ? ` (${cur.x.toFixed(0)}, ${cur.y.toFixed(0)})` : ` (${x}, ${y})`}</figcaption></figure>
            })}
          </div>
        </section>
      ))}
    </>
  )
}

function App() {
  const [cache, setCache] = useState<PartsCache | null>(null)
  const base = useMemo<AnchorTable>(() => normalizeTable(anchorsJson), [])
  useEffect(() => { loadParts().then(setCache) }, [])
  return cache ? <Page cache={cache} base={base} /> : <p style={{ padding: 16 }}>불러오는 중…</p>
}

createRoot(document.getElementById('root')!).render(<App />)
