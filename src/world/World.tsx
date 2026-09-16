import {
  forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState,
} from 'react'
import { composeMoimo, type PartsCache } from '../moimo/compose'
import type { AnchorTable } from '../moimo/parts'
import { ItemArt } from './Items'
import { ITEMS, WORLD, CENTER, type ItemId, type Resident } from './model'

export type Camera = { tx: number; ty: number; scale: number }
export type WorldHandle = {
  flyTo: (wx: number, wy: number, scale?: number) => void
  camera: () => Camera
}

/** 아무리 줄여도 이 아래로는 안 간다 */
const FLOOR_SCALE = 0.26
const MAX_SCALE = 2.2
/** 처음 열었을 때의 배율 — 화면 크기와 무관하게 같은 크기로 보이도록 고정 */
const HOME_SCALE = 0.75
const MOIMO_PX = 104

/* ------------------------------------------------------------------ */

export const MoimoImg = memo(function MoimoImg({
  resident, cache, table, size = MOIMO_PX, className,
}: {
  resident: Resident; cache: PartsCache; table: AnchorTable
  size?: number
  className?: string
}) {
  // SVG 를 그림 파일로 구워 걸면 브라우저가 '놓인 크기'로 한 번 비트맵을 만들어 둔다.
  // 확대하면 그 비트맵을 늘리게 되고, 수십 마리분이 한꺼번에 화면에 얹히면
  // 가장자리가 부서지거나 가로줄이 생긴다. 그래서 벡터인 채로 그대로 심는다.
  const html = useMemo(
    () => composeMoimo(resident.genes, cache, table),
    [resident.genes, cache, table],
  )
  return (
    <span
      className={`art ${className ?? ''}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={resident.name}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})

/* ------------------------------------------------------------------ */

type Props = {
  residents: Resident[]
  /** 노래가 흐르는 중인지 — 플레이어 오브제가 반짝인다 */
  playing?: boolean
  cache: PartsCache
  table: AnchorTable
  onItem: (id: ItemId) => void
  onResident: (r: Resident) => void
  arrivedId: string | null
  /** 돋보기 — 이름표를 띄워둘지 */
  showNames: boolean
  /** 검색어에 걸린 주민 */
  hits: Set<string> | null
  onCamera?: (c: Camera) => void
}

export const World = forwardRef<WorldHandle, Props>(function World(
  { residents, cache, table, onItem, onResident, arrivedId, showNames, hits, onCamera, playing },
  ref,
) {
  const boxRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const camRef = useRef<Camera>({ tx: 0, ty: 0, scale: 0.6 })
  const [glide, setGlide] = useState(false)
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null)
  const pinch = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null)

  const apply = useCallback(() => {
    const c = camRef.current
    if (worldRef.current) {
      worldRef.current.style.transform = `translate3d(${c.tx}px, ${c.ty}px, 0) scale(${c.scale})`
    }
    onCamera?.({ ...c })
  }, [onCamera])

  /**
   * 화면을 빈틈없이 덮는 배율.
   * 27인치처럼 넓은 화면에서 마을이 가운데 작게 떠 있고 둘레가 비는 것을 막는다.
   */
  const cover = useCallback(() => {
    const el = boxRef.current
    if (!el) return FLOOR_SCALE
    return Math.max(FLOOR_SCALE, el.clientWidth / WORLD.w, el.clientHeight / WORLD.h)
  }, [])

  const clamp = useCallback((c: Camera): Camera => {
    const el = boxRef.current
    if (!el) return c
    const vw = el.clientWidth
    const vh = el.clientHeight
    const ww = WORLD.w * c.scale
    const wh = WORLD.h * c.scale
    const pad = 140
    c.tx = ww < vw ? (vw - ww) / 2 : Math.min(pad, Math.max(vw - ww - pad, c.tx))
    c.ty = wh < vh ? (vh - wh) / 2 : Math.min(pad, Math.max(vh - wh - pad, c.ty))
    return c
  }, [])

  const flyTo = useCallback((wx: number, wy: number, scale?: number) => {
    const el = boxRef.current
    if (!el) return
    const s = Math.min(MAX_SCALE, Math.max(cover(), scale ?? camRef.current.scale))
    camRef.current = clamp({ scale: s, tx: el.clientWidth / 2 - wx * s, ty: el.clientHeight / 2 - wy * s })
    setGlide(true)
    apply()
    window.setTimeout(() => setGlide(false), 900)
  }, [apply, clamp, cover])

  useImperativeHandle(ref, () => ({ flyTo, camera: () => ({ ...camRef.current }) }), [flyTo])

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const s = Math.max(HOME_SCALE, cover())
    camRef.current = clamp({
      scale: s,
      tx: el.clientWidth / 2 - CENTER.x * s,
      ty: el.clientHeight / 2 - CENTER.y * s,
    })
    apply()
    // 창 크기가 바뀌면 다시 덮을 만큼 당긴다
    const onResize = () => {
      const c = camRef.current
      camRef.current = clamp({ ...c, scale: Math.max(c.scale, cover()) })
      apply()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [apply, clamp, cover])

  const zoomAt = useCallback((sx: number, sy: number, factor: number) => {
    const c = camRef.current
    const next = Math.min(MAX_SCALE, Math.max(cover(), c.scale * factor))
    const k = next / c.scale
    camRef.current = clamp({ scale: next, tx: sx - (sx - c.tx) * k, ty: sy - (sy - c.ty) * k })
    apply()
  }, [apply, clamp, cover])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const rect = boxRef.current!.getBoundingClientRect()
    zoomAt(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-e.deltaY * 0.0016))
  }, [zoomAt])

  const onPointerDown = (e: React.PointerEvent) => {
    pinch.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pinch.current.size === 2) {
      const [a, b] = [...pinch.current.values()]
      pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: camRef.current.scale }
      drag.current = null
      return
    }
    setGlide(false)
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (pinch.current.has(e.pointerId)) pinch.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pinch.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pinch.current.values()]
      const rect = boxRef.current!.getBoundingClientRect()
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const target = Math.min(MAX_SCALE, Math.max(cover(), pinchStart.current.scale * (dist / pinchStart.current.dist)))
      zoomAt((a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top, target / camRef.current.scale)
      return
    }
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.moved && Math.hypot(dx, dy) > 4) d.moved = true
    d.x = e.clientX
    d.y = e.clientY
    const c = camRef.current
    camRef.current = clamp({ ...c, tx: c.tx + dx, ty: c.ty + dy })
    apply()
  }

  const endPointer = (e: React.PointerEvent) => {
    pinch.current.delete(e.pointerId)
    if (pinch.current.size < 2) pinchStart.current = null
    if (drag.current?.id === e.pointerId) drag.current = null
  }

  const sorted = useMemo(() => [...residents].sort((a, b) => a.y - b.y), [residents])


  return (
    <div
      ref={boxRef}
      className="world-box"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
    >
      <div ref={worldRef} className={`world${glide ? ' glide' : ''}`} style={{ width: WORLD.w, height: WORLD.h }}>
        <Ground />

        {ITEMS.map((it) => (
          <button
            key={it.id}
            className={`item${it.id === 'music' && playing ? ' singing' : ''}`}
            style={{ left: it.x, top: it.y, width: it.w, height: it.w }}
            onClick={() => { if (!drag.current) onItem(it.id) }}
          >
            <svg viewBox="0 0 200 200" width="100%" height="100%" overflow="visible">
              <ItemArt id={it.id} />
            </svg>
            <span className="item-label">
              <b>{it.name}</b>
              <i>{it.id === 'music' && playing ? '노래 끄기' : it.tag}</i>
            </span>
          </button>
        ))}

        {sorted.map((r) => {
          const dim = hits ? !hits.has(r.id) : false
          return (
            <button
              key={r.id}
              className={`moimo${r.id === arrivedId ? ' arrive' : ''}${r.mine ? ' mine' : ''}${dim ? ' dim' : ''}`}
              style={{
                left: r.x,
                top: r.y,
                transform: `translate(-50%, -100%) scaleX(${r.flip ? -1 : 1})`,
                animationDelay: `${(r.phase * -2.8).toFixed(2)}s`,
              }}
              onClick={() => onResident(r)}
            >
              <MoimoImg resident={r} cache={cache} table={table} />
              {(showNames || (hits && hits.has(r.id))) && (
                <span className="moimo-name" style={{ transform: `translateX(-50%) scaleX(${r.flip ? -1 : 1})` }}>
                  {r.name}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
})

/* ------------------------------------------------------------------ */
/* 바닥 — 노란끼 도는 미색에 옅은 얼룩만                                 */
/* ------------------------------------------------------------------ */

const Ground = memo(function Ground() {
  const blobs = useMemo(() => {
    let s = 4242
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
    return Array.from({ length: 26 }, () => ({
      x: rnd() * WORLD.w,
      y: rnd() * WORLD.h,
      rx: 150 + rnd() * 260,
      ry: 100 + rnd() * 180,
      o: 0.25 + rnd() * 0.4,
    }))
  }, [])

  return (
    <svg className="ground" width={WORLD.w} height={WORLD.h} viewBox={`0 0 ${WORLD.w} ${WORLD.h}`}>
      <rect width={WORLD.w} height={WORLD.h} fill="var(--cream)" />
      <g fill="var(--cream-deep)">
        {blobs.map((b, i) => <ellipse key={i} cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} opacity={b.o} />)}
      </g>
      <radialGradient id="pool" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFDF4" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#FFFDF4" stopOpacity="0" />
      </radialGradient>
      <ellipse cx={CENTER.x} cy={CENTER.y} rx={620} ry={460} fill="url(#pool)" />
    </svg>
  )
})
