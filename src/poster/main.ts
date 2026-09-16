/**
 * 포스터 미리보기 — /poster.html
 *
 * 주소 뒤에 값을 붙여 바로 바꿔 볼 수 있다.
 *   /poster.html?count=160&seed=12&width=420&height=594&title=0
 *
 * 내보내기 스크립트(scripts/export-poster.mjs)도 이 화면을 그대로 읽어
 * 인쇄용 파일을 만든다. 눈으로 본 것과 나오는 것이 같다.
 */

import { loadParts } from '../moimo/compose'
import { normalizeTable } from '../moimo/parts'
import anchorsJson from '../data/anchors.json'
import { buildPoster, DEFAULTS, type PosterOpts } from './poster'

const q = new URLSearchParams(location.search)
const num = (k: keyof PosterOpts, d: number) => {
  const v = Number(q.get(k as string))
  return Number.isFinite(v) && q.has(k as string) ? v : d
}

/** 제목 그림은 파일 주소가 아니라 그림 자체를 심는다 — SVG 한 장만 들고 다녀도 깨지지 않는다 */
async function logoDataUri(): Promise<string | undefined> {
  try {
    const res = await fetch('/world/logo.png')
    if (!res.ok) return undefined
    const buf = new Uint8Array(await res.arrayBuffer())
    let bin = ''
    for (const b of buf) bin += String.fromCharCode(b)
    return `data:image/png;base64,${btoa(bin)}`
  } catch {
    return undefined
  }
}

async function main() {
  const [cache, logo] = await Promise.all([loadParts(), logoDataUri()])
  const table = normalizeTable(anchorsJson)

  const opts: Partial<PosterOpts> = {
    seed: num('seed', DEFAULTS.seed),
    count: num('count', DEFAULTS.count),
    width: num('width', DEFAULTS.width),
    height: num('height', DEFAULTS.height),
    bleed: num('bleed', DEFAULTS.bleed),
    tilt: num('tilt', DEFAULTS.tilt),
    overlap: num('overlap', DEFAULTS.overlap),
    rowFactor: num('rowFactor', DEFAULTS.rowFactor),
    spread: num('spread', DEFAULTS.spread),
    artSize: num('artSize', DEFAULTS.artSize),
    title: q.get('title') !== '0',
    titleWidth: num('titleWidth', DEFAULTS.titleWidth),
    background: q.get('background') ?? DEFAULTS.background,
    logo,
  }

  const { svg, placed } = buildPoster(cache, table, opts)

  const stage = document.getElementById('stage')!
  stage.innerHTML = svg
  // 미리보기에서는 화면 폭에 맞춰 줄여 본다 (mm 는 내보낼 때만 쓴다)
  const el = stage.firstElementChild as SVGSVGElement
  el.removeAttribute('width')
  el.removeAttribute('height')

  const info = document.getElementById('info')
  if (info) info.textContent = `${placed}마리 · ${opts.width}×${opts.height}mm · seed ${opts.seed}`

  Object.assign(window as unknown as Record<string, unknown>, {
    __posterSVG: svg,
    __posterCount: placed,
    __posterReady: true,
  })
}

main().catch((err) => {
  document.body.innerHTML = `<pre style="padding:24px;white-space:pre-wrap">${String(err?.stack ?? err)}</pre>`
})
