// 임시 — 전시용 이름 고르기 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { BODY_COLORS, normalizeTable, type AnchorTable } from '../moimo/parts'
import { genesFromName, randomKoreanName } from '../moimo/name'

function names(count: number) {
  let s = 2026
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const out = new Set<string>()
  for (let i = 0; out.size < count && i < count * 50; i++) out.add(randomKoreanName(rnd))
  return [...out]
}

function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  const all = useMemo(() => names(400).map((n) => ({ n, g: genesFromName(n)! })), [])
  const [color, setColor] = useState(0)
  const [picked, setPicked] = useState<string[]>([])
  const list = color ? all.filter((x) => x.g.color === color) : all
  const toggle = (n: string) => setPicked((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]))
  return (
    <>
      <header>
        <b>이름 고르기</b>
        <button className={color === 0 ? 'on' : ''} onClick={() => setColor(0)}>전체 {all.length}</button>
        {BODY_COLORS.map((c, i) => (
          <button key={c.name} className={color === i + 1 ? 'on' : ''} onClick={() => setColor(i + 1)}>
            {c.name} {all.filter((x) => x.g.color === i + 1).length}
          </button>
        ))}
        <span className="picked">누르면 골라져요 · 고른 이름: {picked.join(', ') || '없음'}</span>
      </header>
      <main>
        {list.map(({ n, g }) => (
          <figure key={n} className={picked.includes(n) ? 'on' : ''} onClick={() => toggle(n)}>
            <img loading="lazy" src={moimoDataUri(composeMoimo(g, cache, table).replace(/viewBox="[^"]*"/, 'viewBox="60 50 392 400"'))} alt="" />
            <figcaption>{n}</figcaption>
          </figure>
        ))}
      </main>
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
