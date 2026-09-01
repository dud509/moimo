import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BODY_COLORS, BODY_COUNT, CANVAS, DEFAULT_ANCHOR, LINE_COLOR, PATTERN_COUNT, SLOTS,
  Z_BODY, Z_PATTERN, anchorOf, bodyUrl, partUrl, patternUrls, recolor,
  type Anchor, type AnchorTable, type SlotKey,
} from '../moimo/parts'
import { useSvg } from './useSvg'
import initial from '../data/anchors.json'

const DISP = 0.86 // 화면에 512 캔버스를 얼마로 줄여 보여줄지

/* ---------------- 한 겹 ---------------- */

function Layer({
  urls, fill, line, anchor, z, dim, label,
}: {
  urls: string | string[]
  fill: string
  line: string
  anchor: Anchor
  z: number
  dim: boolean
  label: string
}) {
  const { svg, missing } = useSvg(urls)
  const html = useMemo(() => (svg ? recolor(svg, fill, line) : ''), [svg, fill, line])

  const style: React.CSSProperties = {
    zIndex: z,
    opacity: dim ? 0.28 : 1,
    transform: `translate(${anchor.x}px, ${anchor.y}px) rotate(${anchor.r}deg) scale(${anchor.s})`,
  }

  if (missing) {
    return (
      <div className="layer missing" style={style}>
        <span>{label} 없음</span>
      </div>
    )
  }
  return <div className="layer" style={style} dangerouslySetInnerHTML={{ __html: html }} />
}

/* ---------------- 편집기 ---------------- */

export default function AnchorEditor() {
  const [table, setTable] = useState<AnchorTable>(() => JSON.parse(JSON.stringify(initial)))
  const [body, setBody] = useState(1)
  const [sel, setSel] = useState<SlotKey | null>('eye')
  const [colorIdx, setColorIdx] = useState(1)
  const [variant, setVariant] = useState<Record<string, number>>(
    () => Object.fromEntries(SLOTS.map((s) => [s.key, 1])),
  )
  const [pattern, setPattern] = useState(0) // 0 = 무늬 없음
  const [solo, setSolo] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)

  const stageRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number } | null>(null)

  const color = BODY_COLORS[colorIdx]
  const onDark = colorIdx === 3 || colorIdx === 5
  const lineColor = onDark ? '#FFFFFF' : LINE_COLOR

  /* --- 앵커 수정 --- */

  const patch = useCallback((slot: SlotKey, d: Partial<Anchor>) => {
    setTable((t) => {
      const key = String(body)
      const cur = t[key]?.[slot] ?? DEFAULT_ANCHOR
      return { ...t, [key]: { ...t[key], [slot]: { ...cur, ...d } } }
    })
    setDirty(true)
  }, [body])

  const reset = (slot: SlotKey) => patch(slot, DEFAULT_ANCHOR)

  const copyFrom = (from: number) => {
    setTable((t) => ({ ...t, [String(body)]: JSON.parse(JSON.stringify(t[String(from)] ?? {})) }))
    setDirty(true)
  }

  /* --- 드래그 / 휠 / 키보드 --- */

  const onPointerDown = (e: React.PointerEvent) => {
    if (!sel) return
    dragRef.current = { x: e.clientX, y: e.clientY }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d || !sel) return
    const a = anchorOf(table, body, sel)
    patch(sel, { x: a.x + (e.clientX - d.x) / DISP, y: a.y + (e.clientY - d.y) / DISP })
    dragRef.current = { x: e.clientX, y: e.clientY }
  }

  const onPointerUp = () => { dragRef.current = null }

  const onWheel = (e: React.WheelEvent) => {
    if (!sel) return
    e.preventDefault()
    const a = anchorOf(table, body, sel)
    patch(sel, { s: Math.max(0.1, Math.min(4, a.s * Math.exp(-e.deltaY * 0.0012))) })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!sel) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT') return
      const a = anchorOf(table, body, sel)
      const step = e.shiftKey ? 10 : 1
      const moves: Record<string, () => void> = {
        ArrowLeft: () => patch(sel, { x: a.x - step }),
        ArrowRight: () => patch(sel, { x: a.x + step }),
        ArrowUp: () => patch(sel, { y: a.y - step }),
        ArrowDown: () => patch(sel, { y: a.y + step }),
        '[': () => patch(sel, { r: a.r - step }),
        ']': () => patch(sel, { r: a.r + step }),
      }
      const fn = moves[e.key]
      if (fn) { e.preventDefault(); fn() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sel, table, body, patch])

  /* --- 저장 --- */

  const save = async () => {
    try {
      const res = await fetch('/__anchors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(table, null, 2),
      })
      if (!res.ok) throw new Error(String(res.status))
      setDirty(false)
      setSaved('src/data/anchors.json 에 저장했어요')
    } catch {
      // dev 서버가 아니면 파일로 내려받게 한다
      const blob = new Blob([JSON.stringify(table, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'anchors.json'
      a.click()
      URL.revokeObjectURL(a.href)
      setSaved('개발 서버가 아니라서 파일로 내려받았어요')
    }
    window.setTimeout(() => setSaved(null), 3000)
  }

  const doneCount = Object.values(table).filter((b) => Object.keys(b ?? {}).length).length

  /* --- 그리기 --- */

  return (
    <div className="anchor-app">
      {/* 왼쪽: 몸통 */}
      <aside className="col bodies">
        <h1>앵커 편집기</h1>
        <p className="sub">몸통 {doneCount}/{BODY_COUNT} 잡음</p>
        <div className="body-list">
          {Array.from({ length: BODY_COUNT }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={`body-btn${n === body ? ' on' : ''}${Object.keys(table[String(n)] ?? {}).length ? ' done' : ''}`}
              onClick={() => setBody(n)}
            >
              <BodyThumb n={n} />
              <span>{String(n).padStart(2, '0')}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* 가운데: 무대 */}
      <main className="col stage-col">
        <div className="stage-tools">
          <div className="swatches">
            {BODY_COLORS.map((c, i) => (
              <button
                key={c.name}
                className={`sw${i === colorIdx ? ' on' : ''}`}
                style={{ background: c.hex }}
                onClick={() => setColorIdx(i)}
                title={`${c.name} ${c.hex}`}
              />
            ))}
          </div>
          <label className="toggle">
            <input type="checkbox" checked={solo} onChange={(e) => setSolo(e.target.checked)} />
            선택만 진하게
          </label>
          <label className="toggle">
            무늬
            <select value={pattern} onChange={(e) => setPattern(Number(e.target.value))}>
              <option value={0}>없음</option>
              {Array.from({ length: PATTERN_COUNT }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{String(n).padStart(2, '0')}</option>
              ))}
            </select>
          </label>
        </div>

        <div
          className="stage"
          ref={stageRef}
          style={{ width: CANVAS * DISP, height: CANVAS * DISP }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          <div className="canvas" style={{ width: CANVAS, height: CANVAS, transform: `scale(${DISP})` }}>
            <div className="guides">
              <i className="gv" /><i className="gh" />
            </div>

            <Layer
              urls={bodyUrl(body)} fill={color.hex} line={lineColor}
              anchor={DEFAULT_ANCHOR} z={Z_BODY} dim={solo && sel !== null} label={`몸통 ${body}`}
            />
            {pattern > 0 && (
              <Layer
                urls={patternUrls(body, pattern)} fill={color.hex} line={lineColor}
                anchor={DEFAULT_ANCHOR} z={Z_PATTERN} dim={solo && sel !== null} label="무늬"
              />
            )}
            {SLOTS.map((s) => (
              <Layer
                key={s.key}
                urls={partUrl(s.key, variant[s.key])}
                fill="#FFFFFF"
                line={lineColor}
                anchor={anchorOf(table, body, s.key)}
                z={s.z}
                dim={solo && sel !== null && sel !== s.key}
                label={s.label}
              />
            ))}
            {sel && (
              <div
                className="sel-box"
                style={{
                  transform: `translate(${anchorOf(table, body, sel).x}px, ${anchorOf(table, body, sel).y}px) rotate(${anchorOf(table, body, sel).r}deg) scale(${anchorOf(table, body, sel).s})`,
                }}
              />
            )}
          </div>
        </div>

        <p className="hint">
          무대에서 <b>드래그</b>로 이동 · <b>휠</b>로 크기 · <b>←↑↓→</b> 1px(Shift 10px) · <b>[ ]</b> 회전
        </p>
      </main>

      {/* 오른쪽: 슬롯 */}
      <aside className="col slots">
        <div className="slot-head">
          <select onChange={(e) => { const v = Number(e.target.value); if (v) copyFrom(v) }} value={0}>
            <option value={0}>다른 몸통에서 복사…</option>
            {Array.from({ length: BODY_COUNT }, (_, i) => i + 1)
              .filter((n) => n !== body && Object.keys(table[String(n)] ?? {}).length)
              .map((n) => <option key={n} value={n}>몸통 {String(n).padStart(2, '0')}</option>)}
          </select>
        </div>

        {SLOTS.map((s) => {
          const a = anchorOf(table, body, s.key)
          const on = sel === s.key
          return (
            <div key={s.key} className={`slot${on ? ' on' : ''}`} onClick={() => setSel(s.key)}>
              <div className="slot-top">
                <b>{s.label}</b>
                <div className="variant">
                  <button onClick={(e) => { e.stopPropagation(); setVariant((v) => ({ ...v, [s.key]: (v[s.key] + s.count - 2) % s.count + 1 })) }}>‹</button>
                  <span>{String(variant[s.key]).padStart(2, '0')}<i>/{s.count}</i></span>
                  <button onClick={(e) => { e.stopPropagation(); setVariant((v) => ({ ...v, [s.key]: (v[s.key] % s.count) + 1 })) }}>›</button>
                </div>
              </div>
              <div className="fields">
                {([['x', 'X'], ['y', 'Y'], ['s', '크기'], ['r', '회전']] as const).map(([k, lbl]) => (
                  <label key={k}>
                    <span>{lbl}</span>
                    <input
                      type="number"
                      step={k === 's' ? 0.01 : 1}
                      value={Math.round(a[k] * 100) / 100}
                      onChange={(e) => patch(s.key, { [k]: Number(e.target.value) })}
                      onFocus={() => setSel(s.key)}
                    />
                  </label>
                ))}
                <button className="mini" onClick={(e) => { e.stopPropagation(); reset(s.key) }}>초기화</button>
              </div>
            </div>
          )
        })}

        <div className="save-bar">
          {saved && <span className="saved">{saved}</span>}
          <button className={`save${dirty ? ' dirty' : ''}`} onClick={save}>
            {dirty ? '저장하기 •' : '저장하기'}
          </button>
        </div>
      </aside>
    </div>
  )
}

/* 왼쪽 목록의 작은 몸통 미리보기 */
function BodyThumb({ n }: { n: number }) {
  const { svg, missing } = useSvg(bodyUrl(n))
  if (missing || !svg) return <i className="thumb empty" />
  return <i className="thumb" dangerouslySetInnerHTML={{ __html: svg }} />
}
