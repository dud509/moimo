// 임시 — 굿즈별 이름 고르기 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { BODY_COLORS, normalizeTable, type AnchorTable } from '../moimo/parts'
import { genesFromName, randomKoreanName, type MoimoGenes } from '../moimo/name'
import { goodsSvg } from '../moimo/exportSvg'

// id 는 저장해 둔 고른 목록과 이어지므로 이름이 바뀌어도 그대로 둔다 (name = 코롯토)
const GOODS: readonly { id: 'acrylic' | 'cushion' | 'name' | 'badge'; label: string; color: string; goal?: number }[] = [
  { id: 'acrylic', label: '아크릴 키링', color: '#7aa7d8' },
  { id: 'cushion', label: '쿠션 키링', color: '#e59aae' },
  { id: 'name', label: '코롯토', color: '#9bc48a', goal: 12 },
  { id: 'badge', label: '뱃지', color: '#e2b75a' },
]
type GoodsId = (typeof GOODS)[number]['id']
const countText = (g: (typeof GOODS)[number], n: number) => (g.goal ? `${n}/${g.goal}` : String(n))
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

const COVER: { key: keyof MoimoGenes; label: string; parts: number[] }[] = [
  { key: 'color', label: '색', parts: [1, 2, 3, 4, 5, 6] },
  { key: 'body', label: '몸통', parts: Array.from({ length: 12 }, (_, i) => i + 1) },
  { key: 'morph', label: '무늬', parts: [0, 1, 2, 3, 4, 5] },
  { key: 'eye', label: '눈', parts: Array.from({ length: 11 }, (_, i) => i + 1) },
  { key: 'mouth', label: '입', parts: Array.from({ length: 9 }, (_, i) => i + 1) },
  { key: 'cheek', label: '볼', parts: Array.from({ length: 6 }, (_, i) => i + 1) },
  { key: 'hair', label: '머리장식', parts: Array.from({ length: 11 }, (_, i) => i + 1) },
  { key: 'tail', label: '꼬리', parts: Array.from({ length: 9 }, (_, i) => i + 1) },
  { key: 'deco', label: '몸통장식', parts: Array.from({ length: 6 }, (_, i) => i + 1) },
]

/** 고른 이름 전체(굿즈 구분 없이)에서 아직 안 나온 색·파츠 */
function Coverage({ names: list, pool, onAdd }: {
  names: string[]
  pool: { n: string; g: MoimoGenes }[]
  onAdd: (n: string) => void
}) {
  if (!list.length) return null
  const gs = list.map((n) => genesFromName(n)).filter((g): g is MoimoGenes => !!g)
  // 빠진 칸을 몇 개나 한꺼번에 채우는지 — 많이 채우는 이름부터 권한다
  const missing = COVER.flatMap(({ key, parts }) => parts.filter((p) => !gs.some((g) => g[key] === p)).map((p) => [key, p] as const))
  const fills = (g: MoimoGenes) => missing.filter(([k, p]) => g[k] === p).length
  const suggest = (key: keyof MoimoGenes, p: number) =>
    pool.filter((x) => x.g[key] === p && !list.includes(x.n))
      .sort((a, b) => fills(b.g) - fills(a.g))
      .slice(0, 4)
  return (
    <section className="coverage">
      <b>고른 {gs.length}명에서 빠진 것</b>
      {COVER.map(({ key, label, parts }) => {
        const count = (p: number) => gs.filter((g) => g[key] === p).length
        const miss = parts.filter((p) => !count(p))
        const name = (p: number) => (key === 'color' ? BODY_COLORS[p - 1].name : key === 'morph' && p === 0 ? '없음' : String(p).padStart(2, '0'))
        return (
          <div key={key} className={miss.length ? 'miss' : 'ok'}>
            <span>{label}</span>
            {miss.length ? (
              <em>
                {miss.map((p) => (
                  <span key={p} className="miss-part">
                    {name(p)}
                    {suggest(key, p).map((x) => (
                      <button key={x.n} title={`빠진 칸 ${fills(x.g)}개를 채움`} onClick={() => onAdd(x.n)}>+{x.n}</button>
                    ))}
                  </span>
                ))}
              </em>
            ) : <em>다 있음</em>}
            <small>{parts.map((p) => `${name(p)}×${count(p)}`).join(' ')}</small>
          </div>
        )
      })}
    </section>
  )
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
      // 같은 색 둘은 이름도 몸통도 달라야 한다 — 몸통은 이제 이름 뒤 글자가 정해 색과 묶이지 않는다
      if (a.some((x, k) => x.n === b[k].n || x.g.body === b[k].g.body)) { i--; continue }
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
  const [exporting, setExporting] = useState<string | null>(null)
  /** 고른 이름을 굿즈별 폴더에 SVG 로 — 개발 서버가 goods-export/ 에 바로 쓴다 */
  const exportAll = async () => {
    const jobs = GOODS.flatMap((g) => picks[g.id].map((n) => ({ g, n })))
    let done = 0, failed = 0
    for (const { g, n } of jobs) {
      setExporting(`뽑는 중 ${done + 1}/${jobs.length}`)
      const genes = genesFromName(n)
      try {
        if (!genes) throw new Error(n)
        const svg = await goodsSvg(genes, n, cache, table)
        const r = await fetch('/__goods', { method: 'POST', body: JSON.stringify({ folder: g.label, file: `모이모_${n}`, svg }) })
        if (!r.ok) throw new Error(await r.text())
      } catch { failed++ }
      done++
    }
    setExporting(failed ? `${done - failed}장 저장 · ${failed}장 실패` : `${done}장 저장 완료`)
    setTimeout(() => setExporting(null), 4000)
  }
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
              {g.label} <small>{countText(g, picks[g.id].length)}</small>
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
              <b onClick={() => setGoods(g.id)}>{g.label} <small>{countText(g, picks[g.id].length)}</small></b>
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
        <button onClick={() => { void exportAll() }} disabled={exporting !== null}>
          {exporting ?? 'SVG 뽑기 → goods-export/'}
        </button>
      </section>
      <Coverage
        names={[...pickedAny]}
        pool={pool}
        onAdd={(n) => setPicks((p) => (p[goods].includes(n) ? p : { ...p, [goods]: [...p[goods], n] }))}
      />

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
          <p className="hint">색마다 둘씩 · 같은 색 둘은 몸통이 다르게 · 무늬 반/없음 반</p>
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
