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

/**
 * 색마다 하나씩 여섯 명으로 된 라인업을 여러 벌 뽑는다.
 *  - 몸통 모양과 머리장식은 한 줄 안에서 겹치지 않는다
 *  - 셋은 무늬 있게, 셋은 무늬 없게
 */
function lineups(pool: { n: string; g: MoimoGenes }[], count: number, seed: number) {
  let s = seed
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const by: Record<number, { n: string; g: MoimoGenes }[]> = {}
  for (const x of pool) {
    ;(by[x.g.color] ??= []).push(x)
  }
  const out: { n: string; g: MoimoGenes }[][] = []
  const seen = new Set<string>()
  for (let t = 0; out.length < count && t < count * 400; t++) {
    const row: { n: string; g: MoimoGenes }[] = []
    let ok = true
    for (let c = 1; c <= 6 && ok; c++) {
      const list = by[c] ?? []
      const cand = list.filter((x) => !row.some((y) => y.g.body === x.g.body || y.g.hair === x.g.hair))
      if (!cand.length) { ok = false; break }
      row.push(cand[Math.floor(rnd() * cand.length)])
    }
    if (!ok) continue
    if (row.filter((x) => x.g.morph > 0).length !== 3) continue
    const key = row.map((x) => x.n).join()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(row)
  }
  return out
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
  const [view, setView] = useState<'all' | 'lineup'>('lineup')
  const [seed, setSeed] = useState(7)
  const pool = useMemo(() => {
    const more = names(4000).filter((n) => !extra.includes(n))
    return [...extra, ...more].map((n) => ({ n, g: genesFromName(n) })).filter((x): x is { n: string; g: MoimoGenes } => !!x.g)
  }, [extra])
  // 한 줄에 열두 명 — 여섯 명짜리 라인업 둘을 색끼리 나란히 붙인다
  const rows = useMemo(() => {
    const six = lineups(pool, 80, seed)
    const out: { n: string; g: MoimoGenes }[][] = []
    for (let i = 0; i + 1 < six.length && out.length < 30; i += 2) {
      const [a, b] = [six[i], six[i + 1]]
      // 같은 색 둘은 이름이 달라야 하고, 연보라(거의 이씨) 말고는 몸통도 다르게
      if (a.some((x, k) => x.n === b[k].n || (x.g.color !== 6 && x.g.body === b[k].g.body))) { i--; continue }
      out.push(a.flatMap((x, k) => [x, b[k]]))
    }
    return out
  }, [pool, seed])

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(picks)) } catch { /* 못 적어도 고르기는 된다 */ } }, [picks])
  useEffect(() => { try { localStorage.setItem(KEY + ':extra', JSON.stringify(extra)) } catch { /* 위와 같음 */ } }, [extra])

  /** 끌어 놓기 — 고른 칸에서 끌면 옮기고, 목록에서 끌면 그 칸에 넣는다 */
  const drag = (n: string, from?: GoodsId) => (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ n, from }))
    e.dataTransfer.effectAllowed = 'move'
  }
  const [over, setOver] = useState<GoodsId | null>(null)
  const drop = (to: GoodsId) => (e: React.DragEvent) => {
    e.preventDefault()
    setOver(null)
    try {
      const { n, from } = JSON.parse(e.dataTransfer.getData('text/plain')) as { n: string; from?: GoodsId }
      if (!n || from === to) return
      setPicks((p) => ({
        ...p,
        ...(from ? { [from]: p[from].filter((x) => x !== n) } : {}),
        [to]: p[to].includes(n) ? p[to] : [...p[to], n],
      }))
    } catch { /* 다른 데서 끌어온 것 */ }
  }
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
          <button className={view === 'lineup' ? 'on' : ''} onClick={() => setView('lineup')}>라인업</button>
          <button className={view === 'all' ? 'on' : ''} onClick={() => setView('all')}>모아 보기</button>
          {view === 'lineup' && <button onClick={() => setSeed((x) => x + 1)}>다시 뽑기</button>}
          <label className="only"><input type="checkbox" checked={onlyPicked} onChange={(e) => setOnlyPicked(e.target.checked)} /> 고른 것만</label>
          <form onSubmit={(e) => { e.preventDefault(); addName() }}>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="이름 직접 넣기 (예: 김다영)" />
            <button type="submit">추가</button>
          </form>
        </div>
      </header>

      <section className="summary">
        {GOODS.map((g) => (
          <div
            key={g.id}
            className={`${goods === g.id ? 'now' : ''}${over === g.id ? ' over' : ''}`}
            style={{ '--c': g.color } as React.CSSProperties}
            onDragOver={(e) => { e.preventDefault(); setOver(g.id) }}
            onDragLeave={() => setOver((o) => (o === g.id ? null : o))}
            onDrop={drop(g.id)}
          >
            <div className="sum-head">
              <b onClick={() => setGoods(g.id)}>{g.label} <small>{picks[g.id].length}</small></b>
              {picks[g.id].length > 0 && (
                <button className="mini" onClick={() => { if (confirm(`${g.label}에 고른 ${picks[g.id].length}명을 모두 뺄까요?`)) setPicks((p) => ({ ...p, [g.id]: [] })) }}>모두 빼기</button>
              )}
            </div>
            {picks[g.id].length === 0 ? <span className="empty">아직 없음 · 여기로 끌어다 놓기</span> : (
              <div className="picked-grid">
                {picks[g.id].map((n) => {
                  const pg = genesFromName(n)
                  return (
                    <figure key={n} className="picked" draggable onDragStart={drag(n, g.id)}>
                      {pg && <Art g={pg} cache={cache} table={table} />}
                      <figcaption>{n}</figcaption>
                      <button className="x" title="빼기" onClick={() => setPicks((p) => ({ ...p, [g.id]: p[g.id].filter((x) => x !== n) }))}>×</button>
                    </figure>
                  )
                })}
              </div>
            )}
          </div>
        ))}
        <button onClick={copy}>목록 복사</button>
      </section>

      {view === 'lineup' && (
        <section className="lineups">
          {extra.length > 0 && <>
            <p className="hint">직접 넣은 이름 {extra.length}</p>
            {Array.from({ length: Math.ceil(extra.length / 12) }, (_, r) => extra.slice(r * 12, r * 12 + 12)).map((chunk, r) => (
              <div key={'extra' + r} className="lineup extra">
                <b>+</b>
                {chunk.map((n) => {
                  const g = genesFromName(n)
                  if (!g) return null
                  const tags = GOODS.filter((x) => picks[x.id].includes(n))
                  return (
                    <figure key={n} draggable onDragStart={drag(n)} className={picks[goods].includes(n) ? 'on' : ''} style={{ '--c': GOODS.find((x) => x.id === goods)!.color } as React.CSSProperties} onClick={() => toggle(n)}>
                      <Art g={g} cache={cache} table={table} />
                      <figcaption>{n}</figcaption>
                      <div className="tags">{tags.map((t) => <i key={t.id} style={{ background: t.color }}>{t.label}</i>)}</div>
                      <button className="x" title="직접 넣은 이름에서 지우기" onClick={(e) => { e.stopPropagation(); setExtra((xs) => xs.filter((x) => x !== n)) }}>×</button>
                    </figure>
                  )
                })}
              </div>
            ))}
          </>}
          <p className="hint">색마다 둘씩 · 같은 색 둘은 몸통이 다르게(연보라 빼고) · 무늬 반/없음 반</p>
          {rows.map((row, i) => (
            <div key={i} className="lineup">
              <b>{i + 1}</b>
              {row.map(({ n, g }) => {
                const tags = GOODS.filter((x) => picks[x.id].includes(n))
                return (
                  <figure key={n} draggable onDragStart={drag(n)} className={picks[goods].includes(n) ? 'on' : ''} style={{ '--c': GOODS.find((x) => x.id === goods)!.color } as React.CSSProperties} onClick={() => toggle(n)}>
                    <Art g={g} cache={cache} table={table} />
                    <figcaption>{n}</figcaption>
                    <div className="tags">{tags.map((t) => <i key={t.id} style={{ background: t.color }}>{t.label}</i>)}</div>
                  </figure>
                )
              })}
            </div>
          ))}
        </section>
      )}

      {view === 'all' && <main>
        {list.map(({ n, g }) => {
          const tags = GOODS.filter((x) => picks[x.id].includes(n))
          return (
            <figure key={n} draggable onDragStart={drag(n)} className={picks[goods].includes(n) ? 'on' : ''} style={{ '--c': GOODS.find((x) => x.id === goods)!.color } as React.CSSProperties} onClick={() => toggle(n)}>
              <Art g={g} cache={cache} table={table} />
              <figcaption>{n}</figcaption>
              <div className="tags">
                {tags.map((t) => <i key={t.id} style={{ background: t.color }}>{t.label}</i>)}
              </div>
            </figure>
          )
        })}
      </main>}
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
