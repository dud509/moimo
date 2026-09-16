/**
 * 유전자 한 벌을 SVG 한 장으로 조립한다.
 *
 * 파츠 파일을 통째로 이어 붙이는 대신 바깥 <svg> 껍데기만 벗겨서 <g> 로 감싼다.
 * 모든 파츠가 같은 512 캔버스에 그려져 있어 좌표가 그대로 맞는다.
 */

import {
  BODY_COLORS, CANVAS, MARKS, MORPH_BLUR, MORPH_TAIL, REGION_MORPH, SLOTS, Z_BODY, Z_MORPH, edgeFor,
  bodyUrl, composeAnchor, fillFor, isSvgText, morphUrls, partUrl, prepareSvg, syOf, toneFor,
  type AnchorTable, type SlotKey,
} from './parts'
import type { MoimoGenes } from './name'
import type { BodyColor } from './parts'

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

/** 무늬 덩어리를 두르는 선 */
const edge = (line: string, how: 'line' | 'soft' | 'flat') =>
  how === 'line'
    ? `stroke="${line}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"`
    : ''

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
  const inner: string[] = []
  const marks: Partial<Record<keyof typeof MARKS, string[]>> = {}
  const re = /<(path|polyline|polygon|circle|ellipse|rect|line)\b[^>]*\/>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(svg))) {
    const tag = m[0]
    if (/fill="none"/i.test(tag)) { lines.push(tag); continue }
    fills.push(tag)
    if (/fill="(#ff00ff|#f0f|magenta)"/i.test(tag)) inner.push(tag)
    for (const part of Object.keys(MARKS) as (keyof typeof MARKS)[]) {
      if (MARKS[part].test(tag)) (marks[part] ??= []).push(tag)
    }
  }
  return { fills: fills.join(''), inner: inner.join(''), lines: lines.join(''), marks }
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

/**
 * 몸통과 무늬를 한 벌로 쌓는다. 앵커편집기와 월드가 같은 것을 보게 하려고
 * 따로 뽑아 두었다. 층 번호를 붙여 돌려주므로 파츠 사이에 그대로 끼워 넣는다.
 */
export function bodyPieces(opts: {
  bodyRaw?: string
  morphRaw?: string
  morph: number
  color: BodyColor
  uid: string
}): { z: number; svg: string }[] {
  const { bodyRaw, morphRaw, morph, color, uid } = opts
  const { fill, line, accent, mark } = toneFor(color, morph)
  const howEdge = edgeFor(color)
  const out: { z: number; svg: string }[] = []
  const paint = (raw: string, z: number) =>
    prepareSvg(raw, { fill, line, accent }, `${uid}${z}`)

  const regions = (REGION_MORPH[morph] ?? []).filter((r) => split_has(bodyRaw, r))
  const split = bodyRaw ? splitBody(bodyRaw) : null

  // 갈라낼 선이 없는 몸통은 예전처럼 통째로 그린다
  if (!split || !split.lines || (!morphRaw && !regions.length)) {
    if (bodyRaw) out.push({ z: Z_BODY, svg: innards(paint(bodyRaw, Z_BODY)) })
    if (morphRaw) out.push({ z: Z_MORPH, svg: innards(paint(morphRaw, Z_MORPH)) })
    return out
  }

  // 몸통을 면과 선으로 갈라 무늬를 그 사이에 끼운다.
  // 통째로 얹으면 무늬가 몸통의 안쪽 선까지 덮어 버린다
  out.push({ z: Z_BODY, svg: paint(split.fills, Z_BODY) })

  // 무늬 파일은 표시와 별개로 늘 함께 그린다
  if (morphRaw) {
    const sil = silhouette(bodyRaw!)
    const inner = innards(
      prepareSvg(morphRaw, { fill, line, accent, morph: mark }, `${uid}${Z_MORPH}`),
    )
    // 무늬 덩어리에 선을 두른다. 색만 바뀌면 얼룩처럼 보이고,
    // 테두리가 있어야 의도한 모양으로 읽힌다
    if (howEdge === 'soft' && sil) {
      // 무늬를 흐린 가리개로 삼아 가장자리가 번지게 한다.
      // 색을 실루엣 가득 깔고 그 가리개로 도려내는 식이다
      const veil = innards(prepareSvg(morphRaw, { fill: '#FFFFFF', line: '#FFFFFF', accent: '#FFFFFF', morph: '#FFFFFF' }, `${uid}v`))
      out.push({
        z: Z_MORPH,
        svg:
          `<defs>` +
          `<clipPath id="skin-${uid}">${sil}</clipPath>` +
          `<filter id="blur-${uid}" x="-25%" y="-25%" width="150%" height="150%">` +
          `<feGaussianBlur stdDeviation="${MORPH_BLUR}"/></filter>` +
          `<mask id="veil-${uid}"><g filter="url(#blur-${uid})">${veil}</g></mask>` +
          `</defs>` +
          `<g clip-path="url(#skin-${uid})" mask="url(#veil-${uid})">` +
          `<rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" fill="${mark}"/></g>`,
      })
    } else {
      out.push({
        z: Z_MORPH,
        svg: sil
          ? `<defs><clipPath id="skin-${uid}">${sil}</clipPath></defs>` +
            `<g clip-path="url(#skin-${uid})" ${edge(line, howEdge)}>${inner}</g>`
          : `<g ${edge(line, howEdge)}>${inner}</g>`,
      })
    }
  }

  // 칠할 부위를 한 겹 더 얹는다. 몸통 파일에서 머리 아래 깔려 있어도 위로 올라온다
  regions.forEach((r, i) => {
    const tags = (split.marks[r.부위] ?? []).join('')
    if (!tags) return
    const lit = prepareSvg(tags, { fill, line, accent, ear: mark }, `${uid}r${i}`)
    if (!r.쪽) { out.push({ z: Z_MORPH + 0.25, svg: `<g ${edge(line, howEdge)}>${lit}</g>` }); return }
    const id = `${r.쪽 === '왼' ? 'l' : 'r'}${i}-${uid}`
    const x = r.쪽 === '왼' ? 0 : C
    out.push({
      z: Z_MORPH + 0.25,
      svg: `<defs><clipPath id="${id}"><rect x="${x}" y="0" width="${C}" height="${CANVAS}"/></clipPath></defs>` +
           `<g clip-path="url(#${id})" ${edge(line, howEdge)}>${lit}</g>`,
    })
  })

  // 귀 안쪽 분홍은 귀 면적 위로 올린다. 아래 깔리면 귀를 칠할 때 묻힌다
  if (regions.length && split.inner) out.push({ z: Z_MORPH + 0.3, svg: paint(split.inner, Z_MORPH + 0.3) })

  out.push({ z: Z_MORPH + 0.5, svg: paint(split.lines, Z_MORPH + 0.5) })
  return out
}

export function composeMoimo(
  genes: MoimoGenes,
  cache: PartsCache,
  table: AnchorTable,
): string {
  const color = BODY_COLORS[genes.color - 1] ?? BODY_COLORS[0]
  const { fill: bodyHex, line, accent, mark } = toneFor(color, genes.morph)
  const uid = `m${genes.body}${genes.color}${genes.morph}${genes.eye}${genes.mouth}${genes.cheek}${genes.hair}${genes.tail}${genes.deco}`

  const pieces: { z: number; svg: string }[] = []

  const push = (z: number, url: string, fill: string, anchor: ReturnType<typeof composeAnchor>) => {
    const raw = cache.get(url)
    if (!raw) return
    pieces.push({
      z,
      svg: layer(innards(prepareSvg(raw, { fill, line, accent }, uid + z)), anchor, uid),
    })
  }


  const bodyRaw = cache.get(bodyUrl(genes.body))
  const morphUrl = genes.morph > 0
    ? morphUrls(genes.body, genes.morph).find((u) => cache.has(u))
    : undefined
  const morphRaw = morphUrl ? cache.get(morphUrl) : undefined

  pieces.push(...bodyPieces({ bodyRaw, morphRaw, morph: genes.morph, color, uid }))

  // 꼬리는 몸통에 이어 붙은 것이라, 무늬가 몸통 바깥을 덮으면 함께 칠한다
  const bodyTone = MORPH_TAIL.has(genes.morph) ? mark : bodyHex

  for (const s of SLOTS) {
    const n = genes[s.key as keyof MoimoGenes] as number
    push(
      s.z,
      partUrl(s.key as SlotKey, n),
      fillFor(s.key as SlotKey, n, s.key === 'tail' ? bodyTone : bodyHex),
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
