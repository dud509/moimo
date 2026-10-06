// 임시 — 뱅글눈(11)을 다·도로 옮기는 비교 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { normalizeTable, type AnchorTable } from '../moimo/parts'
import { genesFromParts, randomKoreanName, splitName, type MoimoGenes, type NameParts } from '../moimo/name'

const EYE_NAME: Record<number, string> = { 1: '올라간', 2: '조용한', 3: '쏙 혀', 4: '솟은', 5: '길게 그은', 6: '뾰족', 7: '옆 혀', 8: '두꺼운', 9: 'ω' }

/** 바꾼 뒤: ㅗ·ㅠ → 솟은 입(04), ㅛ 만 두꺼운 입(08) */
function after(p: NameParts): MoimoGenes {
  const g = genesFromParts(p)
  if (p.n1.jung === 'ㅛ') return { ...g, mouth: 8 }
  if (p.n1.jung === 'ㅗ' || p.n1.jung === 'ㅠ') return { ...g, mouth: 4 }
  return g
}

function Art({ g, cache, table }: { g: MoimoGenes; cache: PartsCache; table: AnchorTable }) {
  const src = useMemo(() => moimoDataUri(composeMoimo(g, cache, table).replace(/viewBox="[^"]*"/, 'viewBox="110 140 292 230"')), [g, cache, table])
  return <img src={src} alt="" />
}

const SAMPLES = ['김유나', '박윤서', '최용준', '김동현', '윤도윤', '이도현', '김소윤', '김종민', '이보람', '정다은']

function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  const dist = useMemo(() => {
    let s = 13
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    const N = 40000
    const a: Record<number, number> = {}, b: Record<number, number> = {}
    for (let i = 0; i < N; i++) {
      const p = splitName(randomKoreanName(rnd))!
      const x = genesFromParts(p).mouth, y = after(p).mouth
      a[x] = (a[x] ?? 0) + 1; b[y] = (b[y] ?? 0) + 1
    }
    return Array.from({ length: 9 }, (_, i) => i + 1)
      .map((e) => ({ e, a: ((a[e] ?? 0) / N) * 100, b: ((b[e] ?? 0) / N) * 100 }))
      .sort((x, y) => y.b - x.b)
  }, [])
  return (
    <>
      <h1>두꺼운 입(08)은 ㅛ 만, ㅗ·ㅠ 는 솟은 입(04) — 바꾸기 전 / 후</h1>
      <p className="hint">이름 첫 글자 모음 ㅗ(도·소·동·종·보)·ㅠ(유·윤) → 솟은 입 04 · ㅛ(용·효) → 두꺼운 입 08</p>
      <table>
        <thead><tr><th>입</th><th>전</th><th>후</th><th /></tr></thead>
        <tbody>
          {dist.map(({ e, a, b }) => (
            <tr key={e} className={Math.abs(a - b) > 0.5 ? 'chg' : ''}>
              <td>{String(e).padStart(2, '0')} {EYE_NAME[e]}</td><td>{a.toFixed(1)}%</td><td>{b.toFixed(1)}%</td>
              <td><i style={{ width: b * 8 }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid">
        {SAMPLES.map((n) => {
          const p = splitName(n)!
          const g0 = genesFromParts(p), g1 = after(p)
          return (
            <section key={n}>
              <b>{n}</b>
              <div className="pair">
                <figure><Art g={g0} cache={cache} table={table} /><figcaption>전 · {EYE_NAME[g0.mouth]}</figcaption></figure>
                <figure className={g0.mouth !== g1.mouth ? 'chg' : ''}><Art g={g1} cache={cache} table={table} /><figcaption>후 · {EYE_NAME[g1.mouth]}</figcaption></figure>
              </div>
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
  return cache ? <Page cache={cache} table={table} /> : <p>불러오는 중…</p>
}
createRoot(document.getElementById('root')!).render(<App />)
