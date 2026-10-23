/**
 * 유전자 한 벌을 SVG 한 장으로 조립한다.
 *
 * 파츠 파일을 통째로 이어 붙이는 대신 바깥 <svg> 껍데기만 벗겨서 <g> 로 감싼다.
 * 모든 파츠가 같은 512 캔버스에 그려져 있어 좌표가 그대로 맞는다.
 */

import {
  BODY_COLORS, CANVAS, FADE_END, FADE_HOLD, HEAD_BOTTOM, MARKS, MORPH_BLUR, MORPH_BODY_EDGE, MORPH_SPREAD, MORPH_TAIL, regionsFor,
  SLOTS, Z_BODY, Z_MORPH, edgeFor,
  bodyUrl, POSES, TORSO_URL, Z_HEAD, composeAnchor, decoFor, fillFor, isCleared, usesPoint, isSvgText, morphUrls, partUrl, partUrls, prepareSvg, syOf, toneFor, zFor,
  type AnchorTable, type SlotKey,
} from './parts'
import type { MoimoGenes } from './name'
import type { BodyColor } from './parts'

export type PartsCache = Map<string, string>

/** 바깥 <svg> 껍데기와 XML 선언을 벗긴다 */
export function innards(svg: string): string {
  return svg
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/^[\s\S]*?<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '')
}

const C = CANVAS / 2

/**
 * SVG 안의 맨 바깥 요소들을 하나씩 떼어 낸다 — 응용 포즈의 몸 파일에서
 * 첫 묶음(몸)과 나머지(손)를 가르려고 쓴다.
 */
function topLevel(svg: string): string[] {
  const inner = innards(svg)
  const out: string[] = []
  const tag = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>/g
  let depth = 0
  let start = -1
  for (let m = tag.exec(inner); m; m = tag.exec(inner)) {
    const t = m[0]
    if (t.startsWith('<!--')) continue
    const closing = t.startsWith('</')
    const selfClosing = t.endsWith('/>')
    if (!closing && depth === 0) start = m.index
    if (closing) depth -= 1
    else if (!selfClosing) depth += 1
    if (depth === 0 && start >= 0) { out.push(inner.slice(start, m.index + t.length)); start = -1 }
  }
  return out
}

/** 떼어 낸 요소들을 원래 <svg> 껍데기에 다시 담는다 */
const rewrap = (svg: string, parts: string[]) => `${svg.match(/<svg[^>]*>/i)?.[0] ?? '<svg>'}${parts.join('')}</svg>`

/** 이름이 다시 붙기 전에 자리를 지키는 색 — 그 뒤에 가리개로 바꾼다 */
const SENTINEL = '#123456'

/** 위에서 아래로 흐르는 세로 가리개 */
const fadeDef = (id: string) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
  `<stop offset="0" stop-color="#fff"/>` +
  `<stop offset="${FADE_HOLD}" stop-color="#fff"/>` +
  `<stop offset="${FADE_END}" stop-color="#000"/></linearGradient>`

/** 무늬 덩어리를 두르는 선 */
const edge = (line: string, how: 'line' | 'soft' | 'fade' | 'flat') =>
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
    if (!/fill="(#fff|#ffffff|white|lime|aqua|cyan|yellow|#0f0|#00ff00|#0ff|#00ffff|#ff0|#ffff00)"/i.test(tag)) continue
    out.push(tag.replace(/\s(fill|stroke|stroke-[a-z]+|opacity)="[^"]*"/gi, ''))
  }
  return out.join('')
}

export function layer(inner: string, a: ReturnType<typeof composeAnchor>, uid: string): string {
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
  /** 0 = 흰 바탕, 1 = 한 톤 누른 바탕 */
  tone?: number
  /** 몸통 번호 — 몸통마다 따로 정한 부위 규칙을 찾을 때 쓴다 */
  body?: number
  uid: string
}): { z: number; svg: string }[] {
  const { bodyRaw, morphRaw, morph, color, tone, body, uid } = opts
  const { fill, line, accent, mark } = toneFor(color, morph, tone)
  const howEdge = edgeFor(color)
  const out: { z: number; svg: string }[] = []
  const paint = (raw: string, z: number) =>
    prepareSvg(raw, { fill, line, accent }, `${uid}${z}`)

  const regions = regionsFor(body, morph).filter((r) => split_has(bodyRaw, r))
  const split = bodyRaw ? splitBody(bodyRaw) : null

  // 갈라낼 선이 없는 몸통만 통째로 그린다.
  //
  // 선이 있으면 무늬가 없어도 갈라서 그린다 — 귀 면적을 표시하려고 덮어
  // 둔 라임 도형이 파일에서 귀 선보다 뒤에 있으면, 통째로 그릴 때 그
  // 도형이 선을 덮어 귀 선만 얇아 보인다. 선은 언제나 맨 위다.
  if (!split || !split.lines) {
    if (bodyRaw) out.push({ z: Z_BODY, svg: innards(paint(bodyRaw, Z_BODY)) })
    if (morphRaw) out.push({ z: Z_MORPH, svg: innards(paint(morphRaw, Z_MORPH)) })
    return out
  }

  // 몸통을 면과 선으로 갈라 무늬를 그 사이에 끼운다.
  // 통째로 얹으면 무늬가 몸통의 안쪽 선까지 덮어 버린다
  out.push({ z: Z_BODY, svg: paint(split.fills, Z_BODY) })
  const skin = silhouette(bodyRaw!)

  // 무늬 파일은 표시와 별개로 늘 함께 그린다
  if (morphRaw) {
    const sil = silhouette(bodyRaw!)
    const inner = innards(
      prepareSvg(morphRaw, { fill, line, accent, morph: mark }, `${uid}${Z_MORPH}`),
    )
    // 무늬 덩어리에 선을 두른다. 색만 바뀌면 얼룩처럼 보이고,
    // 테두리가 있어야 의도한 모양으로 읽힌다
    if (howEdge === 'fade' && sil) {
      const veil = innards(
        prepareSvg(morphRaw, { fill: SENTINEL, line: 'none', accent: SENTINEL, morph: SENTINEL }, `${uid}v`),
      ).split(SENTINEL).join(`url(#fg-${uid})`)
      out.push({
        z: Z_MORPH,
        svg:
          `<defs>${fadeDef(`fg-${uid}`)}` +
          `<clipPath id="skin-${uid}">${sil}</clipPath>` +
          `<mask id="veil-${uid}">${veil}</mask></defs>` +
          `<g clip-path="url(#skin-${uid})" mask="url(#veil-${uid})">` +
          `<rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" fill="${mark}"/></g>`,
      })
    } else if (howEdge === 'soft' && sil) {
      // 무늬를 흐린 가리개로 삼아 가장자리가 번지게 한다.
      // 색을 실루엣 가득 깔고 그 가리개로 도려내는 식이다
      const veil = innards(prepareSvg(morphRaw, { fill: '#FFFFFF', line: '#FFFFFF', accent: '#FFFFFF', morph: '#FFFFFF' }, `${uid}v`))
      // 번지기는 귀와 얼굴에서만. 몸통에서 번지면 옷에 얼룩이 진 것처럼 보인다
      const H = HEAD_BOTTOM
      out.push({
        z: Z_MORPH,
        svg:
          `<defs>` +
          `<clipPath id="skin-${uid}">${sil}</clipPath>` +
          `<clipPath id="head-${uid}"><rect x="0" y="0" width="${CANVAS}" height="${H}"/></clipPath>` +
          `<clipPath id="torso-${uid}"><rect x="0" y="${H}" width="${CANVAS}" height="${CANVAS - H}"/></clipPath>` +
          `<filter id="blur-${uid}" x="-30%" y="-30%" width="160%" height="160%">` +
          `<feMorphology operator="dilate" radius="${MORPH_SPREAD}"/>` +
          `<feGaussianBlur stdDeviation="${MORPH_BLUR}"/></filter>` +
          `<mask id="veil-${uid}"><g filter="url(#blur-${uid})">${veil}</g></mask>` +
          `</defs>` +
          `<g clip-path="url(#skin-${uid})">` +
          `<g clip-path="url(#head-${uid})" mask="url(#veil-${uid})">` +
          `<rect x="0" y="0" width="${CANVAS}" height="${H}" fill="${mark}"/></g>` +
          `<g clip-path="url(#torso-${uid})" ${edge(line, MORPH_BODY_EDGE)}>${inner}</g>` +
          `</g>`,
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
    const id = `${r.쪽 === '왼' ? 'l' : 'r'}${i}-${uid}`
    const x = r.쪽 === '왼' ? 0 : C
    const halfDef = r.쪽
      ? `<clipPath id="${id}"><rect x="${x}" y="0" width="${C}" height="${CANVAS}"/></clipPath>`
      : ''
    const half = r.쪽 ? ` clip-path="url(#${id})"` : ''

    if (howEdge === 'fade' && skin) {
      const gid = `ef${i}-${uid}`
      const veil = prepareSvg(tags, { fill: SENTINEL, line: 'none', accent: SENTINEL, ear: SENTINEL }, `${uid}rv${i}`)
        .split(SENTINEL).join(`url(#${gid})`)
      out.push({
        z: Z_MORPH + 0.25,
        svg:
          `<defs>${halfDef}${fadeDef(gid)}` +
          `<clipPath id="es${i}-${uid}">${skin}</clipPath>` +
          `<mask id="ev${i}-${uid}">${veil}</mask></defs>` +
          `<g clip-path="url(#es${i}-${uid})"><g${half} mask="url(#ev${i}-${uid})">` +
          `<rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" fill="${mark}"/></g></g>`,
      })
      return
    }
    if (howEdge === 'soft' && skin) {
      // 귀도 무늬와 같은 방식으로 번지게 한다
      const veil = prepareSvg(tags, { fill: '#FFFFFF', line: '#FFFFFF', accent: '#FFFFFF', ear: '#FFFFFF' }, `${uid}rv${i}`)
      out.push({
        z: Z_MORPH + 0.25,
        svg:
          `<defs>${halfDef}` +
          `<clipPath id="es${i}-${uid}">${skin}</clipPath>` +
          `<filter id="eb${i}-${uid}" x="-30%" y="-30%" width="160%" height="160%">` +
          `<feMorphology operator="dilate" radius="${MORPH_SPREAD}"/>` +
          `<feGaussianBlur stdDeviation="${MORPH_BLUR}"/></filter>` +
          `<mask id="ev${i}-${uid}"><g filter="url(#eb${i}-${uid})">${veil}</g></mask>` +
          `</defs>` +
          `<g clip-path="url(#es${i}-${uid})"><g${half} mask="url(#ev${i}-${uid})">` +
          `<rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" fill="${mark}"/></g></g>`,
      })
      return
    }
    const lit = prepareSvg(tags, { fill, line, accent, ear: mark }, `${uid}r${i}`)
    out.push({
      z: Z_MORPH + 0.25,
      svg: (halfDef ? `<defs>${halfDef}</defs>` : '') +
           `<g${half} ${edge(line, howEdge)}>${lit}</g>`,
    })
  })

  // 귀 안쪽은 귀 면적과 무늬 위로 늘 올린다. 파일에서 귀 표시(라임)보다
  // 앞에 그려져 있으면 무늬가 없어도 귀에 덮여 묻힌다 (몸통 02)
  if (split.inner) out.push({ z: Z_MORPH + 0.3, svg: paint(split.inner, Z_MORPH + 0.3) })

  out.push({ z: Z_MORPH + 0.5, svg: paint(split.lines, Z_MORPH + 0.5) })
  return out
}

/**
 * 몸통 한 벌. 몸(torso)이 따로 있으면 몸은 제자리에, 머리(bodyRaw)는 몸통장식
 * 위로 올린다. 무늬는 양쪽에 같은 파일을 쓰고, 각자의 실루엣으로 잘린다.
 */
export function stackBody(opts: {
  bodyRaw?: string
  torsoRaw?: string
  morphRaw?: string
  morph: number
  color: BodyColor
  tone?: number
  body: number
  uid: string
}): { z: number; svg: string }[] {
  const { bodyRaw, torsoRaw, ...rest } = opts
  if (!bodyRaw || !torsoRaw) return bodyPieces({ ...rest, bodyRaw })
  return [
    ...bodyPieces({ ...rest, bodyRaw: torsoRaw, uid: `${rest.uid}t` }),
    ...bodyPieces({ ...rest, bodyRaw, uid: `${rest.uid}h` })
      // 몸통 층(2~3.5)을 머리 층(4.1~)으로 그대로 옮긴다
      .map((p) => ({ ...p, z: Z_HEAD + (p.z - Z_BODY) / 10 })),
  ]
}

/** 머리 앞에 그리는 층 — 머리장식(7)보다 위 */
const Z_FRONT = 8

export function composeMoimo(
  genes: MoimoGenes,
  cache: PartsCache,
  table: AnchorTable,
  /** 응용 포즈 번호(POSES) — 0 이 기본 자세. tilt 를 주면 그 포즈의 고개 각도 대신 쓴다 */
  look: { pose?: number; tilt?: number } = {},
): string {
  const pose = POSES[look.pose ?? 0] ?? POSES[0]
  const tilt = look.tilt ?? pose.tilt
  const color = BODY_COLORS[genes.color - 1] ?? BODY_COLORS[0]
  const { fill: bodyHex, line, accent, mark } = toneFor(color, genes.morph, genes.tone)
  const uid = `m${genes.body}${genes.color}${genes.morph}${genes.eye}${genes.mouth}${genes.cheek}${genes.hair}${genes.tail}${genes.deco}`

  const pieces: { z: number; svg: string }[] = []

  const push = (z: number, url: string, fill: string, anchor: ReturnType<typeof composeAnchor>) => {
    const raw = cache.get(url)
    if (!raw) return
    pieces.push({ z, svg: layer(innards(prepareSvg(raw, { fill, line, accent }, uid + z)), anchor, uid) })
  }


  const bodyRaw = cache.get(bodyUrl(genes.body))
  const morphUrl = genes.morph > 0
    ? morphUrls(genes.body, genes.morph).find((u) => cache.has(u))
    : undefined
  const morphRaw = morphUrl ? cache.get(morphUrl) : undefined

  // 응용 포즈의 몸 파일은 첫 묶음이 몸, 나머지가 손이다. 몸은 머리 뒤, 손은 맨 앞에 그린다.
  // front 포즈(손만 있는 몸)는 전부 손이다
  const poseRaw = pose.torso === TORSO_URL ? undefined : cache.get(pose.torso)
  const poseParts = poseRaw ? topLevel(poseRaw) : []
  const handsRaw = poseRaw && poseParts.length > (pose.front ? 0 : 1)
    ? rewrap(poseRaw, pose.front ? poseParts : poseParts.slice(1))
    : undefined
  const torsoRaw = pose.front
    ? undefined
    : poseRaw ? rewrap(poseRaw, poseParts.slice(0, 1)) : cache.get(TORSO_URL)

  // 팔 색 — 몸을 통째로 덮는 무늬면 그 색, 아니면 바탕색
  const handHex = MORPH_TAIL.has(genes.morph) ? mark : bodyHex
  const bodySet = torsoRaw
    ? stackBody({ bodyRaw, torsoRaw, morphRaw, morph: genes.morph, color, tone: genes.tone, body: genes.body, uid })
    // 몸이 없으면 머리 한 장만 머리 층에 그린다
    : bodyPieces({ bodyRaw, morphRaw, morph: genes.morph, color, tone: genes.tone, body: genes.body, uid: `${uid}h` })
      .map((p) => ({ ...p, z: Z_HEAD + (p.z - Z_BODY) / 10 }))
  if (poseRaw && torsoRaw) {
    // 무늬 그림은 기본 몸에 맞춰 그려져 있어, 팔을 옮긴 자리는 무늬가 덮지 못해 흰 틈이 난다.
    // 포즈 몸을 먼저 팔 색으로 통째로 깔고, 그 위의 면·무늬는 기본 몸 안쪽만 보이게 자른다.
    // 선은 자르지 않는다
    const sil = `tsil-${uid}`
    const own = `town-${uid}`
    pieces.push({
      z: Z_BODY - 0.05,
      svg: `<defs><clipPath id="${sil}">${silhouette(cache.get(TORSO_URL) ?? '')}</clipPath>` +
        `<clipPath id="${own}">${silhouette(torsoRaw)}</clipPath></defs>` +
        innards(prepareSvg(torsoRaw, { fill: handHex, line, accent }, `${uid}tb`)),
    })
    // 기본 몸 안쪽이면서 포즈 몸 안쪽인 곳만 — 무늬가 옛 팔 자리로 번지지 않게 둘 다로 자른다
    pieces.push(...bodySet.map((p) => (p.z < Z_MORPH + 0.5
      ? { ...p, svg: `<g clip-path="url(#${own})"><g clip-path="url(#${sil})">${p.svg}</g></g>` }
      : p)))
  } else {
    pieces.push(...bodySet)
  }
  if (handsRaw) {
    // 손에는 무늬를 얹지 않고 팔과 같은 색으로
    pieces.push({ z: Z_FRONT, svg: innards(prepareSvg(handsRaw, { fill: handHex, line, accent }, `${uid}k`)) })
  }

  // 꼬리는 몸통에 이어 붙은 것이라, 무늬가 몸통 바깥을 덮으면 함께 칠한다
  const bodyTone = MORPH_TAIL.has(genes.morph) ? mark : bodyHex

  // 몸통 장식 같은 것은 몸통에 파묻히지 않게 따로 색을 고른다
  const decoHex = decoFor(color)

  let cheekPiece: { z: number; svg: string } | undefined
  for (const s of SLOTS) {
    const key = s.key as SlotKey
    const n = genes[s.key as keyof MoimoGenes] as number
    const base = usesPoint(key, n) ? decoHex : key === 'tail' ? bodyTone : bodyHex
    const before = pieces.length
    // 몸 없이 손만 있는 포즈에는 몸통 장식을 붙일 곳이 없다
    if (key === 'deco' && pose.front) continue
    const url = partUrls(key, n, genes.body).find((u) => cache.has(u)) ?? partUrl(key, n)
    push(zFor(key, n, s.z), url, fillFor(key, n, base), composeAnchor(table, genes.body, key, n, genes.eye))
    if (key === 'cheek' && pieces.length > before) cheekPiece = pieces[before]
  }

  // 흰자를 비운 눈(11) 밑으로 볼이 비치지 않게, 볼에서 그 흰자 자리를 도려낸다
  const eyeRaw = cache.get(partUrl('eye', genes.eye))
  if (isCleared('eye', genes.eye) && eyeRaw && cheekPiece) {
    const hole = innards(prepareSvg(eyeRaw, { fill: '#000000', line: 'none', accent: '#000000' }, `${uid}eh`))
    const id = `eh-${uid}`
    cheekPiece.svg =
      `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${CANVAS}" height="${CANVAS}">` +
      `<rect x="0" y="0" width="${CANVAS}" height="${CANVAS}" fill="#fff"/>` +
      layer(hole, composeAnchor(table, genes.body, 'eye', genes.eye, genes.eye), uid) +
      `</mask></defs><g mask="url(#${id})">${cheekPiece.svg}</g>`
  }

  pieces.sort((a, b) => a.z - b.z)
  // 고개 기울이기 — 머리 층(머리·귀·얼굴 파츠)만 목을 중심으로 돌린다. 몸·몸통 장식·꼬리는 그대로
  const svgs = pieces.map((p) => p.svg)
  if (tilt) {
    const head = pieces.findIndex((p) => p.z >= Z_HEAD && p.z < Z_FRONT)
    const end = pieces.findIndex((p) => p.z >= Z_FRONT)
    const to = end < 0 ? pieces.length : end
    if (head >= 0) svgs.splice(head, to - head, `<g transform="rotate(${tilt} ${C} ${HEAD_BOTTOM})">${svgs.slice(head, to).join('')}</g>`)
  }

  return (
    // xlink 도 선언해 둔다. 파츠 중에 xlink:href 를 쓰는 것이 있어(볼 03),
    // <img> 로 띄우면 선언이 없다는 이유로 그림 전체가 깨진다
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${CANVAS} ${CANVAS}">` +
    `<defs>` +
    `<clipPath id="half-l-${uid}"><rect x="0" y="0" width="${C}" height="${CANVAS}"/></clipPath>` +
    `<clipPath id="half-r-${uid}"><rect x="${C}" y="0" width="${C}" height="${CANVAS}"/></clipPath>` +
    `</defs>` +
    svgs.join('') +
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
  urls.push(TORSO_URL)
  for (const p of POSES) if (!urls.includes(p.torso)) urls.push(p.torso)
  for (const s of SLOTS) {
    for (let i = 1; i <= COUNTS[s.key]; i++) {
      for (let b = 1; b <= 12; b++) urls.push(...partUrls(s.key as SlotKey, i, b))
    }
  }
  for (let b = 1; b <= 12; b++) {
    for (let m = 1; m <= 5; m++) urls.push(...morphUrls(b, m))
  }

  const cache: PartsCache = new Map()
  // 몸통별 파일 후보까지 넣으면 같은 주소가 여러 번 나온다 — 한 번씩만 받는다.
  // 수백 개를 한꺼번에 받으면 일부가 조용히 실패해 무늬 같은 파츠가 빠지므로
  // 여러 번에 나눠 받고, 실패한 것은 한 번 더 받는다
  const unique = [...new Set(urls)]
  const get = async (url: string): Promise<boolean> => {
    try {
      const res = await fetch(url)
      if (!res.ok) return true // 없는 파일 — 다시 받을 필요 없다
      const text = await res.text()
      if (isSvgText(text)) cache.set(url, text)
      return true
    } catch {
      return false
    }
  }
  const BATCH = 24
  const failed: string[] = []
  for (let i = 0; i < unique.length; i += BATCH) {
    const chunk = unique.slice(i, i + BATCH)
    const ok = await Promise.all(chunk.map(get))
    chunk.forEach((u, k) => { if (!ok[k]) failed.push(u) })
  }
  for (const u of failed) await get(u)
  return cache
}
