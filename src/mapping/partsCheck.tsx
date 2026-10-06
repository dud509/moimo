// 임시 — 파츠 그림과 매칭표 설명 맞춰 보기 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { normalizeTable, type AnchorTable } from '../moimo/parts'
import { MAPPINGS, type MoimoGenes } from '../moimo/name'

const BASE: MoimoGenes = { body: 10, color: 3, morph: 0, tone: 0, eye: 2, mouth: 9, cheek: 1, hair: 9, tail: 6, deco: 2 }
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
      <h1>{m.label} — 그림과 설명</h1>
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
  const table = useMemo<AnchorTable>(() => normalizeTable(anchorsJson), [])
  useEffect(() => { loadParts().then(setCache) }, [])
  return cache ? <Page cache={cache} table={table} /> : <p>불러오는 중…</p>
}
createRoot(document.getElementById('root')!).render(<App />)
