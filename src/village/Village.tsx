import {
  forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState,
} from 'react'
import { Moimo } from '../moimo/Moimo'
import { mulberry32 } from '../moimo/genes'
import { LandmarkArt } from './Landmarks'
import { LANDMARKS, PLAZA, WORLD, type LandmarkId, type Resident } from './world'

export type Camera = { tx: number; ty: number; scale: number }
export type VillageHandle = {
  flyTo: (wx: number, wy: number, scale?: number) => void
  camera: () => Camera
}

const MIN_SCALE = 0.28
const MAX_SCALE = 1.9

/* ------------------------------------------------------------------ */
/* 지형 — 한 번만 그려지는 배경                                          */
/* ------------------------------------------------------------------ */

const Terrain = memo(function Terrain() {
  const deco = useMemo(() => {
    const rnd = mulberry32(77123)
    type Item = { x: number; y: number; k: number; s: number }
    const items: Item[] = []
    for (let i = 0; i < 190; i++) {
      const x = 60 + rnd() * (WORLD.w - 120)
      const y = 140 + rnd() * (WORLD.h - 200)
      // 광장 한복판은 비워둔다
      if (Math.hypot(x - PLAZA.x, y - PLAZA.y) < 320) continue
      if (LANDMARKS.some((l) => Math.hypot(x - l.x, y - l.y) < l.keepout * 0.9)) continue
      items.push({ x, y, k: Math.floor(rnd() * 5), s: 0.7 + rnd() * 0.7 })
    }
    return items.sort((a, b) => a.y - b.y)
  }, [])

  return (
    <svg className="terrain" width={WORLD.w} height={WORLD.h} viewBox={`0 0 ${WORLD.w} ${WORLD.h}`}>
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={WORLD.w} height={WORLD.h} fill="#FBF5E7" />

      {/* 풀밭 */}
      <g fill="#E4F2CE">
        <ellipse cx={620} cy={480} rx={520} ry={300} />
        <ellipse cx={3000} cy={520} rx={520} ry={300} />
        <ellipse cx={480} cy={1900} rx={480} ry={330} />
        <ellipse cx={3160} cy={1980} rx={520} ry={330} />
        <ellipse cx={1900} cy={2280} rx={900} ry={260} />
      </g>

      {/* 연못 */}
      <g>
        <ellipse cx={2980} cy={1420} rx={230} ry={130} fill="#BFE3EE" />
        <ellipse cx={2980} cy={1408} rx={200} ry={106} fill="#D3EFF7" />
        <ellipse cx={560} cy={1300} rx={170} ry={98} fill="#BFE3EE" />
        <ellipse cx={560} cy={1290} rx={144} ry={78} fill="#D3EFF7" />
      </g>

      {/* 길 — 광장에서 각 오브제로 */}
      <g stroke="#F1E2C2" strokeWidth={62} strokeLinecap="round" fill="none">
        {LANDMARKS.filter((l) => l.id !== 'fountain').map((l) => (
          <path key={l.id} d={`M${PLAZA.x} ${PLAZA.y}Q${(PLAZA.x + l.x) / 2 + 60} ${(PLAZA.y + l.y) / 2 - 70} ${l.x} ${l.y + 20}`} />
        ))}
      </g>
      <g stroke="#FAF0D9" strokeWidth={40} strokeLinecap="round" fill="none">
        {LANDMARKS.filter((l) => l.id !== 'fountain').map((l) => (
          <path key={l.id} d={`M${PLAZA.x} ${PLAZA.y}Q${(PLAZA.x + l.x) / 2 + 60} ${(PLAZA.y + l.y) / 2 - 70} ${l.x} ${l.y + 20}`} />
        ))}
      </g>

      {/* 광장 바닥 */}
      <ellipse cx={PLAZA.x} cy={PLAZA.y + 30} rx={520} ry={330} fill="#F6E9CE" />
      <ellipse cx={PLAZA.x} cy={PLAZA.y + 30} rx={440} ry={276} fill="#FAF1DD" />
      <ellipse cx={PLAZA.x} cy={PLAZA.y + 30} rx={520} ry={330} fill="url(#glow)" opacity={0.5} />

      {/* 자잘한 나무·덤불·꽃 */}
      {deco.map((d, i) => (
        <g key={i} transform={`translate(${d.x} ${d.y}) scale(${d.s})`}>
          {d.k === 0 && (<><path d="M-4 26V6h8v20Z" fill="#C99B6E" /><circle cx={0} cy={-2} r={24} fill="#BEE4A0" /><circle cx={-11} cy={8} r={15} fill="#CDEBB1" /></>)}
          {d.k === 1 && (<><ellipse cx={0} cy={12} rx={22} ry={15} fill="#CDEBB1" /><ellipse cx={-13} cy={16} rx={13} ry={10} fill="#BEE4A0" /></>)}
          {d.k === 2 && (<g><path d="M0 14V2" stroke="#8FBE74" strokeWidth={2.6} strokeLinecap="round" /><circle cx={0} cy={-2} r={5.5} fill="#FFB3C4" /><circle cx={-7} cy={2} r={5} fill="#FFD4DE" /><circle cx={7} cy={2} r={5} fill="#FFD4DE" /><circle cx={0} cy={1} r={3} fill="#FFE08A" /></g>)}
          {d.k === 3 && (<><ellipse cx={0} cy={10} rx={17} ry={11} fill="#EADDC2" /><ellipse cx={-6} cy={4} rx={9} ry={7} fill="#F3E8D2" /></>)}
          {d.k === 4 && (<g><path d="M-3 22V4h6v18Z" fill="#B98A5F" /><path d="M0 -20 20 12H-20Z" fill="#A9D98D" /><path d="M0 -6 15 20H-15Z" fill="#BEE4A0" /></g>)}
        </g>
      ))}
    </svg>
  )
})

/* ------------------------------------------------------------------ */
/* 마을                                                                */
/* ------------------------------------------------------------------ */

type Props = {
  residents: Resident[]
  onLandmark: (id: LandmarkId) => void
  onResident: (r: Resident) => void
  /** 방금 도착해서 통 튀어야 하는 주민 */
  arrivedId: string | null
  onCamera?: (c: Camera) => void
}

export const Village = forwardRef<VillageHandle, Props>(function Village(
  { residents, onLandmark, onResident, arrivedId, onCamera },
  ref,
) {
  const boxRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const camRef = useRef<Camera>({ tx: 0, ty: 0, scale: 0.62 })
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

  const clamp = useCallback((c: Camera): Camera => {
    const el = boxRef.current
    if (!el) return c
    const vw = el.clientWidth
    const vh = el.clientHeight
    const ww = WORLD.w * c.scale
    const wh = WORLD.h * c.scale
    const pad = 120
    c.tx = ww < vw ? (vw - ww) / 2 : Math.min(pad, Math.max(vw - ww - pad, c.tx))
    c.ty = wh < vh ? (vh - wh) / 2 : Math.min(pad, Math.max(vh - wh - pad, c.ty))
    return c
  }, [])

  const flyTo = useCallback((wx: number, wy: number, scale?: number) => {
    const el = boxRef.current
    if (!el) return
    const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale ?? camRef.current.scale))
    camRef.current = clamp({ scale: s, tx: el.clientWidth / 2 - wx * s, ty: el.clientHeight / 2 - wy * s })
    setGlide(true)
    apply()
    window.setTimeout(() => setGlide(false), 900)
  }, [apply, clamp])

  useImperativeHandle(ref, () => ({ flyTo, camera: () => ({ ...camRef.current }) }), [flyTo])

  // 첫 진입 — 광장을 화면 한가운데
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    camRef.current = clamp({
      scale: 0.62,
      tx: el.clientWidth / 2 - PLAZA.x * 0.62,
      ty: el.clientHeight / 2 - PLAZA.y * 0.62,
    })
    apply()
    const onResize = () => { camRef.current = clamp(camRef.current); apply() }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [apply, clamp])

  const zoomAt = useCallback((sx: number, sy: number, factor: number) => {
    const c = camRef.current
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, c.scale * factor))
    const k = next / c.scale
    camRef.current = clamp({ scale: next, tx: sx - (sx - c.tx) * k, ty: sy - (sy - c.ty) * k })
    apply()
  }, [apply, clamp])

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
      const target = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchStart.current.scale * (dist / pinchStart.current.dist)))
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
    if (drag.current?.id === e.pointerId) {
      // 끌었으면 그 위 클릭은 삼킨다
      const moved = drag.current.moved
      drag.current = null
      if (moved) {
        const box = boxRef.current
        box?.classList.add('swallow')
        window.setTimeout(() => box?.classList.remove('swallow'), 0)
      }
    }
  }

  const sorted = useMemo(() => [...residents].sort((a, b) => a.y - b.y), [residents])

  return (
    <div
      ref={boxRef}
      className="village"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
    >
      <div ref={worldRef} className={`world${glide ? ' glide' : ''}`}>
        <Terrain />

        {/* 오브제 */}
        {LANDMARKS.map((l) => (
          <button
            key={l.id}
            className="landmark"
            style={{ left: l.x, top: l.y, width: l.w, height: l.w }}
            onClick={() => { if (!drag.current) onLandmark(l.id) }}
            aria-label={`${l.name} — ${l.tag}`}
          >
            <svg viewBox="0 0 200 200" width="100%" height="100%" overflow="visible">
              <LandmarkArt id={l.id} />
            </svg>
            <span className="landmark-label">
              <b>{l.name}</b>
              <i>{l.tag}</i>
            </span>
          </button>
        ))}

        {/* 주민 */}
        {sorted.map((r) => (
          <button
            key={r.id}
            className={`resident${r.id === arrivedId ? ' arrive' : ''}${r.mine ? ' mine' : ''}`}
            style={{ left: r.x, top: r.y, transform: `translate(-50%, -100%) scaleX(${r.flip ? -1 : 1})` }}
            onClick={() => onResident(r)}
            aria-label={`${r.name}`}
          >
            <Moimo genes={r.genes} size={72} phase={r.phase} title={r.name} />
          </button>
        ))}
      </div>
    </div>
  )
})
