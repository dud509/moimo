/**
 * 모이모 포스터 — 조합된 모이모 수백 마리를 한 장에 모아 붙인다.
 *
 * 앱과 같은 `composeMoimo` 를 쓰므로 화면에 뜨는 모이모와 포스터의 모이모가
 * 다를 일이 없다. 좌표 단위는 밀리미터다. 인쇄소에 넘길 때 크기를 재지 않아도
 * 되도록 바깥 <svg> 에 mm 를 그대로 적는다.
 */

import { composeMoimo, type PartsCache } from '../moimo/compose'
import { type AnchorTable } from '../moimo/parts'
import { encodeGenes, SLOT_SIZES, type MoimoGenes } from '../moimo/name'

export type PosterOpts = {
  /** 같은 씨앗은 언제나 같은 포스터가 된다 */
  seed: number
  /** 모이모 마리 수. 크기는 여기에 맞춰 저절로 정해진다 */
  count: number
  /** 종이 크기 (mm) */
  width: number
  height: number
  /** 재단선 바깥으로 흘려보낼 여유 (mm) — 가장자리 모이모가 잘려 나가며 꽉 찬 느낌을 준다 */
  bleed: number
  /** 기울이는 최대 각도 */
  tilt: number
  /** 가로로 겹치는 정도 0~1 */
  overlap: number
  /** 줄 간격 배수 — 작을수록 위아래로 빽빽해진다 */
  rowFactor: number
  /** 크기 들쭉날쭉한 정도 0~1 */
  spread: number
  /**
   * 512 캔버스 안에서 그림이 실제로 차지하는 네모.
   *
   * 파츠는 512 칸 한가운데에 여백을 크게 두고 그려져 있다. 캔버스째로 놓으면
   * 모이모 사이가 허전해지므로, 그림이 실제로 든 만큼만 자리로 친다.
   * (파츠 200벌을 실측한 값)
   */
  artCx: number
  artCy: number
  artSize: number
  /** 제목 자리를 비울지 */
  title: boolean
  /** 제목 그림 (data URI). 없으면 자리만 비운다 */
  logo?: string
  /** 제목 그림이 차지할 폭 비율 */
  titleWidth: number
  background: string
}

export const DEFAULTS: PosterOpts = {
  seed: 11,
  count: 150,
  width: 420,   // A2 세로
  height: 594,
  bleed: 6,
  tilt: 7,
  overlap: 0.22,
  rowFactor: 0.6,
  spread: 0.3,
  artCx: 256,
  artCy: 240,
  artSize: 350,
  title: true,
  titleWidth: 0.52,
  background: '#FFFFFF',
}

/** 씨앗 하나로 같은 수열을 다시 뽑는 난수 */
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * 겹치지 않는 유전자를 count 벌 뽑는다.
 *
 * 몸통 색은 성이 정하는 값이라 무작위로 두면 한 색이 몰린다. 여섯 색을
 * 돌아가며 박아 포스터 전체에 색이 고르게 퍼지게 한다.
 */
export function genePool(count: number, rnd: () => number): MoimoGenes[] {
  const seen = new Set<string>()
  const out: MoimoGenes[] = []
  const d = (n: number) => 1 + Math.floor(rnd() * n)
  let guard = count * 40

  while (out.length < count && guard-- > 0) {
    const g: MoimoGenes = {
      body: d(SLOT_SIZES.body),
      color: (out.length % SLOT_SIZES.color) + 1,
      morph: Math.floor(rnd() * SLOT_SIZES.morph), // 0 = 무늬 없음
      eye: d(SLOT_SIZES.eye),
      mouth: d(SLOT_SIZES.mouth),
      cheek: d(SLOT_SIZES.cheek),
      hair: d(SLOT_SIZES.hair),
      tail: d(SLOT_SIZES.tail),
      deco: d(SLOT_SIZES.deco),
    }
    const key = encodeGenes(g)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(g)
  }
  return out
}

export type Spot = { x: number; y: number; size: number; tilt: number }

/**
 * 줄을 지어 놓되 줄마다 흔들어 격자처럼 보이지 않게 한다.
 *
 * 한 마리가 차지할 넓이에서 크기를 거꾸로 구한다. 마리 수만 바꿔도
 * 종이가 고르게 차는 것은 이 때문이다.
 */
export function layout(o: PosterOpts, rnd: () => number): Spot[] {
  const W = o.width + o.bleed * 2
  const H = o.height + o.bleed * 2
  // 마리 수에서 몸집을 거꾸로 구한다.
  // 한 마리가 차지하는 칸은 가로로 (1-overlap), 세로로 rowFactor 만큼 줄어든 넓이다.
  const dense = (1 - o.overlap) * o.rowFactor
  const avg = Math.sqrt((W * H) / (Math.max(1, o.count) * dense))
  const min = avg * (1 - o.spread)
  const max = avg * (1 + o.spread)

  // 제목이 앉을 자리 — 여기 겹치는 모이모는 건너뛴다
  const tw = o.width * o.titleWidth
  const th = o.height * 0.13
  const box = {
    x0: o.bleed + (o.width - tw) / 2,
    x1: o.bleed + (o.width + tw) / 2,
    y0: o.bleed + o.height * 0.035,
    y1: o.bleed + o.height * 0.035 + th,
  }
  const blocked = (x: number, y: number, s: number) =>
    o.title &&
    x + s * 0.34 > box.x0 && x - s * 0.34 < box.x1 &&
    y + s * 0.34 > box.y0 && y - s * 0.34 < box.y1

  const pitch = avg * o.rowFactor
  const spots: Spot[] = []

  for (let y = pitch * 0.5; y < H + pitch * 0.4 && spots.length < o.count; y += pitch) {
    let x = -avg * rnd() * 0.5
    while (x < W + avg * 0.4 && spots.length < o.count) {
      const size = min + (max - min) * rnd()
      const cx = x + size / 2
      const cy = y + (rnd() - 0.5) * pitch * 0.5
      if (!blocked(cx, cy, size)) {
        spots.push({ x: cx, y: cy, size, tilt: (rnd() * 2 - 1) * o.tilt })
      }
      x += size * (1 - o.overlap * (0.6 + rnd() * 0.8))
    }
  }
  return spots
}

/** 바깥 <svg> 껍데기를 벗겨 안쪽만 남긴다 */
const inner = (svg: string) =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/i, '').replace(/<\/svg>\s*$/i, '')

export type Poster = { svg: string; placed: number }

export function buildPoster(cache: PartsCache, table: AnchorTable, opt: Partial<PosterOpts> = {}): Poster {
  const o = { ...DEFAULTS, ...opt }
  const rnd = rng(o.seed)
  const spots = layout(o, rnd)
  const pool = genePool(spots.length, rnd)

  const W = o.width + o.bleed * 2
  const H = o.height + o.bleed * 2

  const body = spots.map((p, i) => {
    const g = pool[i % pool.length]
    const art = inner(composeMoimo(g, cache, table))
    // 캔버스가 아니라 그림이 든 네모를 자리에 맞춘다
    const k = p.size / o.artSize
    const tx = p.x - o.artCx * k
    const ty = p.y - o.artCy * k
    // 회전은 제자리에서 — 줄이 흐트러지지 않는다
    return (
      `<g transform="rotate(${p.tilt.toFixed(2)} ${p.x.toFixed(2)} ${p.y.toFixed(2)}) ` +
      `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k.toFixed(5)})">` +
      art +
      `</g>`
    )
  })

  const tw = o.width * o.titleWidth
  const logo =
    o.title && o.logo
      ? `<image href="${o.logo}" x="${(o.bleed + (o.width - tw) / 2).toFixed(2)}" ` +
        `y="${(o.bleed + o.height * 0.035).toFixed(2)}" width="${tw.toFixed(2)}" ` +
        `height="${(o.height * 0.13).toFixed(2)}" preserveAspectRatio="xMidYMid meet"/>`
      : ''

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${W}mm" height="${H}mm" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" fill="${o.background}"/>` +
    body.join('') +
    logo +
    `</svg>`

  return { svg, placed: spots.length }
}
