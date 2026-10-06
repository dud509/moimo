import { CANVAS, type AnchorTable } from './parts'
import { composeMoimo, moimoDataUri, type PartsCache } from './compose'
import type { MoimoGenes } from './name'

/**
 * 굿즈용 SVG 한 장. 그림이 실제로 칠해진 네모에 맞춰 여백을 잘라 낸다.
 * 몸통 모양으로 잘라 낸 무늬 같은 것은 도형 크기로 재면 넓게 잡히므로,
 * 한 번 그려 보고 칠해진 픽셀로 잰다.
 */
export async function goodsSvg(genes: MoimoGenes, name: string, cache: PartsCache, table: AnchorTable): Promise<string> {
  const svg = composeMoimo(genes, cache, table)
  const S = 1024
  const img = new Image()
  img.src = moimoDataUri(svg.replace(/<svg /, `<svg width="${S}" height="${S}" `))
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, S, S)
  const data = ctx.getImageData(0, 0, S, S).data
  let x0 = S, y0 = S, x1 = 0, y1 = 0
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (data[(y * S + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  const k = CANVAS / S
  const pad = 6
  const box = [x0 * k - pad, y0 * k - pad, (x1 - x0 + 1) * k + pad * 2, (y1 - y0 + 1) * k + pad * 2]
    .map((v) => Math.round(v * 100) / 100)
  const out = svg.replace(
    /<svg([^>]*)viewBox="[^"]*"/,
    `<svg$1viewBox="${box.join(' ')}" width="${box[2]}" height="${box[3]}"`,
  )
  // 손으로 그린 선을 그대로 따서 만든 면은 제 몸을 가로지른다(하트의 말린 꼬리 등).
  // 브라우저는 nonzero 로 꽉 채우지만, 일러스트레이터는 따로 적어 주지 않으면
  // 겹친 자리를 구멍으로 뚫는다. 도형마다 nonzero 를 박아 둔다
  const filled = out.replace(
    /<(path|polygon|polyline|circle|ellipse|rect)\b(?![^>]*\bfill-rule=)/g,
    '<$1 fill-rule="nonzero" clip-rule="nonzero"',
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- 모이모 · ${name} -->\n${filled}`
}
