/**
 * 오브제 그림의 외곽선을 잰다 — 모이모 발이 그림 위에 올라타지 않게.
 *
 * 그림을 작은 캔버스에 한 번 그려 보고, 세로줄마다 칠해진 맨 위와 맨 아래를
 * 찾는다. 그 사이에 발을 디디면 그림 위에 올라탄 것처럼 떠 보이므로 막는다.
 * 그림 밖, 특히 그림 아래 바닥 쪽은 디딜 수 있다 — 모이모가 오브제 앞에
 * 서서 아랫부분을 가리는 것은 괜찮다.
 *
 * 그림 파일을 바꿔도 다시 잴 필요가 없다. 열 때마다 새로 잰다.
 */

/** 세로줄마다 [맨 위, 맨 아래] — 그림 네모 높이를 0~1 로 본 값. 빈 줄은 null */
export type Footprint = ([number, number] | null)[]

/** 세로줄 수 */
const COLS = 96

/** 여백을 잘라낸 svg 와 그 세로/가로 비 — tight.ts 와 같은 방식으로 자른다 */
function tighten(text: string, host: HTMLElement): { svg: string; ratio: number } | null {
  host.innerHTML = text
  const svg = host.querySelector('svg')
  if (!svg) return null
  svg.setAttribute('width', '500')
  svg.setAttribute('height', '500')
  const b = (svg as SVGSVGElement).getBBox()
  if (!b.width || !b.height) return null
  const pad = Math.max(b.width, b.height) * 0.02
  const w = b.width + pad * 2
  const h = b.height + pad * 2
  svg.setAttribute('viewBox', `${b.x - pad} ${b.y - pad} ${w} ${h}`)
  svg.setAttribute('width', String(COLS))
  svg.setAttribute('height', String(Math.round((COLS * h) / w)))
  return { svg: svg.outerHTML, ratio: h / w }
}

async function measure(src: string, host: HTMLElement): Promise<Footprint | null> {
  const res = await fetch(src)
  if (!res.ok) return null
  const t = tighten(await res.text(), host)
  if (!t) return null
  const W = COLS
  const H = Math.round(W * t.ratio)
  const img = new Image()
  img.src = URL.createObjectURL(new Blob([t.svg], { type: 'image/svg+xml' }))
  try { await img.decode() } finally { URL.revokeObjectURL(img.src) }
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, W, H)
  const data = ctx.getImageData(0, 0, W, H).data
  const cols: Footprint = []
  for (let x = 0; x < W; x++) {
    let top = -1
    let bottom = -1
    for (let y = 0; y < H; y++) {
      if (data[(y * W + x) * 4 + 3] > 40) {
        if (top < 0) top = y
        bottom = y
      }
    }
    cols.push(top < 0 ? null : [top / H, (bottom + 1) / H])
  }
  return cols
}

/** 여러 그림을 한꺼번에 잰다. 못 잰 그림은 빠진다 */
export async function measureFootprints(srcs: readonly string[]): Promise<Record<string, Footprint>> {
  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden'
  document.body.appendChild(host)
  const out: Record<string, Footprint> = {}
  try {
    for (const src of srcs) {
      try {
        const f = await measure(src, host)
        if (f) out[src] = f
      } catch { /* 이 그림만 건너뛴다 */ }
    }
  } finally {
    host.remove()
  }
  return out
}
