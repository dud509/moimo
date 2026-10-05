/**
 * 매칭표 — 자모가 어느 파츠로 가는지 그림으로 본다.
 *
 * name.ts 의 표를 그대로 읽으므로 매칭을 고치면 이 페이지도 따라 바뀐다.
 * 매칭이 두 벌(흔한 정도·닮은 모양)이라 위에서 골라 본다. 주소 뒤에
 * ?map=freq 나 ?map=shape 를 붙여도 된다.
 * 한 자리만 바꾸고 나머지는 가장 흔한 파츠로 채운 모이모를 그려서,
 * 파츠가 몸에 붙었을 때 어떻게 보이는지를 함께 본다.
 */

import { useEffect, useMemo, useState } from 'react'
import anchorsJson from '../data/anchors.json'
import { loadParts, type PartsCache } from '../moimo/compose'
import { ACTIVE_MAPPING, MAPPINGS, type MappingId } from '../moimo/name'
import { BODY_COLORS, normalizeTable, type AnchorTable } from '../moimo/parts'
import { baseFor, CROP, jamoLabel, Moimo, MORPH_LOOK, pad } from './shared'

const initialMap = (): MappingId => {
  const q = new URLSearchParams(location.search).get('map')
  return q === 'freq' || q === 'shape' ? q : ACTIVE_MAPPING
}

export default function MappingSheet() {
  const [cache, setCache] = useState<PartsCache | null>(null)
  const table = useMemo<AnchorTable>(() => normalizeTable(anchorsJson), [])
  const [mapId, setMapId] = useState<MappingId>(initialMap)
  useEffect(() => { loadParts().then(setCache) }, [])

  const choose = (id: MappingId) => {
    setMapId(id)
    history.replaceState(null, '', `?map=${id}`)
  }

  if (!cache) return <div className="booting">파츠를 부르는 중…</div>

  const mapping = MAPPINGS[mapId]
  const BASE = baseFor(mapId)

  return (
    <main className="sheet">
      <header>
        <h1>모이모 매칭표</h1>
        <nav className="tabs">
          {Object.values(MAPPINGS).map((m) => (
            <button key={m.id} className={m.id === mapId ? 'on' : ''} onClick={() => choose(m.id)}>
              {m.name}
              {m.id === ACTIVE_MAPPING && <small>월드에서 쓰는 중</small>}
            </button>
          ))}
        </nav>
        <p>
          <b>{mapping.desc}.</b> 자리마다 흔한 자모부터 늘어놓았고, 막대는 그 자리에서 그 자모가
          나오는 비율이다. 그림은 그 자리만 바꾸고 나머지는 가장 흔한 파츠로 채운 모이모다.
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

      {mapping.slots.map((m) => {
        const rows = [...m.rows].sort((a, b) => b.pct - a.pct)
        const max = Math.max(...rows.map((r) => r.pct))
        const crop = CROP[m.slot]
        return (
          <section key={m.slot}>
            <h2>{m.label} <small>{m.from}</small></h2>
            <div className="cards">
              {rows.map((r, i) => (
                <figure key={`${r.part}-${i}`} className="card">
                  <Moimo genes={{ ...BASE, ...(m.slot === 'morph' ? MORPH_LOOK : {}), [m.slot]: r.part }} crop={crop} cache={cache} table={table} />
                  <figcaption>
                    <span className="jamo">{jamoLabel(r)}</span>
                    <span className="part">{r.part ? `${m.label} ${pad(r.part)}` : '무늬 없음'}</span>
                    {r.pct > 0 && (
                      <span className="bar"><i style={{ width: `${(r.pct / max) * 100}%` }} /><em>{r.pct}%</em></span>
                    )}
                    {r.why && <span className="why">{r.why}</span>}
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
