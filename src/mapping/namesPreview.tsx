// 임시 — 굿즈별 이름 고르기 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { BODY_COLORS, normalizeTable, type AnchorTable } from '../moimo/parts'
import { genesFromName, randomKoreanName, type MoimoGenes } from '../moimo/name'

const GOODS = [
  { id: 'acrylic', label: '아크릴 키링', color: '#7aa7d8' },
  { id: 'cushion', label: '쿠션 키링', color: '#e59aae' },
  { id: 'name', label: '이름 키링', color: '#9bc48a' },
  { id: 'badge', label: '뱃지', color: '#e2b75a' },
] as const
type GoodsId = (typeof GOODS)[number]['id']
type Picks = Record<GoodsId, string[]>
const EMPTY: Picks = { acrylic: [], cushion: [], name: [], badge: [] }
const KEY = 'moimo-goods-picks'

function names(count: number) {
  let s = 2026
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const out = new Set<string>()
  for (let i = 0; out.size < count && i < count * 50; i++) out.add(randomKoreanName(rnd))
  return [...out]
}

function loadPicks(): Picks {
  try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return EMPTY }
}

function Art({ g, cache, table }: { g: MoimoGenes; cache: PartsCache; table: AnchorTable }) {
  const src = useMemo(() => moimoDataUri(composeMoimo(g, cache, table).replace(/viewBox="[^"]*"/, 'viewBox="60 50 392 400"')), [g, cache, table])
  return <img loading="lazy" src={src} alt="" />
}

function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  const [extra, setExtra] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY + ':extra') ?? '[]') } catch { return [] }
  })
  const all = useMemo(() => {
    const list = [...extra, ...names(400).filter((n) => !extra.includes(n))]
    return list.map((n) => ({ n, g: genesFromName(n) })).filter((x): x is { n: string; g: MoimoGenes } => !!x.g)
  }, [extra])
  const [color, setColor] = useState(0)
  const [goods, setGoods] = useState<GoodsId>('acrylic')
  const [picks, setPicks] = useState<Picks>(loadPicks)
  const [typed, setTyped] = useState('')
  const [onlyPicked, setOnlyPicked] = useState(false)

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(picks)) } catch { /* 못 적어도 고르기는 된다 */ } }, [picks])
  useEffect(() => { try { localStorage.setItem(KEY + ':extra', JSON.stringify(extra)) } catch { /* 위와 같음 */ } }, [extra])

  const toggle = (n: string) => setPicks((p) => ({
    ...p, [goods]: p[goods].includes(n) ? p[goods].filter((x) => x !== n) : [...p[goods], n],
  }))
  const addName = () => {
    const n = typed.trim()
    if (!n || !genesFromName(n)) return
    setExtra((e) => (e.includes(n) ? e : [n, ...e]))
    setTyped('')
  }
  const pickedAny = new Set(Object.values(picks).flat())
  let list = color ? all.filter((x) => x.g.color === color) : all
  if (onlyPicked) list = list.filter((x) => pickedAny.has(x.n))
  const copy = () => {
    const text = GOODS.map((g) => `${g.label}: ${picks[g.id].join(', ') || '-'}`).join('\n')
    navigator.clipboard?.writeText(text)
  }

  return (
    <>
      <header>
        <div className="row">
          <b>굿즈별 이름 고르기</b>
          {GOODS.map((g) => (
            <button key={g.id} className={`goods${goods === g.id ? ' on' : ''}`} style={{ '--c': g.color } as React.CSSProperties} onClick={() => setGoods(g.id)}>
              {g.label} <small>{picks[g.id].length}</small>
            </button>
          ))}
          <span className="hint">지금 고르는 곳: <b>{GOODS.find((g) => g.id === goods)!.label}</b> · 누르면 넣고 빼요</span>
        </div>
        <div className="row">
          <button className={color === 0 ? 'on' : ''} onClick={() => setColor(0)}>전체</button>
          {BODY_COLORS.map((c, i) => (
            <button key={c.name} className={color === i + 1 ? 'on' : ''} onClick={() => setColor(i + 1)}>
              <i className="chip" style={{ background: c.hex }} />{c.name}
            </button>
          ))}
          <label className="only"><input type="checkbox" checked={onlyPicked} onChange={(e) => setOnlyPicked(e.target.checked)} /> 고른 것만</label>
          <form onSubmit={(e) => { e.preventDefault(); addName() }}>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="이름 직접 넣기 (예: 김다영)" />
            <button type="submit">추가</button>
          </form>
        </div>
      </header>

      <section className="summary">
        {GOODS.map((g) => (
          <div key={g.id} style={{ '--c': g.color } as React.CSSProperties}>
            <b>{g.label}</b>
            <span>{picks[g.id].join(', ') || '아직 없음'}</span>
          </div>
        ))}
        <button onClick={copy}>목록 복사</button>
      </section>

      <main>
        {list.map(({ n, g }) => {
          const tags = GOODS.filter((x) => picks[x.id].includes(n))
          return (
            <figure key={n} className={picks[goods].includes(n) ? 'on' : ''} style={{ '--c': GOODS.find((x) => x.id === goods)!.color } as React.CSSProperties} onClick={() => toggle(n)}>
              <Art g={g} cache={cache} table={table} />
              <figcaption>{n}</figcaption>
              <div className="tags">
                {tags.map((t) => <i key={t.id} style={{ background: t.color }}>{t.label}</i>)}
              </div>
            </figure>
          )
        })}
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
