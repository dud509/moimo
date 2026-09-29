/**
 * 매칭표 — 자모가 어느 파츠로 가는지 그림으로 본다.
 *
 * name.ts 의 표를 그대로 읽으므로 매칭을 고치면 이 페이지도 따라 바뀐다.
 * 한 자리만 바꾸고 나머지는 가장 흔한 파츠로 채운 모이모를 그려서,
 * 파츠가 몸에 붙었을 때 어떻게 보이는지를 함께 본다.
 */

import { useEffect, useMemo, useState } from 'react'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { MAPPING, type MapRow, type MoimoGenes } from '../moimo/name'
import { BODY_COLORS, normalizeTable, type AnchorTable } from '../moimo/parts'

/** 이 자리에서 가장 흔한 줄의 파츠 */
const commonest = (rows: readonly MapRow[]) =>
  [...rows].filter((r) => r.pct > 0).sort((a, b) => b.pct - a.pct)[0].part

/** 나머지를 채울 바탕 — 자리마다 가장 흔한 파츠. 무늬는 없이 둔다 */
const BASE: MoimoGenes = {
  ...(Object.fromEntries(MAPPING.map((m) => [m.slot, commonest(m.rows)])) as Record<string, number>),
  color: 2,
  morph: 0,
  tone: 0,
} as MoimoGenes

/** 무늬는 노랑 흰 바탕에서 잘 안 보여서, 파랑을 한 톤 눌러 입혀 본다 */
const MORPH_LOOK = { color: 1, tone: 1 }

/** 얼굴·머리에 붙는 작은 파츠는 그 언저리만 크게 잘라 본다 */
const CROP: Partial<Record<string, string>> = {
  eye: '96 140 320 200',
  mouth: '96 140 320 200',
  cheek: '96 140 320 200',
  hair: '76 66 360 250',
  body: '40 50 432 432',
  morph: '40 50 432 432',
  tail: '100 190 340 240',
  deco: '100 190 340 240',
}

const jamoLabel = (r: MapRow) =>
  r.label ?? (r.jamo ?? []).map((j) => (j === '' ? '받침 없음' : j)).join(' ')

const pad = (n: number) => String(n).padStart(2, '0')

function Moimo({ genes, crop, cache, table }: {
  genes: MoimoGenes; crop?: string; cache: PartsCache; table: AnchorTable
}) {
  const uri = useMemo(() => {
    let svg = composeMoimo(genes, cache, table)
    if (crop) svg = svg.replace(/viewBox="[^"]*"/, `viewBox="${crop}"`)
    return moimoDataUri(svg)
  }, [genes, crop, cache, table])
  const [, , w, h] = (crop ?? '0 0 1 1').split(' ').map(Number)
  return <img className="art" style={{ aspectRatio: `${w} / ${h}` }} src={uri} alt="" draggable={false} />
}

export default function MappingSheet() {
  const [cache, setCache] = useState<PartsCache | null>(null)
  const table = useMemo<AnchorTable>(() => normalizeTable(anchorsJson), [])
  useEffect(() => { loadParts().then(setCache) }, [])

  if (!cache) return <div className="booting">파츠를 부르는 중…</div>

  return (
    <main className="sheet">
      <header>
        <h1>모이모 매칭표</h1>
        <p>
          자리마다 <b>흔한 자모 → 드문 자모</b> 순으로 늘어놓았다. 흔한 자모일수록 무난한 파츠,
          드문 자모일수록 튀는 파츠가 간다. 막대는 그 자리에서 그 자모가 나오는 비율이다.
        </p>
      </header>

      <section>
        <h2>몸통 색깔 <small>성 중성</small></h2>
        <div className="cards">
          {BODY_COLORS.map((c, i) => (
            <figure key={c.name} className="card">
              <Moimo genes={{ ...BASE, color: i + 1 }} crop={CROP.body} cache={cache} table={table} />
              <figcaption>
                <span className="jamo">{c.jamo.replace('받침', ' + 받침').replace('ㅗㅜ', 'ㅗ ㅜ')}</span>
                <span className="part"><i style={{ background: c.hex }} />{c.name}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {MAPPING.map((m) => {
        const rows = [...m.rows].sort((a, b) => b.pct - a.pct)
        const max = Math.max(...rows.map((r) => r.pct))
        const crop = CROP[m.slot]
        return (
          <section key={m.slot}>
            <h2>{m.label} <small>{m.from}</small></h2>
            <div className="cards">
              {rows.map((r) => (
                <figure key={r.part} className="card">
                  <Moimo genes={{ ...BASE, ...(m.slot === 'morph' ? MORPH_LOOK : {}), [m.slot]: r.part }} crop={crop} cache={cache} table={table} />
                  <figcaption>
                    <span className="jamo">{jamoLabel(r)}</span>
                    <span className="part">{r.part ? `${m.label} ${pad(r.part)}` : '무늬 없음'}</span>
                    {r.pct > 0 && (
                      <span className="bar"><i style={{ width: `${(r.pct / max) * 100}%` }} /><em>{r.pct}%</em></span>
                    )}
                    {r.note && <span className="note">{r.note}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )
      })}
    </main>
  )
}
