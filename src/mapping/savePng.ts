/**
 * 화면에 그려진 한 덩어리를 PNG 한 장으로 내려받는다.
 *
 * 그 덩어리를 SVG 의 foreignObject 에 통째로 담아 캔버스에 그리는 방식이다.
 * 모이모 그림은 이미 data: 주소라 그대로 따라간다. 웹 글꼴은 그림 안에서
 * 다시 불러오지 못해 시스템 한글 글꼴로 바뀐다.
 */

const pageCss = (): string =>
  [...document.styleSheets]
    .map((sheet) => {
      try { return [...sheet.cssRules].map((r) => r.cssText).join('\n') } catch { return '' }
    })
    .join('\n')

export async function savePng(node: HTMLElement, filename: string, scale = 2) {
  const w = node.scrollWidth
  const h = node.scrollHeight
  const html = new XMLSerializer().serializeToString(node)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
    `<foreignObject x="0" y="0" width="${w}" height="${h}">` +
    `<div xmlns="http://www.w3.org/1999/xhtml"><style>${pageCss().replace(/</g, '\\3c ')}</style>${html}</div>` +
    `</foreignObject></svg>`
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = w * scale
  canvas.height = h * scale
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.drawImage(img, 0, 0)
  const blob = await new Promise<Blob>((ok) => canvas.toBlob((b) => ok(b!), 'image/png'))
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
