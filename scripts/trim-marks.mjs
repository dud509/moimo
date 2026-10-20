/**
 * 재단선 붙이기 — 인쇄소에 넘길 모양으로 감싼다.
 *
 *   node scripts/trim-marks.mjs <들어갈 svg> <나올 svg> [--trim=297x420] [--bleed=3] [--mark=10] [--offset=3]
 *
 * 하는 일은 셋이다.
 *   1. 종이(재단선) 바깥으로 그림을 bleed 만큼 흘려보낸다. 칼이 밀려도 흰 테가 안 생긴다.
 *   2. 네 귀퉁이에 재단선을 긋는다. 선은 재단 자리에서 offset 만큼 떨어져 시작한다.
 *      (그래야 재단선이 인쇄물 안으로 묻어 들어오지 않는다)
 *   3. 바탕을 흰색으로 깐다.
 *
 * 그림은 원본 비율 그대로 bleed 칸을 꽉 채우고, 넘치는 쪽만 잘린다(slice).
 * 단위는 전부 mm 다.
 */

import { readFile, writeFile } from 'node:fs/promises'

const [input, output, ...rest] = process.argv.slice(2)
if (!input || !output) {
  console.error('쓰임: node scripts/trim-marks.mjs <in.svg> <out.svg> [--trim=297x420] [--bleed=3] [--mark=10] [--offset=3]')
  process.exit(1)
}

const arg = Object.fromEntries(
  rest.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')),
)
const [TW, TH] = (arg.trim ?? '297x420').split('x').map(Number)
const BLEED = Number(arg.bleed ?? 3)
const MARK = Number(arg.mark ?? 10)     // 재단선 길이
const OFFSET = Number(arg.offset ?? 3)  // 재단 자리에서 선이 떨어진 거리
const LINE = Number(arg.line ?? 0.25)   // 재단선 굵기
const BG = arg.background ?? '#FFFFFF'

const src = await readFile(input, 'utf8')
const tag = src.match(/<svg\b[^>]*>/i)?.[0]
if (!tag) throw new Error('<svg> 를 찾지 못했습니다')

/** 원본이 어떤 칸에 그려져 있는지 — viewBox 가 없으면 width/height 를 본다 */
function sourceBox() {
  const vb = tag.match(/viewBox="([^"]+)"/i)?.[1]
  if (vb) {
    const [x, y, w, h] = vb.trim().split(/[\s,]+/).map(Number)
    return { x, y, w, h }
  }
  const n = (k) => Number(tag.match(new RegExp(`${k}="([\\d.]+)`, 'i'))?.[1])
  const w = n('width'), h = n('height')
  if (!w || !h) throw new Error('원본 크기를 알 수 없습니다 (viewBox 도 width/height 도 없음)')
  return { x: 0, y: 0, w, h }
}

const box = sourceBox()
const inner = src
  .replace(/<\?xml[^>]*\?>/gi, '')
  .replace(/<!DOCTYPE[^>]*>/gi, '')
  .replace(/^[\s\S]*?<svg[^>]*>/i, '')
  .replace(/<\/svg>\s*$/i, '')

// 종이 = 재단 + 재단여유 + 재단선 자리
const PAD = BLEED + OFFSET + MARK
const DW = TW + PAD * 2
const DH = TH + PAD * 2
// 재단선(칼 들어가는 자리)
const T = { x0: PAD, y0: PAD, x1: PAD + TW, y1: PAD + TH }
// 재단여유까지 그림이 차는 칸
const B = { x: T.x0 - BLEED, y: T.y0 - BLEED, w: TW + BLEED * 2, h: TH + BLEED * 2 }

const f = (n) => Number(n.toFixed(3))

/** 귀퉁이마다 가로 한 줄, 세로 한 줄 */
const marks = []
for (const [x, sx] of [[T.x0, -1], [T.x1, 1]]) {
  for (const [y, sy] of [[T.y0, -1], [T.y1, 1]]) {
    const hx = x + sx * OFFSET
    marks.push(`<line x1="${f(hx)}" y1="${f(y)}" x2="${f(hx + sx * MARK)}" y2="${f(y)}"/>`)
    const vy = y + sy * OFFSET
    marks.push(`<line x1="${f(x)}" y1="${f(vy)}" x2="${f(x)}" y2="${f(vy + sy * MARK)}"/>`)
  }
}

const out =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
  `width="${DW}mm" height="${DH}mm" viewBox="0 0 ${DW} ${DH}">\n` +
  `<rect width="${DW}" height="${DH}" fill="${BG}"/>\n` +
  // 그림은 제 비율을 지키며 재단여유 칸을 꽉 채운다. 넘치는 쪽만 잘린다
  `<svg x="${f(B.x)}" y="${f(B.y)}" width="${f(B.w)}" height="${f(B.h)}" ` +
  `viewBox="${box.x} ${box.y} ${box.w} ${box.h}" preserveAspectRatio="xMidYMid slice">\n` +
  inner +
  `\n</svg>\n` +
  `<g stroke="#000000" stroke-width="${LINE}" fill="none" shape-rendering="crispEdges">\n` +
  marks.join('\n') +
  `\n</g>\n</svg>\n`

await writeFile(output, out, 'utf8')

const k = Math.max(B.w / box.w, B.h / box.h)
const cut = { w: f(box.w * k - B.w), h: f(box.h * k - B.h) }
console.log(`종이 ${DW}×${DH}mm · 재단 ${TW}×${TH}mm · 재단여유 ${BLEED}mm · 재단선 ${MARK}mm (${OFFSET}mm 띄움)`)
console.log(`그림이 잘려 나간 몫: 가로 ${cut.w}mm · 세로 ${cut.h}mm`)
