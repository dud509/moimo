// 임시 — A1 와글와글 포스터 만들기 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { loadParts, type PartsCache } from '../moimo/compose'
import { normalizeTable, type AnchorTable } from '../moimo/parts'
import { genesFromName, randomKoreanName, type MoimoGenes } from '../moimo/name'
import { goodsSvg } from '../moimo/exportSvg'

const W = 594, H = 841            // A1 (mm)
const UNIT = 0.26                 // 캔버스 1 = 0.26mm → 512 칸이 약 133mm
const Q = new URLSearchParams(location.search)
const LOGO_W = Number(Q.get('logo') ?? 105)    // 로고 폭(mm)
const LOGO_Y = Number(Q.get('ly') ?? 52)       // 로고 가운데 높이(mm)
const HALO = Number(Q.get('halo') ?? 0)        // 로고 흰 테두리 두께(로고 좌표) — 0 이면 없음
const DX = 68, DY = 55            // 벌집 칸 간격(mm) — 크기보다 촘촘해서 서로 겹친다

type Placed = { svg: string; vb: number[]; x: number; y: number; s: number; r: number }

const rng = (seed: number) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647) }

// 로고 둘레 비운 자리 — 로고 네모에서 이만큼(mm) 안쪽으로는 캐릭터 가운데를 두지 않는다
const LOGO_CLEAR = Number(Q.get('clear') ?? 0)
// 로고 네모에서 이만큼(mm) 떨어진 데까지는 캐릭터 그림이 들어오지 않게
const LOGO_PAD = Number(Q.get('pad') ?? 6)
const inHole = (x: number, y: number) => {
  const lh = LOGO_W * 0.53, x0 = (W - LOGO_W) / 2, y0 = LOGO_Y - lh / 2
  const dx = Math.max(x0 - x, 0, x - (x0 + LOGO_W)), dy = Math.max(y0 - y, 0, y - (y0 + lh))
  return Math.hypot(dx, dy) < LOGO_CLEAR
}

async function build(seed: number, cache: PartsCache, table: AnchorTable, onStep: (t: string) => void) {
  const rnd = rng(seed)
  // 이름 → 유전자, 똑같은 얼굴은 빼고
  const pool: MoimoGenes[] = []; const seen = new Set<string>()
  for (let i = 0; pool.length < 900 && i < 20000; i++) {
    const g = genesFromName(randomKoreanName(rnd)); if (!g) continue
    const k = JSON.stringify(g); if (seen.has(k)) continue; seen.add(k); pool.push(g)
  }
  // 크기는 모두 같게 · 벌집 칸마다 한 마리씩 채워 빈 데가 없게
  const S = UNIT
  const cells: { x: number; y: number }[] = []
  for (let row = 0, y = 0; y < H + DY; row++, y += DY)
    for (let x = (row % 2 ? DX / 2 : 0) - DX / 2; x < W + DX; x += DX) {
      const cx = x + (rnd() - 0.5) * DX * 0.18, cy = y + (rnd() - 0.5) * DY * 0.18
      if (!inHole(cx, cy)) cells.push({ x: cx, y: cy })
    }
  const placed: (Placed & { g: MoimoGenes })[] = []
  const left = pool.slice()
  for (const c of cells) {
    onStep(`그리는 중 ${placed.length}/${cells.length}`)
    // 이웃과 색·몸통이 겹치지 않는 애를 먼저, 로고 곁이면 로고에 안 닿는 애로
    const near = placed.filter((p) => Math.hypot(p.x - c.x, p.y - c.y) < DX * 1.3)
    const okNear = (g: MoimoGenes) => !near.some((p) => p.g.color === g.color || p.g.body === g.body)
    const order = [...left.keys()].sort((i, j) => Number(okNear(left[j])) - Number(okNear(left[i])))
    const lh = LOGO_W * 0.53, lx0 = (W - LOGO_W) / 2 - LOGO_PAD, ly0 = LOGO_Y - lh / 2 - LOGO_PAD
    const lx1 = lx0 + LOGO_W + 2 * LOGO_PAD, ly1 = ly0 + lh + 2 * LOGO_PAD
    const nearLogo = c.x > lx0 - 90 && c.x < lx1 + 90 && c.y < ly1 + 90
    let svg = '', vb: number[] = [], idx = -1
    // 로고 곁 칸은 자리를 조금씩 비켜 가며 들어갈 데를 찾는다
    const shifts = nearLogo ? [[0, 0], [0, 10], [-12, 4], [12, 4], [0, 18], [-18, 12], [18, 12], [-8, 24], [8, 24]] : [[0, 0]]
    const cache2 = new Map<number, { sv: string; v: number[] }>()
    search: for (const [sx, sy] of shifts) for (const k of order.slice(0, nearLogo ? 40 : 1)) {
      let hitc = cache2.get(k)
      if (!hitc) { const sv = await goodsSvg(left[k], 'p' + placed.length, cache, table); hitc = { sv, v: sv.match(/viewBox="([^"]+)"/)![1].split(/[\s,]+/).map(Number) }; cache2.set(k, hitc) }
      const v = hitc.v, cx = c.x + sx, cy = c.y + sy
      // 그림 테두리 상자에서 둘레 12% 는 대개 비어 있어 그만큼 줄여서 잰다
      const rx = cx - (256 - v[0]) * S + v[2] * S * 0.12, ry = cy - (300 - v[1]) * S + v[3] * S * 0.12
      const rw = v[2] * S * 0.76, rh = v[3] * S * 0.76
      if (rx < lx1 && rx + rw > lx0 && ry < ly1 && ry + rh > ly0) continue
      svg = hitc.sv; vb = v; idx = k; c.x = cx; c.y = cy; break search
    }
    if (idx < 0) continue
    const g = left.splice(idx, 1)[0]
    placed.push({ svg, vb, x: c.x, y: c.y, s: S, r: 0, g })
  }
  // 아래쪽이 앞에 오게
  placed.sort((a, b) => a.y - b.y)
  const logoRaw = await (await fetch('/world/logo.svg')).text()
  const lvb = logoRaw.match(/viewBox="([^"]+)"/)![1].split(/[\s,]+/).map(Number)
  const lh = LOGO_W * lvb[3] / lvb[2]
  const logoInner = logoRaw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  // 흰 테두리: 로고를 한 번 더 깔고 모든 면·선을 흰색 굵은 선으로
  const halo = HALO > 0 ? `<g id="logo-halo" fill="#ffffff" stroke="#ffffff" stroke-width="${HALO}" stroke-linejoin="round">${logoInner.replace(/fill="[^"]*"/g, '').replace(/stroke="[^"]*"/g, '').replace(/stroke-width="[^"]*"/g, '').replace(/class="[^"]*"/g, '')}</g>` : ''
  const logo = `<g id="logo" transform="translate(${(W - LOGO_W) / 2} ${LOGO_Y - lh / 2}) scale(${LOGO_W / lvb[2]}) translate(${-lvb[0]} ${-lvb[1]})">${halo}${logoInner}</g>`
  const body = placed.map((p, i) => {
    // 몸 가운데(캔버스 256, 300)를 칸 가운데에 둔다 — 귀가 커도 몸 크기·자리는 같게
    const ox = p.x - (256 - p.vb[0]) * p.s, oy = p.y - (300 - p.vb[1]) * p.s
    const inner = p.svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
    return `<g id="moimo-${i + 1}" transform="translate(${ox.toFixed(3)} ${oy.toFixed(3)}) scale(${p.s.toFixed(5)}) translate(${-p.vb[0]} ${-p.vb[1]})">${inner}</g>`
  }).join('')
  const out = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#ffffff"/>${body}${logo}</svg>`
  return { out, n: placed.length }
}

function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  const [seed, setSeed] = useState(Number(new URLSearchParams(location.search).get('seed') ?? 11))
  const [res, setRes] = useState<{ out: string; n: number } | null>(null)
  const [msg, setMsg] = useState('')
  useEffect(() => { setRes(null); void build(seed, cache, table, setMsg).then((r) => { setRes(r); setMsg('') }) }, [seed])
  const url = useMemo(() => (res ? URL.createObjectURL(new Blob([res.out], { type: 'image/svg+xml' })) : ''), [res])
  const save = async () => {
    if (!res) return
    const r = await fetch('/__goods', { method: 'POST', body: JSON.stringify({ folder: '포스터', file: `A1_와글와글_${seed}_로고${LOGO_W}${HALO ? '_테두리' : ''}`, svg: res.out }) })
    setMsg(r.ok ? '저장했어요' : '저장 실패')
  }
  return (
    <>
      <h1>A1 포스터 · 와글와글</h1>
      <p className="hint">
        <button onClick={() => setSeed((x) => x + 1)}>다시 뽑기</button>{' '}
        <button onClick={() => { void save() }} disabled={!res}>SVG 저장</button>{' '}
        seed {seed} · {res ? `${res.n}마리` : ''} {msg}
      </p>
      {url && <img src={url} style={{ width: '100%', maxWidth: 594 * 1.2, aspectRatio: `${W} / ${H}`, background: '#fff', display: 'block' }} />}
    </>
  )
}

function App() {
  const [cache, setCache] = useState<PartsCache | null>(null)
  const table = useMemo<AnchorTable>(() => normalizeTable(anchorsJson), [])
  useEffect(() => { loadParts().then(setCache) }, [])
  return cache ? <Page cache={cache} table={table} /> : <p style={{ padding: 16 }}>불러오는 중…</p>
}

createRoot(document.getElementById('root')!).render(<App />)
