// 임시 — 몸통을 이름 쪽으로 옮기면 어떻게 보이는지 비교 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { BODY_COLORS, normalizeTable, type AnchorTable } from '../moimo/parts'
import { genesFromParts, randomKoreanName, splitName, type MapRow, type MoimoGenes, type NameParts } from '../moimo/name'

const isSyl = (j: string) => j.length === 1 && j >= '가'
function reader(rows: MapRow[]) {
  const syl: Record<string, number> = {}, jam: Record<string, number> = {}
  let rest = -1
  for (const r of rows) {
    if (!r.jamo) rest = r.part
    for (const j of r.jamo ?? []) (isSyl(j) ? syl : jam)[j] = r.part
  }
  return (s: string, j: string) => syl[s] ?? jam[j] ?? (rest >= 0 ? rest : rows[rows.length - 1].part)
}

// 바꾸기 전 — 몸통은 성, 머리장식은 이름 뒤 글자
const OLD_BODY: MapRow[] = [
  { jamo: ['김'], part: 5, pct: 21.4, why: '김의 ㄱ·ㅣ 세로획 둘처럼 나란히 곧게 선 귀' },
  { jamo: ['이'], part: 10, pct: 14.6, why: '이의 ㅇ 처럼 동그란 귀' },
  { jamo: ['박'], part: 7, pct: 8.4, why: '박의 ㅂ 처럼 네모 반듯한 귀' },
  { jamo: ['정'], part: 11, pct: 4.3, why: '정의 ㅈ 두 다리처럼 비스듬히 벌어진 귀' },
  { jamo: ['ㅇ'], part: 6, pct: 10.3, why: 'ㅇ 처럼 동그란 귀가 양옆에' },
  { jamo: ['ㅈ'], part: 1, pct: 7.2, why: 'ㅈ 처럼 획이 갈라져 삐죽삐죽한 털' },
  { jamo: ['ㅅ'], part: 3, pct: 6.8, why: 'ㅅ 처럼 뾰족한 고양이 귀' },
  { jamo: ['ㄱ', 'ㅋ'], part: 4, pct: 6.2, why: 'ㄱ 처럼 꺾여 내려오는 접힌 귀' },
  { jamo: ['ㅊ'], part: 9, pct: 6.2, why: 'ㅊ 의 두 다리처럼 얼굴 양옆으로 길게 내려오는 귀' },
  { jamo: ['ㅎ'], part: 12, pct: 5.7, why: 'ㅎ 의 동그라미처럼 동글게 말린 귀' },
  { jamo: ['ㅁ', 'ㅂ', 'ㅍ'], part: 2, pct: 3.6, why: 'ㅁ·ㅂ·ㅍ 처럼 옆으로 넓게 퍼진 뭉실한 귀' },
  { jamo: ['ㄴ', 'ㄷ', 'ㅌ', 'ㄹ'], part: 8, pct: 2.0, why: 'ㄴ·ㄷ 의 가로획처럼 옆으로 뻗은 귀' },
]
const OLD_HAIR: MapRow[] = [
  { jamo: ['ㅇ'], part: 10, pct: 20.4, why: 'ㅇ 처럼 동글동글한 잎이 모인 네잎클로버' },
  { jamo: ['ㅈ'], part: 9, pct: 15.9, why: 'ㅈ 처럼 꼭지가 뾰족한 고깔' },
  { jamo: ['ㅎ'], part: 6, pct: 13.9, why: 'ㅎ 의 꼭지처럼 위로 돋은 새싹 — 호·훈·혁 처럼 남자 이름에 많다' },
  { jamo: ['ㅅ'], part: 1, pct: 11.7, why: 'ㅅ 처럼 뾰족한 별' },
  { jamo: ['영', '연', '여', '열', '엽'], part: 3, pct: 11.2, why: '영·연 은 흔해서 ㅇ 에서 떼어 날개 달린 하트를 준다' },
  { jamo: ['현'], part: 5, pct: 8.9, why: '현 은 흔해서 ㅎ 에서 떼어 초록 잎 꼭지를 준다' },
  { jamo: ['ㅁ'], part: 11, pct: 5.3, why: 'ㅁ 처럼 네모난 테 둘을 이은 안경' },
  { jamo: ['ㄱ', 'ㅋ'], part: 2, pct: 4.1, why: 'ㄱ 처럼 꺾인 꼭지가 달린 체리' },
  { jamo: ['ㄹ'], part: 4, pct: 4.0, why: 'ㄹ 처럼 고불고불 묶은 작은 리본 한 쌍 — 린·리 처럼 여자 이름에 많다' },
  { jamo: ['ㄴ', 'ㄷ', 'ㅌ', 'ㅂ', 'ㅍ'], part: 7, pct: 2.4, why: '드문 초성은 작은 날개 한 쌍' },
  { jamo: ['ㅊ'], part: 8, pct: 2.3, why: 'ㅊ 의 꼭지처럼 위에 얹은 달걀 프라이 — 철·찬 처럼 남자 이름에 많다' },
]

const OLD = { body: reader(OLD_BODY), hair: reader(OLD_HAIR) }

type Scheme = 'old' | 'now'
function genes(p: NameParts, s: Scheme): MoimoGenes {
  const g = genesFromParts(p)
  if (s === 'old') return { ...g, body: OLD.body(p.surname, p.s.cho), hair: OLD.hair(p.n2.char, p.n2.cho) }
  return g
}

const SCHEMES: [Scheme, string, string][] = [
  ['old', '바꾸기 전', '몸통 = 성 · 머리장식 = 이름 뒤 글자'],
  ['now', '지금 (A2)', '몸통 = 이름 뒤 글자 · 머리장식 = 성'],
]

function pool() {
  let s = 2026
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const out = new Set<string>()
  const raw: string[] = []
  for (let i = 0; i < 20000; i++) { const n = randomKoreanName(rnd); raw.push(n); out.add(n) }
  return raw.map((n) => splitName(n)!).filter(Boolean)
}

function Art({ g, cache, table }: { g: MoimoGenes; cache: PartsCache; table: AnchorTable }) {
  const src = useMemo(() => moimoDataUri(composeMoimo(g, cache, table).replace(/viewBox="[^"]*"/, 'viewBox="60 50 392 400"')), [g, cache, table])
  return <img loading="lazy" src={src} alt="" />
}

function stats(list: NameParts[], s: Scheme, slot: keyof MoimoGenes) {
  const c: Record<number, number> = {}
  for (const p of list) { const v = genes(p, s)[slot]; c[v] = (c[v] ?? 0) + 1 }
  const top = Math.max(...Object.values(c))
  return { kinds: Object.keys(c).length, top: Math.round((top / list.length) * 100) }
}

function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  const all = useMemo(pool, [])
  return (
    <>
      <h1>몸통을 성에서 떼어 내면 — 바꾸기 전 vs 지금</h1>
      <p className="hint">색은 그대로 성 모음에서 · 색마다 같은 이름 12명 · 숫자는 실제 성 비율로 이름 2만 개 기준 그 색에서 나오는 몸통 가짓수 / 가장 흔한 몸통 비율</p>
      {BODY_COLORS.map((c, ci) => {
        const list = all.filter((p) => genes(p, 'now').color === ci + 1)
        const show = [...new Map(list.map((p) => [p.full, p])).values()].slice(0, 12)
        return (
          <section key={c.name}>
            <h2><i className="chip" style={{ background: c.hex }} />{c.name}</h2>
            {SCHEMES.map(([s, label, desc]) => {
              const st = stats(list, s, 'body'), hs = stats(list, s, 'hair')
              return (
                <div key={s} className="row">
                  <div className="label"><b>{label}</b><small>{desc}</small><small>몸통 {st.kinds}가지 · 최다 {st.top}%</small><small>머리장식 {hs.kinds}가지 · 최다 {hs.top}%</small></div>
                  {show.map((p) => (
                    <figure key={p.full}><Art g={genes(p, s)} cache={cache} table={table} /><figcaption>{p.full}</figcaption></figure>
                  ))}
                </div>
              )
            })}
          </section>
        )
      })}
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
