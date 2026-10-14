// 임시 — 볼 ㄴ 나누기 · 꼬리 고르게 나누기 비교 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { normalizeTable, type AnchorTable } from '../moimo/parts'
import { genesFromParts, randomKoreanName, splitName, type MoimoGenes, type NameParts } from '../moimo/name'

type Rows = [string[] | null, number][]
const pick = (rows: Rows, syl: string, j: string) =>
  (rows.find(([r]) => r?.includes(syl)) ?? rows.find(([r]) => r?.includes(j)) ?? rows.find(([r]) => !r))![1]

const CHEEK: Rows = [[[''], 1], [['민', '은'], 4], [['ㄴ'], 2], [['ㅇ'], 5], [['지'], 6], [null, 3]]
const TAIL: Rows = [
  [['현', '혁'], 2], [['준', '훈'], 7], [['진', '민'], 5],
  [['ㅑ', 'ㅕ', 'ㅛ'], 9], [['ㅜ'], 1], [['ㅣ'], 6], [['ㅓ', 'ㅏ'], 4], [['ㅡ', 'ㅗ'], 3], [null, 8],
]
const after = (p: NameParts): MoimoGenes => {
  const g = genesFromParts(p)
  return { ...g, cheek: pick(CHEEK, p.n1.char, p.n1.jong), tail: pick(TAIL, p.n2.char, p.n2.jung) }
}
const POOL = (() => {
  let s = 2026
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  return Array.from({ length: 40000 }, () => splitName(randomKoreanName(rnd))!).filter(Boolean)
})()

function Art({ g, cache, table, view }: { g: MoimoGenes; cache: PartsCache; table: AnchorTable; view: string }) {
  const src = useMemo(() => moimoDataUri(composeMoimo(g, cache, table).replace(/viewBox="[^"]*"/, `viewBox="${view}"`)), [g, cache, table, view])
  return <img loading="lazy" src={src} alt="" />
}

function Dist({ slot, n }: { slot: 'cheek' | 'tail'; n: number }) {
  const count = (f: (p: NameParts) => MoimoGenes) => {
    const c: Record<number, number> = {}
    for (const p of POOL) { const v = f(p)[slot]; c[v] = (c[v] ?? 0) + 1 }
    return (i: number) => ((c[i] ?? 0) / POOL.length) * 100
  }
  const a = count((p) => genesFromParts(p)), b = count(after)
  return (
    <table style={{ fontSize: 12, background: '#fff', marginBottom: 8 }}>
      <thead><tr><th style={{ padding: 4 }}>%</th>{Array.from({ length: n }, (_, i) => <th key={i} style={{ padding: '2px 8px' }}>{String(i + 1).padStart(2, '0')}</th>)}</tr></thead>
      <tbody>
        <tr><td style={{ padding: 4 }}>지금</td>{Array.from({ length: n }, (_, i) => <td key={i} style={{ padding: '2px 8px', textAlign: 'right' }}>{a(i + 1).toFixed(1)}</td>)}</tr>
        <tr><td style={{ padding: 4 }}><b>바꾸면</b></td>{Array.from({ length: n }, (_, i) => <td key={i} style={{ padding: '2px 8px', textAlign: 'right', fontWeight: a(i + 1).toFixed(1) !== b(i + 1).toFixed(1) ? 700 : 400 }}>{b(i + 1).toFixed(1)}</td>)}</tr>
      </tbody>
    </table>
  )
}

const SURS = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오']
const SAMPLES: { title: string; names: string[]; view: string }[] = [
  { title: '볼 — 민·은 → 04 빗금 볼', names: ['민서', '은지', '민준', '은서', '민재', '은비', '민수', '은영', '민지', '은호', '민성', '은주'], view: '60 50 392 400' },
  { title: '꼬리 — 현·혁 → 02', names: ['서현', '지현', '민혁', '도현', '준혁', '수현', '다현', '태현', '진혁', '상현', '기현', '우현'], view: '60 50 392 400' },
  { title: '꼬리 — 준·훈 → 07', names: ['민준', '현준', '지훈', '재훈', '서준', '하준', '영훈', '성훈', '형준', '태훈', '예준', '승훈'], view: '60 50 392 400' },
  { title: '꼬리 — 진·민 → 05 구름', names: ['유진', '우진', '예진', '수진', '승민', '성민', '혜진', '경민', '서진', '정민', '미진', '영민'], view: '60 50 392 400' },
  { title: '꼬리 — ㅏ → 04 방울 · ㅗ → 03 · ㅠㅐㅔ → 08 리본', names: ['지아', '수아', '윤아', '하나', '서아', '다솜', '은주', '윤호', '시우', '지유', '혜규', '나래'], view: '60 50 392 400' },
]

function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  return (
    <>
      <h1>볼 ㄴ 나누기 · 꼬리 고르게</h1>
      <p className="hint">이름 4만 개 · 실제 성 비율 기준. 굵은 숫자가 바뀌는 곳</p>
      <h2>볼</h2><Dist slot="cheek" n={6} />
      <h2>꼬리</h2><Dist slot="tail" n={9} />
      {SAMPLES.map(({ title, names, view }) => (
        <section key={title}>
          <h2>{title}</h2>
          {(['지금', '바꾸면'] as const).map((label) => (
            <div key={label} className="row">
              <div className="label"><b>{label}</b></div>
              {names.map((g, i) => { const p = splitName(SURS[i] + g)!; return <figure key={i}><Art g={label === '지금' ? genesFromParts(p) : after(p)} cache={cache} table={table} view={view} /><figcaption>{p.full}</figcaption></figure> })}
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
