import {
  forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState,
} from 'react'
import { composeMoimo, type PartsCache } from '../moimo/compose'
import type { AnchorTable } from '../moimo/parts'
import { ItemArt } from './Items'
import { ITEMS, WORLD, CENTER, scatterProps, type ItemId, type Resident } from './model'

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
/* 그림으로 갈아 끼울 수 있는 것들                                      */
/* ------------------------------------------------------------------ */

/**
 * 배경 그림. `public/world/background.png` 를 놓으면 크림색 바탕 위에 깔린다.
 * 없으면 그냥 안 보이고 예전처럼 크림색과 옅은 얼룩만 남는다.
 * 월드 크기(3600×2400)에 맞춰 늘어나므로 그 비율로 그리면 된다.
 */
const BACKGROUND = '/world/background.jpg'

/**
 * 오브제 그림. `public/items/jar.png` 처럼 놓으면 그 그림을 쓰고,
 * 없으면 지금까지 쓰던 그린 그림으로 돌아간다. 한 개씩 옮겨 갈 수 있다.
 */
function ItemImage({ id }: { id: ItemId }) {
  const [png, setPng] = useState(true)
  if (png) {
    return (
      <img
        className="item-art"
        src={`/items/${id}.png`}
        alt=""
        draggable={false}
        onError={() => setPng(false)}
      />
    )
  }
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" overflow="visible">
      <ItemArt id={id} />
    </svg>
  )
}

/**
 * 소품 그림. `public/items/deco1.svg` ~ `deco5.svg`.
 * 마을 곳곳에 흩뿌려진다. 없는 파일은 조용히 빠진다 —
 * 더 그리면 `DECO_COUNT` 만 올리면 된다.
 */
const DECO_COUNT = 5
const PROP_ART: string[] = Array.from({ length: DECO_COUNT }, (_, i) => `/items/deco${i + 1}.svg`)

function Prop({ src, style }: { src: string; style: React.CSSProperties }) {
  const [ok, setOk] = useState(true)
  if (!ok) return null
  return (
    <img className="prop" src={src} alt="" draggable={false} style={style} onError={() => setOk(false)} />
  )
}

/** 모이모 아래에 깔리는 소품들 */
const PropLayer = memo(function PropLayer() {
  const list = useMemo(
    () => scatterProps().map((p) => ({
      ...p,
      src: PROP_ART[Math.min(PROP_ART.length - 1, Math.floor(p.pick * PROP_ART.length))],
    })),
    [],
  )

  return (
    <>
      {list.map((p) => (
        <Prop
          key={p.id}
          src={p.src}
          style={{
            left: p.x,
            top: p.y,
            width: p.w,
            opacity: p.tone,
            transform: `translate(-50%, -50%) rotate(${p.rot.toFixed(1)}deg) scaleX(${p.flip ? -1 : 1})`,
          }}
        />
      ))}
    </>
  )
})

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
        <PropLayer />

        {ITEMS.map((it) => (
          <button
            key={it.id}
            className={`item${it.id === 'music' && playing ? ' singing' : ''}`}
            style={{ left: it.x, top: it.y, width: it.w, height: it.w }}
            onClick={() => { if (!drag.current) onItem(it.id) }}
          >
            <ItemImage id={it.id} />
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
/* 바닥 — 넣어 둔 배경 그림 한 장                                        */
/* ------------------------------------------------------------------ */

const Ground = memo(function Ground() {
  return (
    <img className="ground-art" src={BACKGROUND} alt="" width={WORLD.w} height={WORLD.h} draggable={false} />
  )
})
