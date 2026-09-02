import { useEffect, useState } from 'react'
import { LANDMARKS, WORLD, type LandmarkId, type Resident } from '../village/world'
import type { Camera } from '../village/Village'

/* ------------------------------------------------------------------ */

export function TopBar({ count, onHelp }: { count: number; onHelp: () => void }) {
  const [shown, setShown] = useState(count)

  // 숫자가 굴러 올라가게
  useEffect(() => {
    if (shown === count) return
    let raf = 0
    const from = shown
    const start = performance.now()
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 700)
      setShown(Math.round(from + (count - from) * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [count, shown])

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">모이모</span>
        <span className="brand-sub">MOIMO WORLD</span>
      </div>
      <div className="counter">
        <span className="counter-label">지금 모여 있는 모이모</span>
        <b className="counter-num">{shown.toLocaleString('ko-KR')}</b>
        <button className="icon-btn round" onClick={onHelp} aria-label="사용 설명">?</button>
      </div>
    </header>
  )
}

/* ------------------------------------------------------------------ */

export function QuickNav({ onGo }: { onGo: (id: LandmarkId) => void }) {
  return (
    <nav className="quicknav">
      {LANDMARKS.map((l) => (
        <button key={l.id} onClick={() => onGo(l.id)}>{l.name.replace('모이모 ', '')}</button>
      ))}
    </nav>
  )
}

/* ------------------------------------------------------------------ */

const MAP_W = 176
const MAP_H = Math.round((MAP_W * WORLD.h) / WORLD.w)

export function Minimap({
  residents, camera, viewport, onJump,
}: {
  residents: Resident[]
  camera: Camera
  viewport: { w: number; h: number }
  onJump: (wx: number, wy: number) => void
}) {
  const [open, setOpen] = useState(true)
  const kx = MAP_W / WORLD.w
  const ky = MAP_H / WORLD.h

  // 화면에 보이는 영역
  const vx = (-camera.tx / camera.scale) * kx
  const vy = (-camera.ty / camera.scale) * ky
  const vw = (viewport.w / camera.scale) * kx
  const vh = (viewport.h / camera.scale) * ky

  // 너무 많으면 솎아서 그린다
  const stride = Math.max(1, Math.ceil(residents.length / 260))
  const dots = residents.filter((_, i) => i % stride === 0)

  return (
    <div className={`minimap${open ? '' : ' closed'}`}>
      <button className="minimap-toggle" onClick={() => setOpen((v) => !v)} aria-label="지도 접기">
        {open ? '◀' : '▶'}
      </button>
      <div className="minimap-body">
        <svg
          width={MAP_W}
          height={MAP_H}
          onClick={(e) => {
            const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
            onJump(((e.clientX - r.left) / MAP_W) * WORLD.w, ((e.clientY - r.top) / MAP_H) * WORLD.h)
          }}
        >
          <rect width={MAP_W} height={MAP_H} rx={8} fill="#F6ECD8" />
          {dots.map((r) => (
            <circle key={r.id} cx={r.x * kx} cy={r.y * ky} r={1.5} fill={r.mine ? '#E2557A' : '#B9A98C'} />
          ))}
          {LANDMARKS.map((l) => (
            <circle key={l.id} cx={l.x * kx} cy={l.y * ky} r={4} fill="#fff" stroke="#4A4250" strokeWidth={1.5} />
          ))}
          <rect x={vx} y={vy} width={vw} height={vh} rx={4} fill="rgba(255,255,255,.28)" stroke="#4A4250" strokeWidth={1.6} />
        </svg>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

export function Coach({ onClose }: { onClose: () => void }) {
  return (
    <div className="coach" onClick={onClose}>
      <div className="coach-inner" onClick={(e) => e.stopPropagation()}>
        <p className="eyebrow">사용 설명서</p>
        <h2>모이모 마을 둘러보기</h2>
        <ul>
          <li><span className="k">드래그</span> 마을을 XY축으로 자유롭게 이동해요</li>
          <li><span className="k">휠 · 핀치</span> 가까이 보거나 멀리서 전체를 봐요</li>
          <li><span className="k">오브제</span> 공방에서 만들고, 도감에서 전부 보고, 나무에서 조합 수를 확인해요</li>
          <li><span className="k">모이모</span> 눌러서 이름과 유전자를 확인해요</li>
        </ul>
        <p className="coach-hint">만든 모이모는 마을에 그대로 남아요. 사람이 늘수록 마을이 북적여요.</p>
        <button className="btn primary wide" onClick={onClose}>마을 둘러보기</button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

export function Toast({ text }: { text: string }) {
  return <div className="toast">{text}</div>
}
