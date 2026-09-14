/**
 * 유전자 한 벌을 SVG 한 장으로 조립한다.
 *
 * 파츠 파일을 통째로 이어 붙이는 대신 바깥 <svg> 껍데기만 벗겨서 <g> 로 감싼다.
 * 모든 파츠가 같은 512 캔버스에 그려져 있어 좌표가 그대로 맞는다.
 */

import {
  BODY_COLORS, CANVAS, SLOTS, Z_BODY, Z_MORPH,
  bodyUrl, composeAnchor, fillFor, isSvgText, lineFor, morphUrls, partUrl, prepareSvg, syOf,
  type AnchorTable, type SlotKey,
} from './parts'
import type { MoimoGenes } from './name'

export type PartsCache = Map<string, string>

/** 바깥 <svg> 껍데기와 XML 선언을 벗긴다 */
function innards(svg: string): string {
  return svg
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/^[\s\S]*?<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
}

const C = CANVAS / 2

function layer(inner: string, a: ReturnType<typeof composeAnchor>, uid: string): string {
  const t = `translate(${C + a.x} ${C + a.y}) rotate(${a.r}) scale(${a.s} ${syOf(a)}) translate(${-C} ${-C})`
  const spread = a.spread ?? 0
  if (!spread) return `<g transform="${t}">${inner}</g>`
  // 좌우로 벌려야 하는 파츠는 한가운데서 갈라 양쪽을 따로 민다
  return (
    `<g transform="${t}">` +
    `<g clip-path="url(#half-l-${uid})" transform="translate(${-spread} 0)">${inner}</g>` +
    `<g clip-path="url(#half-r-${uid})" transform="translate(${spread} 0)">${inner}</g>` +
    `</g>`
  )
}

/** 유전자 → SVG 문자열 한 장 */
export function composeMoimo(
  genes: MoimoGenes,
  cache: PartsCache,
  table: AnchorTable,
): string {
  const color = BODY_COLORS[genes.color - 1] ?? BODY_COLORS[0]
  const line = lineFor(color)
  const uid = `m${genes.body}${genes.color}${genes.morph}${genes.eye}${genes.mouth}${genes.cheek}${genes.hair}${genes.tail}${genes.deco}`

  const pieces: { z: number; svg: string }[] = []

  const push = (z: number, url: string, fill: string, anchor: ReturnType<typeof composeAnchor>) => {
    const raw = cache.get(url)
    if (!raw) return
    pieces.push({
      z,
      svg: layer(innards(prepareSvg(raw, { fill, line, accent: color.accent }, uid + z)), anchor, uid),
    })
  }

  const flat = { x: 0, y: 0, s: 1, r: 0 }

  push(Z_BODY, bodyUrl(genes.body), color.hex, flat)

  if (genes.morph > 0) {
    const url = morphUrls(genes.body, genes.morph).find((u) => cache.has(u))
    if (url) push(Z_MORPH, url, color.hex, flat)
  }

  for (const s of SLOTS) {
    const n = genes[s.key as keyof MoimoGenes] as number
    push(
      s.z,
      partUrl(s.key as SlotKey, n),
      fillFor(s.key as SlotKey, n, color.hex),
      composeAnchor(table, genes.body, s.key as SlotKey, n),
    )
  }

  pieces.sort((a, b) => a.z - b.z)

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}">` +
    `<defs>` +
    `<clipPath id="half-l-${uid}"><rect x="0" y="0" width="${C}" height="${CANVAS}"/></clipPath>` +
    `<clipPath id="half-r-${uid}"><rect x="${C}" y="0" width="${C}" height="${CANVAS}"/></clipPath>` +
    `</defs>` +
    pieces.map((p) => p.svg).join('') +
    `</svg>`
  )
}

/** 한 장을 <img> 에 바로 물릴 수 있는 주소로 */
export function moimoDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/* ------------------------------------------------------------------ */
/* 파츠 파일 미리 받아두기                                              */
/* ------------------------------------------------------------------ */

const COUNTS: Record<string, number> = Object.fromEntries(SLOTS.map((s) => [s.key, s.count]))

/** 마을에 모이모가 수백 마리 나오므로, 파츠 파일은 시작할 때 한 번만 받는다 */
export async function loadParts(): Promise<PartsCache> {
  const urls: string[] = []
  for (let i = 1; i <= 12; i++) urls.push(bodyUrl(i))
  for (const s of SLOTS) {
    for (let i = 1; i <= COUNTS[s.key]; i++) urls.push(partUrl(s.key as SlotKey, i))
  }
  for (let b = 1; b <= 12; b++) {
    for (let m = 1; m <= 5; m++) urls.push(...morphUrls(b, m))
  }

  const cache: PartsCache = new Map()
  await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url)
        if (!res.ok) return
        const text = await res.text()
        if (isSvgText(text)) cache.set(url, text)
      } catch {
        /* 없는 파츠는 그냥 건너뛴다 */
      }
    }),
  )
  return cache
}
