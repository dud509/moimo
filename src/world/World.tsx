import {
  forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState,
} from 'react'
import { composeMoimo, type PartsCache } from '../moimo/compose'
import type { AnchorTable } from '../moimo/parts'
import { CANDY_LINE_PX, CANDY_W, DECOR, FRAME, GUIDES, ITEMS, MOIMO_W, OBJECT_LINE_PX, WORLD, CENTER, PROPS, PROP_KINDS, type ItemId, type Placed, type Resident } from './model'
import { useTightArt, type Tight } from './tight'

/** 여백을 잘라내고 쓸 그림들 — 오브제와 소품 */
const ART_SRCS = [
  ...ITEMS.map((it) => it.src),
  ...DECOR.map((d) => d.src),
  ...GUIDES.map((g) => g.src),
  ...PROP_KINDS.map((k) => k.src),
]

/**
 * 손에 든 돋보기. w 는 화면 폭(px), ratio 는 그림의 세로/가로,
 * cx·cy 는 렌즈 한가운데(그림 네모를 0~1 로 본 값), rx·ry 는 렌즈 반지름
 * (rx 는 폭, ry 는 높이에 대한 몫). 돋보기 그림에서 렌즈 안쪽 테를 잰 값이다.
 */
const LENS = { w: 290, ratio: 1.172, cx: 0.58, cy: 0.29, rx: 0.35, ry: 0.245 }

/** 그림마다 [화면에 놓이는 폭, 맞출 선 굵기] — 선 굵기를 화면 기준으로 맞춘다 */
const ART_LINES: Record<string, readonly [number, number]> = Object.fromEntries([
  ...[...ITEMS, ...DECOR, ...GUIDES].map((p) => [p.src, [p.w, OBJECT_LINE_PX]]),
  ...PROP_KINDS.map((k) => [k.src, [CANDY_W, CANDY_LINE_PX]]),
])

/** 그림 한 점이 놓이는 자리 — x, y 가 한가운데 */
const placeStyle = (p: Placed, art?: Tight): React.CSSProperties => {
  const h = p.w * (art?.ratio ?? p.ratio)
  return { left: p.x - p.w / 2, top: p.y - h / 2, width: p.w, height: h }
}

/** 바닥에 깔리는 옅은 그림자. 한가운데가 가장 짙고 가장자리로 갈수록 사라진다 */
const Shadow = () => <span className="shadow" aria-hidden />

export type Camera = { tx: number; ty: number; scale: number }
export type WorldHandle = {
  flyTo: (wx: number, wy: number, scale?: number) => void
  camera: () => Camera
}

/** 아무리 줄여도 이 아래로는 안 간다 */
const FLOOR_SCALE = 0.26
/** 끝까지 줄였을 때 보이는 마을의 몫 — 가로·세로 각각 */
const VIEW_SHARE = 0.66
const MAX_SCALE = 2.2
const MOIMO_PX = MOIMO_W


/* ------------------------------------------------------------------ */
/* 그림으로 갈아 끼울 수 있는 것들                                      */
/* ------------------------------------------------------------------ */

/** 오브제 그림. 파일을 다 읽기 전에는 아무것도 그리지 않는다 */
function ItemImage({ art }: { art?: Tight }) {
  if (!art) return null
  return <img className="item-art" src={art.url} alt="" draggable={false} />
}

/** 소품 한 개. 어떤 그림을 쓸지는 PROP_KINDS 에 적혀 있다 */
function Prop({ prop, art }: { prop: (typeof PROPS)[number]; art?: Tight }) {
  if (!art) return null
  return (
    <img
      className="prop"
      src={art.url}
      alt=""
      draggable={false}
      style={{
        left: prop.x,
        top: prop.y,
        width: prop.w,
        height: prop.w * art.ratio,
        transform: `translate(-50%, -50%) rotate(${prop.rot.toFixed(1)}deg)`,
      }}
    />
  )
}

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
  cache: PartsCache
  table: AnchorTable
  onItem: (id: ItemId) => void
  onResident: (r: Resident) => void
  arrivedId: string | null
  /** 돋보기 — 이름표를 띄워둘지 */
  showNames: boolean
  /** 검색어에 걸린 주민 */
  hits: Set<string> | null
  /** 돋보기를 들고 있나 — 렌즈 안의 모이모만 이름표가 뜬다 */
  lens?: boolean
  onCamera?: (c: Camera) => void
}

export const World = forwardRef<WorldHandle, Props>(function World(
  { residents, cache, table, onItem, onResident, arrivedId, showNames, hits, lens = false, onCamera },
  ref,
) {
  const art = useTightArt(ART_SRCS, ART_LINES)

  /*
   * 돋보기 — 들고 있으면 마우스를 따라다니고, 렌즈 안에 들어온 모이모만
   * 이름표가 뜬다. 렌즈 자리는 돋보기 그림에서 잰 값이다.
   */
  const lensRef = useRef<HTMLDivElement>(null)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const [underLens, setUnderLens] = useState<Set<string>>(new Set())
  const underKey = useRef('')
  const residentsRef = useRef(residents)
  residentsRef.current = residents

  /** 렌즈 아래 모이모를 다시 센다 — 마우스나 화면이 움직일 때 */
  const peek = useCallback(() => {
    const p = pointer.current
    const el = lensRef.current
    if (!p) return
    if (el) el.style.transform = `translate(${p.x - LENS.w * LENS.cx}px, ${p.y - LENS.w * LENS.ratio * LENS.cy}px)`
    const c = camRef.current
    const ids: string[] = []
    for (const r of residentsRef.current) {
      const sx = r.x * c.scale + c.tx
      const sy = (r.y - MOIMO_W * 0.55) * c.scale + c.ty
      const dx = (sx - p.x) / (LENS.w * LENS.rx)
      const dy = (sy - p.y) / (LENS.w * LENS.ratio * LENS.ry)
      if (dx * dx + dy * dy <= 1) ids.push(r.id)
    }
    const key = ids.join('|')
    if (key !== underKey.current) {
      underKey.current = key
      setUnderLens(new Set(ids))
    }
  }, [])
  const boxRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const camRef = useRef<Camera>({ tx: 0, ty: 0, scale: 0.6 })
  const [glide, setGlide] = useState(false)
  const drag = useRef<{ id: number; x: number; y: number; sx: number; sy: number; moved: boolean } | null>(null)
  /** 방금 끌기를 마쳤나 — 끌고 손을 뗀 자리의 클릭은 무시한다 */
  const dragged = useRef(false)
  const pinch = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null)

  const apply = useCallback(() => {
    const c = camRef.current
    if (worldRef.current) {
      worldRef.current.style.transform = `translate3d(${c.tx}px, ${c.ty}px, 0) scale(${c.scale})`
    }
    onCamera?.({ ...c })
    peek()
  }, [onCamera, peek])

  /**
   * 화면을 빈틈없이 덮는 배율.
   * 27인치처럼 넓은 화면에서 마을이 가운데 작게 떠 있고 둘레가 비는 것을 막는다.
   */
  /**
   * 가장 줄였을 때의 배율.
   * 화면을 빈틈없이 덮되, 마을의 2/3 남짓까지만 보인다 — 다 보이게 두면
   * 모이모가 콩알만 해지고 둘레가 허전해 보인다.
   */
  const cover = useCallback(() => {
    const el = boxRef.current
    if (!el) return FLOOR_SCALE
    return Math.max(
      FLOOR_SCALE,
      el.clientWidth / WORLD.w, el.clientHeight / WORLD.h,
      el.clientWidth / (WORLD.w * VIEW_SHARE), el.clientHeight / (WORLD.h * VIEW_SHARE),
    )
  }, [])

  /** 처음 열었을 때의 배율 — 시안 한 장(FRAME)이 화면을 꽉 채운다 */
  const home = useCallback(() => {
    const el = boxRef.current
    if (!el) return cover()
    return Math.max(cover(), el.clientWidth / (FRAME.x1 - FRAME.x0), el.clientHeight / (FRAME.y1 - FRAME.y0))
  }, [cover])

  const clamp = useCallback((c: Camera): Camera => {
    const el = boxRef.current
    if (!el) return c
    const vw = el.clientWidth
    const vh = el.clientHeight
    const ww = WORLD.w * c.scale
    const wh = WORLD.h * c.scale
    // 끝까지 줄였으면 마우스 자리와 상관없이 마을을 정중앙에 둔다
    if (c.scale <= cover() * 1.001) {
      c.tx = (vw - ww) / 2
      c.ty = (vh - wh) / 2
      return c
    }
    c.tx = ww < vw ? (vw - ww) / 2 : Math.min(0, Math.max(vw - ww, c.tx))
    c.ty = wh < vh ? (vh - wh) / 2 : Math.min(0, Math.max(vh - wh, c.ty))
    return c
  }, [cover])

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
    const s = home()
    camRef.current = clamp({
      scale: s,
      tx: el.clientWidth / 2 - CENTER.x * s,
      ty: el.clientHeight / 2 - CENTER.y * s,
    })
    apply()
    // 창 크기가 바뀌면 다시 덮을 만큼 당긴다.
    // 배율만 바꾸면 왼쪽 위를 기준으로 커져서 마을이 한쪽으로 쏠리므로,
    // 바뀌기 전 화면 한가운데 있던 곳을 바뀐 뒤에도 한가운데 둔다
    let vw = el.clientWidth
    let vh = el.clientHeight
    const onResize = () => {
      const c = camRef.current
      const wx = (vw / 2 - c.tx) / c.scale
      const wy = (vh / 2 - c.ty) / c.scale
      vw = el.clientWidth
      vh = el.clientHeight
      const s = Math.max(c.scale, cover())
      camRef.current = clamp({ scale: s, tx: vw / 2 - wx * s, ty: vh / 2 - wy * s })
      apply()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [apply, clamp, cover, home])

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
    // 누르자마자 마우스를 붙잡으면 모이모·오브제 클릭이 마을에 먹혀 버린다.
    // 실제로 끌기 시작했을 때만 붙잡는다 (onPointerMove)
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (lens) {
      const rect = boxRef.current!.getBoundingClientRect()
      pointer.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      peek()
    }
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
    if (!d.moved) {
      // 조금 흔들린 것은 클릭으로 본다. 이만큼 움직여야 끌기다
      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 5) return
      d.moved = true
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
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
      if (drag.current.moved) {
        dragged.current = true
        window.setTimeout(() => { dragged.current = false }, 0)
      }
      drag.current = null
    }
  }

  /**
   * 소품과 모이모를 같은 위계로 세운다.
   * 발치가 위에 있는 것부터 그려서 앞뒤가 자연스럽게 겹쳐 보인다.
   */
  const stage = useMemo(() => {
    const rows: ({ foot: number } & ({ kind: 'moimo'; r: Resident } | { kind: 'prop'; p: (typeof PROPS)[number] }))[] = [
      ...residents.map((r) => ({ foot: r.y, kind: 'moimo' as const, r })),
      ...PROPS.map((p) => ({ foot: p.y + p.w / 2, kind: 'prop' as const, p })),
    ]
    return rows.sort((a, b) => a.foot - b.foot)
  }, [residents])


  return (
    <div
      ref={boxRef}
      className={`world-box${lens ? ' holding-lens' : ''}`}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
    >
      <div ref={worldRef} className={`world${glide ? ' glide' : ''}`} style={{ width: WORLD.w, height: WORLD.h }}>

        {DECOR.map((d) => (
          <div key={d.src} className="decor" style={placeStyle(d, art[d.src])}>
            <Shadow />
            {art[d.src] && <img className="item-art" src={art[d.src].url} alt="" draggable={false} />}
          </div>
        ))}

        {ITEMS.map((it) => (
          <button
            key={it.id}
            className={`item${lens && it.id === 'glass' ? ' lifted' : ''}`}
            style={placeStyle(it, art[it.src])}
            onClick={() => { if (!dragged.current) onItem(it.id) }}
          >
            <Shadow />
            <ItemImage art={art[it.src]} />
            <span className="item-label">
              <b>{it.name}</b>
              <i>{it.tag}</i>
            </span>
          </button>
        ))}

        {GUIDES.map((g) => (
          <div key={g.src} className="guide" style={placeStyle(g, art[g.src])}>
            <Shadow />
            {art[g.src] && <img className="item-art" src={art[g.src].url} alt="" draggable={false} />}
          </div>
        ))}

        {stage.map((s) => {
          if (s.kind === 'prop') return <Prop key={s.p.id} prop={s.p} art={art[PROP_KINDS[s.p.kind].src]} />
          const r = s.r
          const dim = hits ? !hits.has(r.id) : false
          return (
            <button
              key={r.id}
              className={`moimo${r.id === arrivedId ? ' arrive' : ''}${r.mine ? ' mine' : ''}${dim ? ' dim' : ''}`}
              style={{
                left: r.x,
                top: r.y,
                transform: 'translate(-50%, -100%)',
              }}
              onClick={() => { if (!dragged.current) onResident(r) }}
            >
              <Shadow />
              <MoimoImg resident={r} cache={cache} table={table} />
              {(showNames || (hits && hits.has(r.id)) || (lens && underLens.has(r.id))) && (
                <span className="moimo-name">
                  {r.name}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {lens && (
        <div className="lens" ref={lensRef} style={{ width: LENS.w, height: LENS.w * LENS.ratio }}>
          {art['/items/glass.svg'] && <img src={art['/items/glass.svg'].url} alt="" draggable={false} />}
        </div>
      )}
    </div>
  )
})

