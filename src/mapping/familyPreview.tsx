// 임시 — 성(집안)마다 색 + 머리장식 짝 보기 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { BODY_COLORS, normalizeTable, type AnchorTable } from '../moimo/parts'
import { genesFromName, randomKoreanName, splitName, type MoimoGenes } from '../moimo/name'

const HAIR_NAME: Record<number, string> = { 1: '별', 2: '체리', 3: '날개 하트', 4: '리본', 5: '초록 잎', 6: '앞머리', 7: '작은 날개', 8: '달걀', 9: '고깔', 10: '클로버', 11: '안경' }
const GIVEN = ['서연', '민준', '지우', '하은', '도윤', '수아']

function families() {
  let s = 11
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const c: Record<string, number> = {}
  const N = 30000
  for (let i = 0; i < N; i++) { const p = splitName(randomKoreanName(rnd))!; c[p.surname] = (c[p.surname] ?? 0) + 1 }
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 24).map(([sur, n]) => ({ sur, pct: (n / N) * 100 }))
}

function Art({ g, cache, table }: { g: MoimoGenes; cache: PartsCache; table: AnchorTable }) {
  const src = useMemo(() => moimoDataUri(composeMoimo(g, cache, table).replace(/viewBox="[^"]*"/, 'viewBox="60 50 392 400"')), [g, cache, table])
  return <img loading="lazy" src={src} alt="" />
}

function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  const fams = useMemo(families, [])
  return (
    <>
      <h1>김씨(파랑) — 지금 별 vs 앞머리(06)</h1>
      <p className="hint">앞머리로 하면 ㅎ 성(한·황·홍…)이 별을 받는다 · 아래 줄은 비교용 초록 잎 꼭지(05, 이씨)</p>
      <div className="fams">
        {[[1, '지금 · 별'], [6, '앞머리 (06)']].map(([h, label]) => (
          <section key={h}>
            <h2><b>김</b><i className="chip" style={{ background: BODY_COLORS[0].hex }} />파랑 · {label}<small>23.4%</small></h2>
            <div className="row">{GIVEN.map((n, i) => <Art key={i} g={{ ...genesFromName('김' + n)!, hair: h as number }} cache={cache} table={table} />)}</div>
          </section>
        ))}
        <section>
          <h2><b>김</b><i className="chip" style={{ background: BODY_COLORS[0].hex }} />파랑 · 초록 잎 꼭지 (05) — 참고<small /></h2>
          <div className="row">{GIVEN.map((n, i) => <Art key={i} g={{ ...genesFromName('김' + n)!, hair: 5 }} cache={cache} table={table} />)}</div>
        </section>
      </div>
      <h1 style={{ marginTop: 20 }}>지금 집안마다 색 + 머리장식</h1>
      <p className="hint">성이 많은 순서 24개 (전체의 약 {Math.round(fams.reduce((a, f) => a + f.pct, 0))}%) · 이름은 서연·민준·지우·하은·도윤·수아로 같게</p>
      <div className="fams">
        {fams.map(({ sur, pct }) => {
          const gs = GIVEN.map((g) => genesFromName(sur + g)!)
          const c = BODY_COLORS[gs[0].color - 1]
          return (
            <section key={sur}>
              <h2><b>{sur}</b><i className="chip" style={{ background: c.hex }} />{c.name} · {HAIR_NAME[gs[0].hair]}<small>{pct.toFixed(1)}%</small></h2>
              <div className="row">{gs.map((g, i) => <Art key={i} g={g} cache={cache} table={table} />)}</div>
            </section>
          )
        })}
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
