// 임시 — 진갈색을 태닝 키티 색으로 바꿔 보기 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { BODY_COLORS, normalizeTable, type AnchorTable } from '../moimo/parts'
import { genesFromName, type MoimoGenes } from '../moimo/name'

type Cand = { key: string; label: string; hex: string; line: string; idx?: number }
const CANDS: Cand[] = [
  { key: 'now', label: '노랑 지금', hex: '#FFFAE3', line: '#7C684B', idx: 1 },
  { key: 'a', label: 'A 조금 더 노랗게', hex: '#FFFAE3', line: '#7E663F', idx: 1 },
  { key: 'b', label: 'B 머스터드 브라운', hex: '#FFFAE3', line: '#806433', idx: 1 },
  { key: 'c', label: 'C 앰버', hex: '#FFFAE3', line: '#88672F', idx: 1 },
  { key: 'd', label: 'D 올리브 골드', hex: '#FFFAE3', line: '#7A682C', idx: 1 },
]
const OLD = BODY_COLORS[3].hex  // 민트 포인트가 따라가는 값
const LINEUP = ['김하은', '박지우', '최서연', '정하은', '조민준', '이서윤']
const BROWNS = ['박서아', '강지우', '장하린', '한예린', '안소윤', '박도윤']

/** 갈색 한 칸을 잠깐 바꿔 그린다 — 민트의 포인트(옛 갈색)도 같이 따라간다 */
function withColor(c: Cand, draw: () => string) {
  const brown = BODY_COLORS[c.idx ?? 3] as { hex: string; line: string }
  const mint = BODY_COLORS[4] as { point: string }
  const saved = { hex: brown.hex, line: brown.line, point: mint.point }
  brown.hex = c.hex; brown.line = c.line
  if (c.idx === undefined && saved.point.toLowerCase() === OLD.toLowerCase()) mint.point = c.hex
  try { return draw() } finally { brown.hex = saved.hex; brown.line = saved.line; mint.point = saved.point }
}

function Art({ g, c, cache, table }: { g: MoimoGenes; c: Cand; cache: PartsCache; table: AnchorTable }) {
  const src = useMemo(() => moimoDataUri(withColor(c, () => composeMoimo(g, cache, table)).replace(/viewBox="[^"]*"/, 'viewBox="60 50 392 400"')), [g, c, cache, table])
  return <img src={src} alt="" />
}

function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  return (
    <>
      <h1>노랑 — 선 색 후보</h1>
      <p className="hint">줄마다 왼쪽 6명은 여섯 색 나란히(민트는 갈색 포인트도 같이 바뀜), 오른쪽 6명은 갈색 집안끼리</p>
      {CANDS.map((c) => (
        <section key={c.key}>
          <h2><i className="chip" style={{ background: c.hex, borderColor: c.line }} />{c.label} <small>{c.hex} · 선 {c.line}</small></h2>
          <div className="row">
            {[...LINEUP, ...BROWNS].map((n, i) => (
              <figure key={n} className={i === 6 ? 'gap' : ''}><Art g={genesFromName(n)!} c={c} cache={cache} table={table} /><figcaption>{n}</figcaption></figure>
            ))}
          </div>
        </section>
      ))}
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
