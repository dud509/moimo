// 임시 — 은·린·아 를 롭이어로 보내면 어떻게 보이는지 비교 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { normalizeTable, type AnchorTable } from '../moimo/parts'
import { genesFromParts, splitName, type MoimoGenes, type NameParts } from '../moimo/name'

const F = `서연 민서 지민 서현 수빈 유진 민지 지원 지현 예린 수민 지은 하은 윤서 채원 예은 소연 지수 다은 은지 혜원 예진 수연 지영 현지 서영 민정 유나 가은 다현 나연 채은 서윤 지아 하윤 수아 예원 은서 승연 혜린 소희 다인 지혜 은비 보람 슬기 아름 미진 은영 수진 혜진 정은 민영 지연 세영 나영 하늘 다솜 예지 소영 유리 윤아 주연 은주 미소 시은 채린 지유 서진 가영 다영 연주 수현 하린 주희`.split(' ')
const M = `민준 지훈 현우 준호 승민 동현 성민 준영 민수 지호 우진 도윤 시우 건우 준서 현준 민재 승현 재원 태윤 진우 은호 지환 성현 상우 정우 민혁 준혁 재민 영훈 형준 대현 동욱 승우 태현 민성 재현 종현 한결 유찬 시원 재훈 용준 진혁 주원 예준 서준 하준 도현 윤호 경민 상현 성훈 정민 태훈 기현 준수 석진 지성 현수 영민 동건 주호 연우 승훈 우현 재윤 민규 성준 지웅`.split(' ')
const S = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍']
const SWAP: Record<string, number> = { 린: 12, 아: 9 }
const NAMES = ['', '고양이', '코끼리', '햄스터', '강아지', '사막여우', '원숭이', '토끼', '코알라', '롭이어', '쥐', '고양이2', '롭이어2']

type Scheme = 'now' | 'new'
const genes = (p: NameParts, s: Scheme): MoimoGenes => {
  const g = genesFromParts(p)
  return s === 'new' && SWAP[p.n2.char] ? { ...g, body: SWAP[p.n2.char] } : g
}
const all = (L: string[]) => S.flatMap((s) => L.map((g) => splitName(s + g)!)).filter(Boolean)

function Art({ g, cache, table }: { g: MoimoGenes; cache: PartsCache; table: AnchorTable }) {
  const src = useMemo(() => moimoDataUri(composeMoimo(g, cache, table).replace(/viewBox="[^"]*"/, 'viewBox="60 50 392 400"')), [g, cache, table])
  return <img loading="lazy" src={src} alt="" />
}

function Table() {
  const rows = (['now', 'new'] as Scheme[]).map((s) => {
    const pct = (L: string[]) => {
      const list = all(L), c: Record<number, number> = {}
      for (const p of list) { const b = genes(p, s).body; c[b] = (c[b] ?? 0) + 1 }
      return (b: number) => Math.round(((c[b] ?? 0) / list.length) * 100)
    }
    return { s, f: pct(F), m: pct(M) }
  })
  return (
    <table style={{ fontSize: 12, borderCollapse: 'collapse', marginBottom: 12, background: '#fff', borderRadius: 10 }}>
      <thead><tr><th style={{ padding: 4 }}>몸통</th>{rows.map((r) => <th key={r.s} colSpan={2} style={{ padding: '4px 10px' }}>{r.s === 'now' ? '지금' : '바꾸면'} (여 / 남 %)</th>)}</tr></thead>
      <tbody>{NAMES.slice(1).map((n, i) => (
        <tr key={n}><td style={{ padding: '2px 8px' }}>{String(i + 1).padStart(2, '0')} {n}</td>
          {rows.map((r) => [<td key={r.s + 'f'} style={{ padding: '2px 10px', textAlign: 'right', fontWeight: r.s === 'new' && r.f(i + 1) !== rows[0].f(i + 1) ? 700 : 400 }}>{r.f(i + 1)}</td>, <td key={r.s + 'm'} style={{ padding: '2px 10px', color: '#8a7a6c' }}>{r.m(i + 1)}</td>])}
        </tr>
      ))}</tbody>
    </table>
  )
}

function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  const pick = (ch: string) => S.map((s, i) => { const gs = F.filter((g) => g[1] === ch); return splitName(s + gs[i % gs.length])! }).slice(0, 12)
  return (
    <>
      <h1>린 → 롭이어2(12) · 아 → 롭이어(09)</h1>
      <p className="hint">여자 이름 75개 × 성 20개 기준. 굵은 숫자가 바뀌는 곳</p>
      <Table />
      {['린', '아'].map((ch) => (
        <section key={ch}>
          <h2>둘째 글자 「{ch}」 — {ch === '린' ? '코알라 → 롭이어2' : '쥐 → 롭이어'}</h2>
          {(['now', 'new'] as Scheme[]).map((s) => (
            <div key={s} className="row">
              <div className="label"><b>{s === 'now' ? '지금' : '바꾸면'}</b></div>
              {pick(ch).map((p) => <figure key={p.full}><Art g={genes(p, s)} cache={cache} table={table} /><figcaption>{p.full}</figcaption></figure>)}
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
