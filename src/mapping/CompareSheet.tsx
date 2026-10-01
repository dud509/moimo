/**
 * 매칭 비교 — 두 안(흔한 정도·닮은 모양)을 한 장씩 그림으로 정리한다.
 *
 * 글 없이 그림·자모·파츠 번호만 둔다. 두 장을 나란히 놓고 볼 수 있게
 * 카드는 자모 순서로 늘어놓아, 같은 자모가 두 장에서 같은 자리에 온다.
 * 한 장씩 PNG 로 내려받을 수 있다.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import anchorsJson from '../data/anchors.json'
import { loadParts, type PartsCache } from '../moimo/compose'
import { MAPPINGS, type MappingId, type MapRow } from '../moimo/name'
import { BODY_COLORS, normalizeTable, type AnchorTable } from '../moimo/parts'
import { savePng } from './savePng'
import { baseFor, CROP, jamoLabel, Moimo, MORPH_LOOK, pad } from './shared'

const ORDER = [
  '김', '이', '박',
  ...'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ',
  '',
  ...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ',
]

/** 자모 순서 — 묶음은 첫 자모로, 나머지 줄은 맨 뒤로 */
const rank = (r: MapRow) => (r.jamo ? ORDER.indexOf(r.jamo[0]) : 999)

const LETTER: Record<MappingId, string> = { freq: 'A', shape: 'B' }

function Sheet({ id, cache, table }: { id: MappingId; cache: PartsCache; table: AnchorTable }) {
  const ref = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const mapping = MAPPINGS[id]
  const BASE = baseFor(id)

  const save = async () => {
    if (!ref.current) return
    setBusy(true)
    try { await savePng(ref.current, `모이모 매칭 ${LETTER[id]}안 ${mapping.name}.png`) }
    finally { setBusy(false) }
  }

  return (
    <div className="sheet-wrap">
      <button className="save" onClick={save} disabled={busy}>
        {busy ? '저장 중…' : `${LETTER[id]}안 PNG 로 저장`}
      </button>
      <div className="sheet" ref={ref}>
        <h1><span className="letter">{LETTER[id]}안</span> {mapping.name}</h1>

        <section>
          <h2>몸통 색깔<small>성 중성</small></h2>
          <div className="cards">
            {BODY_COLORS.map((c, i) => (
              <figure key={c.name} className="card">
                <Moimo genes={{ ...BASE, color: i + 1 }} crop={CROP.body} cache={cache} table={table} />
                <figcaption>
                  <b>{c.jamo.replace('ㅣ받침', 'ㅣ+받침').replace('ㅗㅜ', 'ㅗ ㅜ')}</b>
                  <span>{c.name}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {mapping.slots.map((m) => (
          <section key={m.slot}>
            <h2>{m.label}<small>{m.from}</small></h2>
            <div className="cards">
              {[...m.rows].sort((a, b) => rank(a) - rank(b)).map((r) => (
                <figure key={r.part} className="card">
                  <Moimo
                    genes={{ ...BASE, ...(m.slot === 'morph' ? MORPH_LOOK : {}), [m.slot]: r.part }}
                    crop={CROP[m.slot]}
                    cache={cache}
                    table={table}
                  />
                  <figcaption>
                    <b>{jamoLabel(r)}</b>
                    <span>{r.part ? pad(r.part) : '무늬 없음'}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default function CompareSheet() {
  const [cache, setCache] = useState<PartsCache | null>(null)
  const table = useMemo<AnchorTable>(() => normalizeTable(anchorsJson), [])
  useEffect(() => { loadParts().then(setCache) }, [])

  if (!cache) return <div className="booting">파츠를 부르는 중…</div>
  return (
    <main className="compare">
      <Sheet id="freq" cache={cache} table={table} />
      <Sheet id="shape" cache={cache} table={table} />
    </main>
  )
}
