/**
 * 자리를 지키는 임시 무늬를 뽑는다.
 *   node scripts/gen-morph.mjs
 * 그린 파일로 덮어쓰면 그대로 바뀌므로, 이 스크립트를 다시 돌릴 필요는 없다.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../public/parts', import.meta.url))
const pad = (n) => String(n).padStart(2, '0')

/** 몸통 파일에서 채워진 영역만 골라 실루엣 삼는다 */
function silhouette(svg) {
  const out = []
  const re = /<(path|circle|ellipse|rect|polygon)\b[^>]*\/>/gi
  let m
  while ((m = re.exec(svg))) {
    const tag = m[0]
    if (!/fill="(#fff|#ffffff|white)"/i.test(tag)) continue
    out.push(tag.replace(/\s(fill|stroke|stroke-[a-z]+|opacity)="[^"]*"/gi, ''))
  }
  return out.join('')
}

/** 무늬 다섯 가지 — 실루엣 안쪽에만 그려진다 */
function pattern(kind) {
  const dot = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`
  switch (kind) {
    case 1: // 점박이
      return [[150,300,34],[330,268,26],[240,392,30],[368,388,22],[186,196,24],[300,180,18]]
        .map(([x,y,r]) => dot(x,y,r)).join('')
    case 2: // 줄무늬
      return [210, 280, 350, 420].map((y) => `<rect x="0" y="${y}" width="512" height="36"/>`).join('')
    case 3: // 배
      return `<ellipse cx="256" cy="378" rx="116" ry="92"/>`
    case 4: // 얼룩
      return `<path d="M130 250c34-46 92-34 104 6s-22 84-66 78-72-38-38-84Z"/>` +
             `<path d="M300 330c40-34 94-8 92 36s-54 70-92 46-40-48 0-82Z"/>` +
             `<path d="M228 170c30-24 68-4 64 28s-42 48-68 30-26-34 4-58Z"/>`
    default: // 물방울
      return [[170,250],[268,214],[350,300],[210,372],[318,404],[130,330]]
        .map(([x,y]) => `<path d="M${x} ${y-28}c22 24 26 36 26 46a26 26 0 0 1-52 0c0-10 4-22 26-46Z"/>`).join('')
  }
}

for (let b = 1; b <= 12; b++) {
  const body = readFileSync(`${ROOT}/body/${pad(b)}.svg`, 'utf8')
  const clip = silhouette(body)
  if (!clip) { console.log(`몸통 ${pad(b)} 실루엣 못 찾음 — 건너뜀`); continue }
  for (let m = 1; m <= 5; m++) {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n` +
      `  <!-- 자리를 지키는 임시 무늬입니다. 그린 파일로 덮어쓰면 됩니다. -->\n` +
      `  <defs><clipPath id="body-${pad(b)}">${clip}</clipPath></defs>\n` +
      `  <g clip-path="url(#body-${pad(b)})" fill="#FF00FF" stroke="#888989" stroke-width="5" stroke-linejoin="round">\n` +
      `    ${pattern(m)}\n  </g>\n</svg>\n`
    writeFileSync(`${ROOT}/morph/b${pad(b)}-m${pad(m)}.svg`, svg)
  }
}
console.log('무늬 파일 생성 완료')
