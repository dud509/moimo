// 임시 — 몸통 줄을 같은 초성끼리 맞추면 어떻게 보이는지 비교 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { normalizeTable, type AnchorTable } from '../moimo/parts'
import { genesFromParts, randomKoreanName, splitName, type MoimoGenes, type NameParts } from '../moimo/name'

const BODY = ['', '고양이', '코끼리', '햄스터', '강아지', '사막여우', '원숭이', '토끼', '코알라', '롭이어', '쥐', '고양이2', '롭이어2']
const W: [string[], number][] = [[['현', '혁'], 5], [['영', '연', '원'], 3], [['수', '서'], 7], [['아', '윤'], 9], [['ㅇ'], 10], [['ㅎ'], 11], [['ㅁ', 'ㅂ', 'ㅍ'], 2], [['ㅈ'], 1], [['ㄴ', 'ㄷ', 'ㅌ', 'ㅊ'], 8], [['ㄹ'], 12], [['ㅅ'], 6], [['ㄱ', 'ㅋ'], 4]]
const SCHEMES: [string, string, [string[], number][] | null][] = [
  ['now', '지금', null],
  ['W', '바꾸면', W],
]
const genes = (p: NameParts, rows: [string[], number][] | null): MoimoGenes => {
  const g = genesFromParts(p)
  if (!rows) return g
  const hit = rows.find(([j]) => j.includes(p.n2.char)) ?? rows.find(([j]) => j.includes(p.n2.cho))
  return { ...g, body: hit![1] }
}
const POOL = (() => {
  let s = 2026
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  return Array.from({ length: 40000 }, () => splitName(randomKoreanName(rnd))!).filter(Boolean)
})()

function Art({ g, cache, table }: { g: MoimoGenes; cache: PartsCache; table: AnchorTable }) {
  const src = useMemo(() => moimoDataUri(composeMoimo(g, cache, table).replace(/viewBox="[^"]*"/, 'viewBox="60 50 392 400"')), [g, cache, table])
  return <img loading="lazy" src={src} alt="" />
}

function Table() {
  const cols = SCHEMES.map(([, , swap]) => {
    const c: Record<number, number> = {}
    for (const p of POOL) { const b = genes(p, swap).body; c[b] = (c[b] ?? 0) + 1 }
    return (b: number) => ((c[b] ?? 0) / POOL.length) * 100
  })
  const td = { padding: '2px 10px', textAlign: 'right' } as const
  return (
    <table style={{ fontSize: 12, borderCollapse: 'collapse', marginBottom: 12, background: '#fff' }}>
      <thead><tr><th style={{ padding: 4 }}>몸통 (전체 %)</th>{SCHEMES.map(([id, label]) => <th key={id} style={{ padding: '4px 10px' }}>{label}</th>)}</tr></thead>
      <tbody>{BODY.slice(1).map((n, i) => (
        <tr key={n}><td style={{ padding: '2px 8px' }}>{String(i + 1).padStart(2, '0')} {n}</td>
          {cols.map((f, k) => <td key={k} style={{ ...td, fontWeight: k && f(i + 1).toFixed(1) !== cols[0](i + 1).toFixed(1) ? 700 : 400 }}>{f(i + 1).toFixed(1)}</td>)}
        </tr>
      ))}</tbody>
    </table>
  )
}

const SURS = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오']
const SAMPLE: Record<string, string[]> = {
  '희·혜·한 (ㅎ) 롭이어2 → 고양이2': ['소희', '주희', '지혜', '태한', '소희', '주희', '지혜', '소희', '주희', '지혜', '소희', '주희'],
  '리·름·래 (ㄹ) 코알라 → 롭이어2': ['유리', '아름', '보람', '유리', '아름', '유리', '아름', '보람', '유리', '아름', '유리', '아름'],
  '윤 쥐 → 롭이어': ['서윤', '하윤', '태윤', '도윤', '재윤', '서윤', '하윤', '도윤', '서윤', '하윤', '태윤', '재윤'],
  '철·찬 (ㅊ) 롭이어 → 코알라': ['상철', '영철', '병철', '유찬', '상철', '영철', '병철', '유찬', '상철', '영철', '병철', '유찬'],
}

function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  return (
    <>
      <h1>몸통 줄을 같은 초성끼리 — ㅎ → 고양이2 · ㄹ → 롭이어2 · 아·윤 → 롭이어 · ㅊ → 코알라</h1>
      <p className="hint">이름 4만 개 · 실제 성 비율 기준. 굵은 숫자가 바뀌는 곳</p>
      <Table />
      {Object.keys(SAMPLE).map((ch) => (
        <section key={ch}>
          <h2>{ch}</h2>
          {SCHEMES.map(([id, label, swap]) => (
            <div key={id} className="row">
              <div className="label"><b>{label}</b></div>
              {SAMPLE[ch].map((g, i) => { const p = splitName(SURS[i] + g)!; return <figure key={i}><Art g={genes(p, swap)} cache={cache} table={table} /><figcaption>{p.full}</figcaption></figure> })}
            </div>
          ))}
        </section>
      ))}
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
