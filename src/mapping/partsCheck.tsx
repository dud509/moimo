// 임시 — 파츠 그림과 매칭표 설명 맞춰 보기 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { normalizeTable, type AnchorTable } from '../moimo/parts'
import { MAPPINGS, genesFromName, type MoimoGenes } from '../moimo/name'

const q = new URLSearchParams(location.search)
const NAMED = q.get('name') ? genesFromName(q.get('name')!) : null
const BASE: MoimoGenes = NAMED ?? { body: Number(q.get('body') ?? 10), color: Number(q.get('color') ?? 3), morph: Number(q.get('morph') ?? 0), tone: Number(q.get('tone') ?? 0), eye: Number(q.get('eye') ?? 2), mouth: Number(q.get('mouth') ?? 9), cheek: Number(q.get('cheek') ?? 1), hair: 9, tail: 6, deco: 2 }
const VIEW: Record<string, string> = {
  eye: '150 170 212 130', mouth: '180 220 152 100', cheek: '130 180 252 140',
  hair: '120 40 272 200', body: '40 30 432 440', morph: '40 30 432 440', tail: '40 30 432 440', deco: '40 30 432 440',
}

function Art({ g, view, cache, table }: { g: MoimoGenes; view: string; cache: PartsCache; table: AnchorTable }) {
  const src = useMemo(() => moimoDataUri(composeMoimo(g, cache, table).replace(/viewBox="[^"]*"/, `viewBox="${view}"`)), [g, view, cache, table])
  return <img src={src} alt="" />
}

function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  const slot = new URLSearchParams(location.search).get('slot') ?? 'eye'
  const m = MAPPINGS.shape.slots.find((s) => s.slot === slot)!
  const rows = [...m.rows].sort((a, b) => a.part - b.part)
  return (
    <>
      <h1>{q.get('name') ? `${q.get('name')} — 몸통 12가지` : `${m.label} — 그림과 설명`}</h1>
      <div className="grid">
        {rows.map((r) => (
          <figure key={r.part}>
            <Art g={{ ...BASE, [slot]: r.part, ...(slot === 'morph' ? {} : {}) }} view={VIEW[slot]} cache={cache} table={table} />
            <figcaption><b>{String(r.part).padStart(2, '0')}</b> {r.why ?? r.note}</figcaption>
          </figure>
        ))}
      </div>
    </>
  )
}

function App() {
  const [cache, setCache] = useState<PartsCache | null>(null)
  const table = useMemo<AnchorTable>(() => {
    const t = normalizeTable(anchorsJson)
    // ?wing=크기,위아래,벌림 — 날개(몸통장식 06) 시안
    const w = q.get('wing')?.split(',').map(Number)
    if (w) t.parts.deco = { ...t.parts.deco, 6: { x: 0, y: w[1] ?? 0, s: w[0] ?? 1, r: 0, spread: w[2] ?? 0 } }
    // ?bd=몸통,슬롯,위아래 — 몸통 하나의 슬롯 보정 시안
    const bd = q.get('bd')?.split(',')
    if (bd) t.bodies = { ...t.bodies, [bd[0]]: { ...(t.bodies[bd[0]] ?? {}), [bd[1]]: { x: 0, y: Number(bd[2]), s: 1, r: 0 } } }
    return t
  }, [])
  useEffect(() => { loadParts().then(setCache) }, [])
  return cache ? <Page cache={cache} table={table} /> : <p>불러오는 중…</p>
}
createRoot(document.getElementById('root')!).render(<App />)
