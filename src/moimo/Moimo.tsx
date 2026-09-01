import { memo, useId } from 'react'
import { BODIES, COLORS, SIZE_SCALE, type Genes } from './genes'

const INK = '#3B3440'

/* --- 작은 도형 헬퍼 ------------------------------------------------- */

function starPath(cx: number, cy: number, outer: number, inner: number, points = 5, rot = -Math.PI / 2) {
  const pts: string[] = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = rot + (i * Math.PI) / points
    pts.push(`${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}`)
  }
  return `M${pts.join('L')}Z`
}

function heartPath(cx: number, cy: number, s: number) {
  return `M${cx} ${cy + s * 0.85}C${cx - s * 1.3} ${cy - s * 0.1} ${cx - s * 0.85} ${cy - s} ${cx} ${cy - s * 0.35}C${cx + s * 0.85} ${cy - s} ${cx + s * 1.3} ${cy - s * 0.1} ${cx} ${cy + s * 0.85}Z`
}

/* --- 눈 -------------------------------------------------------------- */

function Eye({ x, y, kind, flip }: { x: number; y: number; kind: number; flip: boolean }) {
  const s = flip ? -1 : 1
  const g = (children: React.ReactNode) => (
    <g transform={`translate(${x} ${y}) scale(${s} 1)`}>{children}</g>
  )
  switch (kind) {
    case 0:
      return g(<circle r={3.1} fill={INK} />)
    case 1:
      return g(<><circle r={3.7} fill={INK} /><circle cx={-1.3} cy={-1.4} r={1.35} fill="#fff" /></>)
    case 2:
      return g(<path d="M-4.2 -0.6Q0 3.4 4.2 -0.6" stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" />)
    case 3:
      return g(<path d="M-4.2 1.8Q0 -3.4 4.2 1.8" stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round" />)
    case 4:
      return g(<><ellipse rx={4.4} ry={5.3} fill={INK} /><circle cx={-1.5} cy={-2} r={1.7} fill="#fff" /><circle cx={1.3} cy={1.9} r={0.8} fill="#fff" opacity={0.75} /></>)
    case 5:
      return g(<><path d="M-3.9 0A3.9 3.9 0 0 0 3.9 0Z" fill={INK} /><path d="M-4.4 -0.2H4.4" stroke={INK} strokeWidth={1.4} strokeLinecap="round" /></>)
    case 6:
      return g(<path d={starPath(0, 0, 4.6, 1.9)} fill={INK} />)
    case 7:
      return g(<path d={heartPath(0, 0, 4)} fill="#E2557A" />)
    case 8:
      return g(<path d="M-3.4 0H3.4" stroke={INK} strokeWidth={1.7} strokeLinecap="round" />)
    case 9:
      return g(<><circle r={3.9} fill="#fff" stroke={INK} strokeWidth={1.4} /><circle cy={0.4} r={1.5} fill={INK} /></>)
    case 10:
      return g(<circle r={flip ? 4.3 : 2.3} fill={INK} />)
    default:
      return g(<path d="M-4 -2.2L3.6 1.6" stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round" />)
  }
}

/* --- 입 -------------------------------------------------------------- */

function Mouth({ x, y, kind }: { x: number; y: number; kind: number }) {
  const st = { stroke: INK, strokeWidth: 1.5, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const g = (children: React.ReactNode) => <g transform={`translate(${x} ${y})`}>{children}</g>
  switch (kind) {
    case 0: return g(<circle r={1.25} fill={INK} />)
    case 1: return g(<path d="M-4.4 -0.8Q-2.2 2.4 0 -0.8Q2.2 2.4 4.4 -0.8" {...st} />)
    case 2: return g(<path d="M-3.6 -1Q0 3 3.6 -1" {...st} />)
    case 3: return g(<ellipse rx={2.3} ry={2.8} fill={INK} />)
    case 4: return g(<path d="M-3.8 -1.8Q-1.9 1.4 0 -1Q1.9 1.4 3.8 -1.8" {...st} />)
    case 5: return g(<path d="M-3 0H3" {...st} />)
    case 6: return g(<path d="M-3.4 1.2Q0 -2 3.4 1.2" {...st} />)
    case 7: return g(<><path d="M-4.8 -1A4.8 4.8 0 0 0 4.8 -1Z" fill={INK} /><path d="M-2.6 2.1A2.7 2.7 0 0 0 2.6 2.1Z" fill="#F0839B" /></>)
    case 8: return g(<><path d="M-3.2 -0.6H3.2" {...st} /><ellipse cy={2} rx={2.1} ry={2.4} fill="#F0839B" stroke={INK} strokeWidth={1} /></>)
    default: return g(<path d="M-4 0.4Q-2 -2 0 0.4Q2 2.6 4 0.4" {...st} />)
  }
}

/* --- 볼 -------------------------------------------------------------- */

function Blush({ x, y, kind, flip }: { x: number; y: number; kind: number; flip: boolean }) {
  if (kind === 0) return null
  const s = flip ? -1 : 1
  const g = (children: React.ReactNode) => (
    <g transform={`translate(${x} ${y}) scale(${s} 1)`} opacity={0.72}>{children}</g>
  )
  if (kind === 1) return g(<ellipse rx={3.8} ry={2.7} fill="#FF97AC" />)
  if (kind === 2)
    return g(
      <g stroke="#F0778F" strokeWidth={1.2} strokeLinecap="round">
        <path d="M-2.6 1.6L-0.6 -1.6" /><path d="M0.2 1.8L2.2 -1.4" /><path d="M2.8 1.4L4.4 -1.2" />
      </g>,
    )
  return g(<path d={heartPath(0, 0, 3.1)} fill="#FF8FA8" />)
}

/* --- 머리 장식 -------------------------------------------------------- */

function Head({ x, y, kind, c }: { x: number; y: number; kind: number; c: (typeof COLORS)[number] }) {
  if (kind === 0) return null
  const g = (children: React.ReactNode) => <g transform={`translate(${x} ${y})`}>{children}</g>
  const line = { stroke: INK, strokeWidth: 1.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
  switch (kind) {
    case 1: // 새싹
      return g(<><path d="M0 2V-7" stroke="#6E9C55" strokeWidth={1.6} strokeLinecap="round" /><ellipse cx={4.4} cy={-8.4} rx={4.6} ry={2.9} transform="rotate(-24 4.4 -8.4)" fill="#9BD07B" {...line} /><ellipse cx={-3.6} cy={-5.4} rx={3.6} ry={2.3} transform="rotate(22 -3.6 -5.4)" fill="#B7E094" {...line} /></>)
    case 2: // 뿔
      return g(<><path d="M-7 1L-8.6 -8L-1.6 -2Z" fill={c.shade} {...line} /><path d="M7 1L8.6 -8L1.6 -2Z" fill={c.shade} {...line} /></>)
    case 3: // 고양이귀
      return g(<><path d="M-11 3L-12 -9L-2 -2Z" fill={c.fill} {...line} /><path d="M-9.6 1.4L-10 -5.4L-4.8 -1.8Z" fill="#FFBCCB" /><path d="M11 3L12 -9L2 -2Z" fill={c.fill} {...line} /><path d="M9.6 1.4L10 -5.4L4.8 -1.8Z" fill="#FFBCCB" /></>)
    case 4: // 토끼귀
      return g(<><ellipse cx={-5.6} cy={-9} rx={3.4} ry={9.4} transform="rotate(-11 -5.6 -9)" fill={c.fill} {...line} /><ellipse cx={5.6} cy={-9} rx={3.4} ry={9.4} transform="rotate(11 5.6 -9)" fill={c.fill} {...line} /><ellipse cx={-5.6} cy={-9.4} rx={1.5} ry={6} transform="rotate(-11 -5.6 -9.4)" fill="#FFC3D0" /><ellipse cx={5.6} cy={-9.4} rx={1.5} ry={6} transform="rotate(11 5.6 -9.4)" fill="#FFC3D0" /></>)
    case 5: // 리본
      return g(<><path d="M-2 -3L-11 -8V2L-2 -1Z" fill="#FF8FA8" {...line} /><path d="M2 -3L11 -8V2L2 -1Z" fill="#FF8FA8" {...line} /><circle cy={-2} r={2.6} fill="#FFB0C2" {...line} /></>)
    case 6: // 별
      return g(<path d={starPath(0, -7, 7.4, 3.1)} fill="#FFD966" {...line} />)
    case 7: // 안테나
      return g(<><path d="M0 2Q1.5 -4 -1 -8" stroke={INK} strokeWidth={1.4} fill="none" strokeLinecap="round" /><circle cx={-1.4} cy={-10} r={3} fill="#FFD966" {...line} /></>)
    case 8: // 왕관
      return g(<path d="M-9 1L-10 -8L-4.5 -3.6L0 -9.6L4.5 -3.6L10 -8L9 1Z" fill="#FFD66B" {...line} />)
    case 9: // 베레모
      return g(<><path d="M-10.5 0Q-11 -9 0 -9.4Q11 -9 10.5 0Q0 3 -10.5 0Z" fill="#7E6FBF" {...line} /><circle cx={0} cy={-11} r={2.4} fill="#9D8FD6" {...line} /></>)
    case 10: // 꽃
      return g(<><g fill="#FFC0D4" {...line}>{[0, 1, 2, 3, 4].map((i) => { const a = (-Math.PI / 2) + (i * 2 * Math.PI) / 5; return <ellipse key={i} cx={Math.cos(a) * 4.4} cy={-5 + Math.sin(a) * 4.4} rx={3.1} ry={3.1} /> })}</g><circle cy={-5} r={2.5} fill="#FFE08A" {...line} /></>)
    case 11: // 구름
      return g(<path d="M-9 0Q-12 -6 -6 -7Q-4 -12 2 -9Q9 -12 9 -4Q12 -2 8 0Z" fill="#EAF4FF" {...line} />)
    case 12: // 뿔하나
      return g(<path d="M-4.5 2L0 -11L4.5 2Z" fill="#FFD66B" {...line} />)
    default: // 하트
      return g(<path d={heartPath(0, -6, 7)} fill="#FF8FA8" {...line} />)
  }
}

/* --- 소품 ------------------------------------------------------------- */

function Hold({ x, y, kind }: { x: number; y: number; kind: number }) {
  if (kind === 0) return null
  const g = (children: React.ReactNode) => <g transform={`translate(${x} ${y})`}>{children}</g>
  const line = { stroke: INK, strokeWidth: 1.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
  switch (kind) {
    case 1: return g(<><path d="M0 0Q3 -8 1 -14" stroke={INK} strokeWidth={1} fill="none" /><ellipse cx={1} cy={-20} rx={6.4} ry={7.4} fill="#FF9DB0" {...line} /></>)
    case 2: return g(<><path d="M0 0L4 -9" stroke="#6E9C55" strokeWidth={1.4} strokeLinecap="round" /><ellipse cx={7} cy={-12} rx={6} ry={3.6} transform="rotate(-32 7 -12)" fill="#A7D98A" {...line} /></>)
    case 3: return g(<><path d="M-4 -8H5L4 1H-3Z" fill="#FFF6E3" {...line} /><path d="M-4 -8H5" stroke={INK} strokeWidth={1.4} /><path d="M-2.4 -6.4H3.4L2.8 -3H-1.9Z" fill="#C58B5C" /></>)
    case 4: return g(<><path d="M1 2V-9" stroke={INK} strokeWidth={1.3} strokeLinecap="round" /><path d="M1 2Q4 3 4 0" stroke={INK} strokeWidth={1.3} fill="none" /><path d="M-9 -9Q1 -19 11 -9Q6 -12 1 -9Q-4 -12 -9 -9Z" fill="#8FC7EC" {...line} /></>)
    case 5: return g(<><path d="M0 2L4 -8" stroke="#C9A46A" strokeWidth={1.5} strokeLinecap="round" /><path d={starPath(5, -13, 6.6, 2.8)} fill="#FFD966" {...line} /></>)
    case 6: return g(<><path d="M-5 -6H6L5 3H-4Z" fill="#D9A87C" {...line} /><path d="M-2 -6V-8A2.6 2.6 0 0 1 3 -8V-6" fill="none" stroke={INK} strokeWidth={1.3} /></>)
    case 7: return g(<><path d="M-6 -5L1 -7L8 -5L8 3L1 1L-6 3Z" fill="#FFF3DC" {...line} /><path d="M1 -7V1" stroke={INK} strokeWidth={1.2} /></>)
    case 8: return g(<><path d="M0 0L5 -8" stroke="#C9A46A" strokeWidth={1.3} strokeLinecap="round" /><circle cx={6} cy={-11} r={5} fill="#FF9DB0" {...line} /><path d="M2.2 -12.4Q6 -9 9.8 -10.6" stroke="#fff" strokeWidth={1.4} fill="none" /></>)
    case 9: return g(<><path d="M0 1L3 -8" stroke="#6E9C55" strokeWidth={1.4} strokeLinecap="round" /><g fill="#FFC0D4" {...line}>{[0, 1, 2, 3, 4].map((i) => { const a = (i * 2 * Math.PI) / 5; return <ellipse key={i} cx={4 + Math.cos(a) * 3.6} cy={-11 + Math.sin(a) * 3.6} rx={2.7} ry={2.7} /> })}</g><circle cx={4} cy={-11} r={2.1} fill="#FFE08A" /></>)
    case 10: return g(<><path d="M0 2V-14" stroke={INK} strokeWidth={1.4} strokeLinecap="round" /><path d="M0 -14H11L8 -10.5L11 -7H0Z" fill="#FF9DB0" {...line} /></>)
    default: return g(<><circle cx={2} cy={-6} r={7} fill="#F6C89A" {...line} /><circle cx={2} cy={-6} r={2.5} fill="#FFF6E3" {...line} /><path d="M-4 -9Q0 -13 5 -12" stroke="#F0839B" strokeWidth={2.4} fill="none" strokeLinecap="round" /></>)
  }
}

/* --- 무늬 ------------------------------------------------------------- */

function Pattern({ kind, c, gid }: { kind: number; c: (typeof COLORS)[number]; gid: string }) {
  if (kind === 0) return null
  const dots: [number, number, number][] = [
    [31, 44, 4.2], [70, 48, 3.4], [26, 68, 3.6], [74, 72, 4.4], [50, 82, 3.2], [62, 34, 2.6], [38, 78, 2.8],
  ]
  return (
    <g clipPath={`url(#${gid})`} opacity={0.92}>
      {kind === 1 && dots.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={c.shade} />)}
      {kind === 2 && [40, 52, 64, 76].map((y, i) => <rect key={i} x={0} y={y} width={100} height={5.5} fill={c.shade} />)}
      {kind === 3 && <ellipse cx={50} cy={72} rx={24} ry={19} fill="#FFFFFF" opacity={0.66} />}
      {kind === 4 && dots.slice(0, 5).map(([x, y, r], i) => <path key={i} d={heartPath(x, y, r * 1.25)} fill={c.shade} />)}
      {kind === 5 && dots.slice(0, 5).map(([x, y, r], i) => <path key={i} d={starPath(x, y, r * 1.5, r * 0.65)} fill={c.shade} />)}
      {kind === 6 && (
        <g stroke={c.shade} strokeWidth={3.4}>
          {[28, 44, 60, 76].map((v) => <path key={`h${v}`} d={`M0 ${v}H100`} />)}
          {[26, 42, 58, 74].map((v) => <path key={`v${v}`} d={`M${v} 0V100`} />)}
        </g>
      )}
      {kind === 7 && <rect x={0} y={0} width={100} height={100} fill={`url(#${gid}-grad)`} />}
    </g>
  )
}

/* --- 모이모 ----------------------------------------------------------- */

export type MoimoProps = {
  genes: Genes
  /** 픽셀 크기 (크기 유전자는 여기에 곱해진다) */
  size?: number
  /** 크기 유전자 무시 — 편집 화면처럼 항상 같은 크기로 보여야 할 때 */
  ignoreSizeGene?: boolean
  animate?: boolean
  /** 흔들림 위상 분산용 */
  phase?: number
  className?: string
  title?: string
}

export const Moimo = memo(function Moimo({
  genes, size = 120, ignoreSizeGene = false, animate = true, phase = 0, className, title,
}: MoimoProps) {
  const uid = useId().replace(/:/g, '')
  const gid = `mo-${uid}`
  const b = BODIES[genes.body]
  const c = COLORS[genes.color]
  const px = size * (ignoreSizeGene ? 1 : SIZE_SCALE[genes.size])
  const [fx, fy] = b.face
  const [tx, ty] = b.top
  const [hx, hy] = b.hand

  return (
    <svg
      className={className}
      width={px}
      height={px}
      viewBox="0 0 100 108"
      overflow="visible"
      role="img"
      aria-label={title ?? '모이모'}
      style={animate ? { animation: `moimo-bob 2.6s ease-in-out ${(phase % 1) * -2.6}s infinite` } : undefined}
    >
      <defs>
        <clipPath id={gid}><path d={b.path} /></clipPath>
        <linearGradient id={`${gid}-grad`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor={c.shade} stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* 그림자 */}
      <ellipse cx={50} cy={b.footY + 8} rx={22} ry={4.6} fill="#000" opacity={0.09} />

      {/* 발 */}
      <ellipse cx={40} cy={b.footY + 2} rx={6.2} ry={4} fill={c.fill} stroke={c.line} strokeWidth={1.6} />
      <ellipse cx={60} cy={b.footY + 2} rx={6.2} ry={4} fill={c.fill} stroke={c.line} strokeWidth={1.6} />

      {/* 몸 */}
      <path d={b.path} fill={c.fill} stroke={c.line} strokeWidth={2} strokeLinejoin="round" />
      <Pattern kind={genes.pattern} c={c} gid={gid} />
      <path d={b.path} fill="none" stroke={c.line} strokeWidth={2} strokeLinejoin="round" />

      {/* 얼굴 */}
      <Blush x={fx - 15.5} y={fy + 5.5} kind={genes.blush} flip={false} />
      <Blush x={fx + 15.5} y={fy + 5.5} kind={genes.blush} flip />
      <Eye x={fx - 10.5} y={fy} kind={genes.eyes} flip={false} />
      <Eye x={fx + 10.5} y={fy} kind={genes.eyes} flip />
      <Mouth x={fx} y={fy + 10} kind={genes.mouth} />

      <Head x={tx} y={ty} kind={genes.head} c={c} />
      <Hold x={hx} y={hy} kind={genes.hold} />
    </svg>
  )
})
