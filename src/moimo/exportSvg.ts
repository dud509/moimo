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
  const baked = bakeClips(out, box)
  // 손으로 그린 선을 그대로 따서 만든 면은 제 몸을 가로지른다(하트의 말린 꼬리 등).
  // 브라우저는 nonzero 로 꽉 채우지만, 일러스트레이터는 따로 적어 주지 않으면
  // 겹친 자리를 구멍으로 뚫는다. 도형마다 nonzero 를 박아 둔다
  const filled = baked.replace(
    /<(path|polygon|polyline|circle|ellipse|rect)\b(?![^>]*\bfill-rule=)/g,
    '<$1 fill-rule="nonzero" clip-rule="nonzero"',
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- 모이모 · ${name} -->\n${filled}`
}

/**
 * 일러스트레이터에서 대지 밖까지 튀어나오는 투명 상자를 없앤다.
 *
 * 좌우로 벌리는 파츠(눈·볼·귀 표시 등)는 캔버스 반쪽 크기(256×512)의 잘라내기로
 * 양쪽을 나눠 민다. 브라우저에서는 보이지 않지만 일러스트레이터는 그 반쪽 상자를
 * 클리핑 마스크로 가져와 대지 밖까지 큰 테두리가 남는다. 반쪽 안의 도형은 어느
 * 것도 한가운데를 넘지 않으므로, 잘라내는 대신 그쪽에 있는 도형만 남기고 상자를
 * 지운다. 한가운데에 걸친 도형이 있으면 그 묶음은 그대로 둔다.
 * 가리개(mask)의 캔버스 크기 사각형도 그림 크기로 줄인다.
 */
function bakeClips(svg: string, box: number[]): string {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const root = doc.documentElement
  // 크기를 재려면 화면에 붙어 있어야 한다
  const host = document.createElement('div')
  host.style.cssText = 'position:absolute;left:-99999px;top:0;width:512px;height:512px;visibility:hidden'
  const live = document.importNode(root, true) as unknown as SVGSVGElement
  host.appendChild(live)
  document.body.appendChild(host)
  try {
    const C = CANVAS / 2
    const halves = new Map<string, 'l' | 'r'>()
    live.querySelectorAll('clipPath').forEach((cp) => {
      const kids = [...cp.children]
      if (kids.length !== 1 || kids[0].tagName !== 'rect') return
      const r = kids[0]
      const w = Number(r.getAttribute('width')), h = Number(r.getAttribute('height')), x = Number(r.getAttribute('x'))
      if (w === C && h === CANVAS) halves.set(cp.id, x === 0 ? 'l' : 'r')
    })
    const used = new Set<string>()
    live.querySelectorAll('[clip-path]').forEach((g) => {
      const id = /url\(#([^)]+)\)/.exec(g.getAttribute('clip-path') ?? '')?.[1]
      const side = id ? halves.get(id) : undefined
      if (!id || !side) return
      // 그 반쪽에 있는 도형만 남긴다. 양쪽에 걸친 묶음(<g>)은 속으로 들어가 나눈다
      const sideOf = (k: SVGGraphicsElement, ox: number): 'l' | 'r' | 'both' | 'empty' => {
        const b = k.getBBox()
        if (b.width === 0 && b.height === 0) return 'empty'
        const m = k.transform?.baseVal?.consolidate()?.matrix
        const x0 = ox + (m ? m.a * b.x + m.e : b.x)
        const x1 = ox + (m ? m.a * (b.x + b.width) + m.e : b.x + b.width)
        if (x1 <= C + 0.5) return 'l'
        if (x0 >= C - 0.5) return 'r'
        return 'both'
      }
      const prune = (parent: Element, ox: number): boolean => {
        const kids = [...parent.children].filter((k) => k instanceof SVGGraphicsElement) as SVGGraphicsElement[]
        for (const k of kids) {
          const w = sideOf(k, ox)
          if (w === 'both') {
            const m = k.transform?.baseVal?.consolidate()?.matrix
            // 옮기기만 한 묶음이면 속으로 들어간다. 그 밖의 변형이나 낱 도형은 포기
            if (k.tagName !== 'g' || (m && (m.a !== 1 || m.b !== 0 || m.c !== 0 || m.d !== 1))) return false
            if (!prune(k, ox + (m ? m.e : 0))) return false
          } else if (w !== side && w !== 'empty') k.remove()
        }
        return true
      }
      const snapshot = g.cloneNode(true)
      if (!prune(g, 0)) { g.replaceWith(snapshot); used.add(id); return }
      g.removeAttribute('clip-path')
    })
    live.querySelectorAll('[clip-path], [mask]').forEach((e) => {
      for (const a of ['clip-path', 'mask']) {
        const id = /url\(#([^)]+)\)/.exec(e.getAttribute(a) ?? '')?.[1]
        if (id) used.add(id)
      }
    })
    live.querySelectorAll('clipPath').forEach((cp) => { if (halves.has(cp.id) && !used.has(cp.id)) cp.remove() })
    // 가리개의 바탕 사각형을 그림 크기로
    const [bx, by, bw, bh] = box
    live.querySelectorAll('mask').forEach((mk) => {
      mk.setAttribute('x', String(bx)); mk.setAttribute('y', String(by))
      mk.setAttribute('width', String(bw)); mk.setAttribute('height', String(bh))
      const r = mk.querySelector(':scope > rect')
      if (r && Number(r.getAttribute('width')) === CANVAS) {
        r.setAttribute('x', String(bx)); r.setAttribute('y', String(by))
        r.setAttribute('width', String(bw)); r.setAttribute('height', String(bh))
      }
    })
    live.querySelectorAll('defs').forEach((d) => { if (!d.children.length) d.remove() })
    return new XMLSerializer().serializeToString(live)
  } finally {
    host.remove()
  }
}
