import { useCallback, useEffect, useMemo, useRef, useState, useId } from 'react'
import {
  BODY_COLORS, BODY_COUNT, CANVAS, DEFAULT_ANCHOR, EMPTY_TABLE, LINE_COLOR, MORPH_COUNT, SLOTS,
  Z_BODY, Z_MORPH, bodyAnchor, bodyUrl, composeAnchor, normalizeTable, overrideKey,
  fillFor, lineFor, partAnchor, partUrl, morphUrls, prepareSvg, slotAnchor, warnIfNothingToTint,
  type Anchor, type AnchorTable, type Paint, type SlotKey,
} from '../moimo/parts'

/** 드래그가 어느 층에 쓰일지 */
type Scope = 'body' | 'every' | 'part' | 'one'

const SCOPES: { key: Scope; label: string; hint: string }[] = [
  { key: 'every', label: '기준 (모든 몸통)', hint: '12종이 함께 쓰는 자리 — 여기부터 잡으세요' },
  { key: 'body',  label: '이 몸통만',      hint: '기준에서 이 몸통만 살짝 밀어요' },
  { key: 'part',  label: '이 파츠',   hint: '이 번호의 파츠만 — 다른 번호는 안 따라와요' },
  { key: 'one',   label: '이 조합만', hint: '이 몸통 + 이 파츠 조합에만' },
]
import { useSvg } from './useSvg'
import initial from '../data/anchors.json'

const DISP = 0.86 // 화면에 512 캔버스를 얼마로 줄여 보여줄지

/* ---------------- 한 겹 ---------------- */

function Layer({
  urls, paint, anchor, z, dim, label, warn,
}: {
  urls: string | string[]
  paint: Paint
  anchor: Anchor
  z: number
  dim: boolean
  label: string
  warn?: (svg: string) => void
}) {
  const uid = useId().replace(/:/g, '')
  const { svg, missing } = useSvg(urls)
  const html = useMemo(() => (svg ? prepareSvg(svg, paint, uid) : ''), [svg, paint, uid])

  useEffect(() => { if (svg) warn?.(svg) }, [svg, warn])

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

/** 지금 이 파츠가 어느 층에서 얼마씩 받아 그 자리에 있는지 */
function LayerReadout({
  table, body, slot, part,
}: { table: AnchorTable; body: number; slot: SlotKey; part: number }) {
  const over = table.overrides[overrideKey(body, slot, part)]
  const rows: { label: string; a: Anchor; set: boolean }[] = [
    { label: '기준', a: slotAnchor(table, slot), set: Boolean(table.slots[slot]) },
    { label: '이 몸통', a: bodyAnchor(table, body, slot), set: Boolean(table.bodies[String(body)]?.[slot]) },
    { label: '이 파츠', a: partAnchor(table, slot, part), set: Boolean(table.parts[slot]?.[String(part)]) },
  ]
  const total = composeAnchor(table, body, slot, part)
  const num = (v: number) => (Math.round(v * 100) / 100).toString()

  return (
    <div className="readout">
      {rows.map((r) => (
        <div key={r.label} className={`rrow${r.set ? ' set' : ''}`}>
          <span>{r.label}</span>
          <b>{r.set ? `${num(r.a.x)}, ${num(r.a.y)}${r.a.s !== 1 ? ` ×${num(r.a.s)}` : ''}` : '—'}</b>
        </div>
      ))}
      {over && (
        <div className="rrow set warn">
          <span>이 조합만</span>
          <b>{num(over.x)}, {num(over.y)} (위를 덮음)</b>
        </div>
      )}
      <div className="rrow total">
        <span>합계</span>
        <b>{num(total.x)}, {num(total.y)}{total.s !== 1 ? ` ×${num(total.s)}` : ''}</b>
      </div>
    </div>
  )
}

/* 몸통 + 무늬 + 파츠를 한 벌 쌓은 것. 무대와 모아보기가 같이 쓴다 */
function Figure({
  body, variant, morph, color, table, soloSlot, warnTint,
}: {
  body: number
  variant: Record<string, number>
  morph: number
  color: (typeof BODY_COLORS)[number]
  table: AnchorTable
  soloSlot?: SlotKey | null
  warnTint?: boolean
}) {
  const line = lineFor(color)
  const paint = { fill: color.hex, line, accent: color.accent }
  return (
    <>
      <Layer
        urls={bodyUrl(body)} paint={paint} anchor={DEFAULT_ANCHOR} z={Z_BODY}
        dim={soloSlot != null} label={`몸통 ${body}`}
      />
      {morph > 0 && (
        <Layer
          urls={morphUrls(body, morph)} paint={paint} anchor={DEFAULT_ANCHOR} z={Z_MORPH}
          dim={soloSlot != null} label="무늬"
        />
      )}
      {SLOTS.map((s) => (
        <Layer
          key={s.key}
          urls={partUrl(s.key, variant[s.key])}
          paint={{ fill: fillFor(s.key, variant[s.key], color.hex), line, accent: color.accent }}
          anchor={composeAnchor(table, body, s.key, variant[s.key])}
          z={s.z}
          dim={soloSlot != null && soloSlot !== s.key}
          label={s.label}
          warn={warnTint ? (raw) => warnIfNothingToTint(s.key, variant[s.key], raw) : undefined}
        />
      ))}
    </>
  )
}

/** 모아보기 한 칸 */
function Cell({
  size, label, on, tuned, onPick, children,
}: {
  size: number; label: string; on: boolean; tuned?: boolean
  onPick: () => void; children: React.ReactNode
}) {
  return (
    <button className={`cell${on ? ' on' : ''}${tuned ? ' tuned' : ''}`} onClick={onPick} style={{ width: size }}>
      <div className="cell-art" style={{ width: size, height: size }}>
        <div style={{
          position: 'absolute', width: CANVAS, height: CANVAS,
          transform: `scale(${size / CANVAS})`, transformOrigin: '0 0',
        }}>
          {children}
        </div>
      </div>
      <span>{label}</span>
    </button>
  )
}

/* ---------------- 편집기 ---------------- */

export default function AnchorEditor() {
  const [table, setTable] = useState<AnchorTable>(() => normalizeTable(initial))
  const [scope, setScope] = useState<Scope>('every')
  const [body, setBody] = useState(1)
  const [sel, setSel] = useState<SlotKey | null>('eye')
  const [colorIdx, setColorIdx] = useState(1)
  const [variant, setVariant] = useState<Record<string, number>>(
    () => Object.fromEntries(SLOTS.map((s) => [s.key, 1])),
  )
  const [morph, setMorph] = useState(0) // 0 = 무늬 없음
  const [solo, setSolo] = useState(false)
  const [sheet, setSheet] = useState<'off' | 'bodies' | 'parts'>('off')
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)

  const stageRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number } | null>(null)

  const color = BODY_COLORS[colorIdx]

  /* --- 앵커 수정 --- */

  /** 지금 편집 중인 층의 값 */
  const current = useCallback((slot: SlotKey): Anchor => {
    if (scope === 'every') return slotAnchor(table, slot)
    if (scope === 'body') return bodyAnchor(table, body, slot)
    if (scope === 'part') return partAnchor(table, slot, variant[slot])
    return table.overrides[overrideKey(body, slot, variant[slot])]
      ?? composeAnchor(table, body, slot, variant[slot])
  }, [table, body, scope, variant])

  const patch = useCallback((slot: SlotKey, d: Partial<Anchor>) => {
    setTable((t) => {
      const next = { ...t, bodies: { ...t.bodies }, parts: { ...t.parts }, overrides: { ...t.overrides } }
      if (scope === 'body') {
        const key = String(body)
        next.bodies[key] = { ...next.bodies[key], [slot]: { ...bodyAnchor(t, body, slot), ...d } }
      } else if (scope === 'every') {
        next.slots = { ...next.slots, [slot]: { ...slotAnchor(t, slot), ...d } }
      } else if (scope === 'part') {
        const n = String(variant[slot])
        next.parts[slot] = { ...next.parts[slot], [n]: { ...partAnchor(t, slot, variant[slot]), ...d } }
      } else {
        const k = overrideKey(body, slot, variant[slot])
        const base = t.overrides[k] ?? composeAnchor(t, body, slot, variant[slot])
        next.overrides[k] = { ...base, ...d }
      }
      return next
    })
    setDirty(true)
  }, [body, scope, variant])

  /** 지금 층의 값만 지운다 */
  const reset = useCallback((slot: SlotKey) => {
    setTable((t) => {
      const next = { ...t, bodies: { ...t.bodies }, parts: { ...t.parts }, overrides: { ...t.overrides } }
      if (scope === 'body') {
        const key = String(body)
        const { [slot]: _drop, ...rest } = next.bodies[key] ?? {}
        next.bodies[key] = rest
      } else if (scope === 'every') {
        const { [slot]: _drop, ...rest } = next.slots
        next.slots = rest
      } else if (scope === 'part') {
        const { [String(variant[slot])]: _drop, ...rest } = next.parts[slot] ?? {}
        next.parts[slot] = rest
      } else {
        delete next.overrides[overrideKey(body, slot, variant[slot])]
      }
      return next
    })
    setDirty(true)
  }, [body, scope, variant])

  const copyFrom = (from: number) => {
    setTable((t) => ({
      ...t,
      bodies: { ...t.bodies, [String(body)]: JSON.parse(JSON.stringify(t.bodies[String(from)] ?? {})) },
    }))
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
    const a = current(sel)
    patch(sel, { x: a.x + (e.clientX - d.x) / DISP, y: a.y + (e.clientY - d.y) / DISP })
    dragRef.current = { x: e.clientX, y: e.clientY }
  }

  const onPointerUp = () => { dragRef.current = null }

  const onWheel = (e: React.WheelEvent) => {
    if (!sel) return
    e.preventDefault()
    const a = current(sel)
    patch(sel, { s: Math.max(0.1, Math.min(4, a.s * Math.exp(-e.deltaY * 0.0012))) })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!sel) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT') return
      const a = current(sel)
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
  }, [sel, current, patch])

  /* --- 저장 --- */

  const save = async () => {
    void EMPTY_TABLE
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

  const baseCount = Object.keys(table.slots).length
  const tweakCount = Object.values(table.bodies).filter((b) => Object.keys(b ?? {}).length).length
  const overrideCount = Object.keys(table.overrides).length

  /* --- 그리기 --- */

  return (
    <div className="anchor-app">
      {/* 왼쪽: 몸통 */}
      <aside className="col bodies">
        <h1>앵커 편집기</h1>
        <p className="sub">
          기준 {baseCount}/{SLOTS.length}
          {tweakCount ? ` · 보정한 몸통 ${tweakCount}` : ''}
          {overrideCount ? ` · 예외 ${overrideCount}` : ''}
        </p>
        <div className="body-list">
          {Array.from({ length: BODY_COUNT }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={`body-btn${n === body ? ' on' : ''}${sel && table.bodies[String(n)]?.[sel] ? ' done' : ''}`}
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
          <div className="scopes">
            <button className={`scope${sheet === 'off' ? ' on' : ''}`} onClick={() => setSheet('off')}>한 마리</button>
            <button className={`scope${sheet === 'bodies' ? ' on' : ''}`} onClick={() => setSheet('bodies')}>몸통 12종</button>
            <button
              className={`scope${sheet === 'parts' ? ' on' : ''}`}
              onClick={() => setSheet('parts')}
              disabled={!sel}
            >
              {sel ? `${SLOTS.find((s) => s.key === sel)!.label} 전종` : '파츠 전종'}
            </button>
          </div>
          <div className="scopes">
            {SCOPES.map((s) => (
              <button
                key={s.key}
                className={`scope${scope === s.key ? ' on' : ''}`}
                onClick={() => setScope(s.key)}
                title={s.hint}
              >{s.label}</button>
            ))}
          </div>
          <label className="toggle">
            무늬
            <select value={morph} onChange={(e) => setMorph(Number(e.target.value))}>
              <option value={0}>없음</option>
              {Array.from({ length: MORPH_COUNT }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{String(n).padStart(2, '0')}</option>
              ))}
            </select>
          </label>
        </div>

        {sheet !== 'off' ? (
          <div className="sheet-grid">
            {sheet === 'bodies'
              ? Array.from({ length: BODY_COUNT }, (_, i) => i + 1).map((n) => (
                  <Cell
                    key={n}
                    size={150}
                    label={`몸통 ${String(n).padStart(2, '0')}`}
                    tuned={Boolean(sel && table.bodies[String(n)]?.[sel])}
                    on={n === body}
                    onPick={() => setBody(n)}
                  >
                    <Figure body={n} variant={variant} morph={morph} color={color} table={table} />
                  </Cell>
                ))
              : sel && Array.from({ length: SLOTS.find((s) => s.key === sel)!.count }, (_, i) => i + 1).map((n) => (
                  <Cell
                    key={n}
                    size={150}
                    label={`${SLOTS.find((s) => s.key === sel)!.label} ${String(n).padStart(2, '0')}`}
                    tuned={Boolean(table.parts[sel]?.[String(n)])}
                    on={n === variant[sel]}
                    onPick={() => setVariant((v) => ({ ...v, [sel]: n }))}
                  >
                    <Figure
                      body={body}
                      variant={{ ...variant, [sel]: n }}
                      morph={morph}
                      color={color}
                      table={table}
                    />
                  </Cell>
                ))}
          </div>
        ) : (
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

            <Figure
              body={body}
              variant={variant}
              morph={morph}
              color={color}
              table={table}
              soloSlot={solo && sel ? sel : null}
              warnTint
            />

            {sel && (
              <div
                className="sel-box"
                style={{
                  transform: `translate(${composeAnchor(table, body, sel, variant[sel]).x}px, ${composeAnchor(table, body, sel, variant[sel]).y}px) rotate(${composeAnchor(table, body, sel, variant[sel]).r}deg) scale(${composeAnchor(table, body, sel, variant[sel]).s})`,
                }}
              />
            )}
          </div>
        </div>
        )}

        {sel && sheet === 'off' && (
          <div className="strip">
            <span className="strip-label">{SLOTS.find((s) => s.key === sel)!.label}</span>
            <div className="strip-scroll">
              {Array.from({ length: SLOTS.find((s) => s.key === sel)!.count }, (_, i) => i + 1).map((n) => (
                <PartThumb
                  key={n}
                  slot={sel}
                  n={n}
                  on={variant[sel] === n}
                  tuned={Boolean(table.parts[sel]?.[String(n)])}
                  onPick={() => setVariant((v) => ({ ...v, [sel]: n }))}
                />
              ))}
            </div>
          </div>
        )}

        <p className="hint">
          {sheet === 'off' ? (
            <>
              <b>드래그</b> 이동 · <b>휠</b> 크기 · <b>←↑↓→</b> 1px(Shift 10px) · <b>[ ]</b> 회전
              <br />
              지금 고치는 것: <b>{SCOPES.find((s) => s.key === scope)!.label}</b>
              {' — '}{SCOPES.find((s) => s.key === scope)!.hint}
            </>
          ) : (
            <>어긋난 칸을 누르면 그리로 옮겨가요. 고치고 다시 <b>모아보기</b>로 확인하세요.</>
          )}
        </p>
      </main>

      {/* 오른쪽: 슬롯 */}
      <aside className="col slots">
        <div className="slot-head">
          <select onChange={(e) => { const v = Number(e.target.value); if (v) copyFrom(v) }} value={0}>
            <option value={0}>다른 몸통에서 복사…</option>
            {Array.from({ length: BODY_COUNT }, (_, i) => i + 1)
              .filter((n) => n !== body && Object.keys(table.bodies[String(n)] ?? {}).length)
              .map((n) => <option key={n} value={n}>몸통 {String(n).padStart(2, '0')}</option>)}
          </select>
        </div>

        {SLOTS.map((s) => {
          const a = current(s.key)
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
              {on && <LayerReadout table={table} body={body} slot={s.key} part={variant[s.key]} />}
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

/* 아래 띠에 늘어놓는 파츠 하나 */
function PartThumb({
  slot, n, on, tuned, onPick,
}: { slot: SlotKey; n: number; on: boolean; tuned: boolean; onPick: () => void }) {
  const uid = useId().replace(/:/g, '')
  const { svg, missing } = useSvg(partUrl(slot, n))
  const ref = useRef<HTMLElement>(null)

  // 파츠는 512 캔버스 한구석만 차지해서 그냥 줄이면 거의 안 보인다.
  // 실제로 그려진 만큼만 잘라서 띠에 채운다.
  useEffect(() => {
    const el = ref.current?.querySelector('svg')
    if (!el) return
    try {
      const bb = (el as unknown as SVGGraphicsElement).getBBox()
      if (bb.width < 1 || bb.height < 1) return
      const pad = Math.max(bb.width, bb.height) * 0.12
      el.setAttribute('viewBox', `${bb.x - pad} ${bb.y - pad} ${bb.width + pad * 2} ${bb.height + pad * 2}`)
      el.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    } catch {
      /* 못 재면 원본 그대로 */
    }
  }, [svg])

  return (
    <button className={`pthumb${on ? ' on' : ''}${tuned ? ' tuned' : ''}`} onClick={onPick} title={`${slot} ${n}`}>
      {missing || !svg
        ? <i className="pthumb-empty" />
        : <i ref={ref} dangerouslySetInnerHTML={{ __html: prepareSvg(svg, { fill: '#FFFFFF', line: LINE_COLOR }, uid) }} />}
      <em>{String(n).padStart(2, '0')}</em>
    </button>
  )
}

/* 왼쪽 목록의 작은 몸통 미리보기 */
function BodyThumb({ n }: { n: number }) {
  const uid = useId().replace(/:/g, '')
  const { svg, missing } = useSvg(bodyUrl(n))
  if (missing || !svg) return <i className="thumb empty" />
  return <i className="thumb" dangerouslySetInnerHTML={{ __html: prepareSvg(svg, { fill: '#FFFFFF', line: LINE_COLOR }, uid) }} />
}
