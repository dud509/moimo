/**
 * 유전자 한 벌을 SVG 한 장으로 조립한다.
 *
 * 파츠 파일을 통째로 이어 붙이는 대신 바깥 <svg> 껍데기만 벗겨서 <g> 로 감싼다.
 * 모든 파츠가 같은 512 캔버스에 그려져 있어 좌표가 그대로 맞는다.
 */

import {
  BODY_COLORS, CANVAS, MARKS, REGION_MORPH, SLOTS, Z_BODY, Z_MORPH,
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

/** 이 몸통에 그 부위 표시가 실제로 있는가 */
function split_has(bodyRaw: string | undefined, r: { 부위: keyof typeof MARKS }): boolean {
  return Boolean(bodyRaw && MARKS[r.부위].test(bodyRaw))
}

/**
 * 몸통 파일에서 채워진 영역만 골라 무늬를 가둘 테두리로 삼는다.
 *
 * 무늬 한 장을 열두 몸통이 같이 쓰게 하려는 것이다. 넉넉하게 그린 도형을
 * 그 몸통의 실루엣으로 잘라내면, 같은 그림이 몸통마다 제 모양을 얻는다.
 */
function splitBody(svg: string) {
  const fills: string[] = []
  const lines: string[] = []
  const marks: Partial<Record<keyof typeof MARKS, string[]>> = {}
  const re = /<(path|polyline|polygon|circle|ellipse|rect|line)\b[^>]*\/>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(svg))) {
    const tag = m[0]
    if (/fill="none"/i.test(tag)) { lines.push(tag); continue }
    fills.push(tag)
    for (const part of Object.keys(MARKS) as (keyof typeof MARKS)[]) {
      if (MARKS[part].test(tag)) (marks[part] ??= []).push(tag)
    }
  }
  return { fills: fills.join(''), lines: lines.join(''), marks }
}

function silhouette(bodySvg: string): string {
  const out: string[] = []
  const re = /<(path|circle|ellipse|rect|polygon)\b[^>]*\/>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(bodySvg))) {
    const tag = m[0]
    if (!/fill="(#fff|#ffffff|white|lime|aqua|cyan|#0f0|#00ff00|#0ff|#00ffff)"/i.test(tag)) continue
    out.push(tag.replace(/\s(fill|stroke|stroke-[a-z]+|opacity)="[^"]*"/gi, ''))
  }
  return out.join('')
}

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
  const paint = (raw: string, z: number) =>
    prepareSvg(raw, { fill: color.hex, line, accent: color.accent }, `${uid}${z}`)

  const bodyRaw = cache.get(bodyUrl(genes.body))
  const morphUrl = genes.morph > 0
    ? morphUrls(genes.body, genes.morph).find((u) => cache.has(u))
    : undefined
  const morphRaw = morphUrl ? cache.get(morphUrl) : undefined

  // 무늬가 있으면 몸통을 면과 선으로 갈라 그 사이에 끼운다.
  // 통째로 얹으면 무늬가 몸통의 안쪽 선까지 덮어 버린다.
  // 그림 대신 몸통에 표시해 둔 부위를 칠하는 무늬인가
  const regions = (REGION_MORPH[genes.morph] ?? []).filter((r) => split_has(bodyRaw, r))
  const split = bodyRaw ? splitBody(bodyRaw) : null

  if (split && split.lines && (morphRaw || regions.length)) {
    // 몸통을 면과 선으로 갈라 무늬를 그 사이에 끼운다.
    // 통째로 얹으면 무늬가 몸통의 안쪽 선까지 덮어 버린다.
    pieces.push({ z: Z_BODY, svg: paint(split.fills, Z_BODY) })

    // 무늬 파일은 표시와 별개로 늘 함께 그린다. 무늬 파일 안에서는
    // 마젠타와 형광 초록이 모두 강조색이 된다
    if (morphRaw) {
      const sil = silhouette(bodyRaw!)
      const inner = innards(prepareSvg(morphRaw, { fill: color.hex, line, accent: color.accent, mark: color.accent }, `${uid}${Z_MORPH}`))
      pieces.push({
        z: Z_MORPH,
        svg: sil
          ? `<defs><clipPath id="skin-${uid}">${sil}</clipPath></defs>` +
            `<g clip-path="url(#skin-${uid})">${inner}</g>`
          : inner,
      })
    }

    // 칠할 부위를 한 겹 더 얹는다. 몸통 파일에서 머리 아래 깔려 있어도 위로 올라온다
    regions.forEach((r, i) => {
      const tags = (split.marks[r.부위] ?? []).join('')
      if (!tags) return
      const lit = prepareSvg(tags, { fill: color.hex, line, accent: color.accent, mark: color.accent }, `${uid}r${i}`)
      const half = r.쪽 === '왼' ? 'half-l' : r.쪽 === '오' ? 'half-r' : ''
      pieces.push({ z: Z_MORPH + 0.25, svg: half ? `<g clip-path="url(#${half}-${uid})">${lit}</g>` : lit })
    })

    pieces.push({ z: Z_MORPH + 0.5, svg: paint(split.lines, Z_MORPH + 0.5) })
  } else {
    push(Z_BODY, bodyUrl(genes.body), color.hex, flat)
    if (morphUrl) push(Z_MORPH, morphUrl, color.hex, flat)
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
