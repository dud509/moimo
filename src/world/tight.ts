import { useEffect, useState } from 'react'

/**
 * 그림 한 장의 실제 크기.
 * `url` 은 여백을 잘라낸 판이고, `ratio` 는 세로/가로 비다.
 */
export type Tight = { url: string; ratio: number }

/**
 * svg 의 여백을 잘라낸다.
 *
 * 일러스트에서 500×500 아트보드에 작게 그리면 그림이 캔버스의 11%밖에
 * 안 되기도 한다. 그대로 놓으면 먼지만 해지고, 코드에 배율을 적어 두면
 * 아트보드를 고칠 때마다 숫자를 따라 고쳐야 한다.
 *
 * 그래서 브라우저에게 직접 재게 한다 — 한 번 그려 보고 실제로 칠해진
 * 네모(getBBox)를 얻어 viewBox 를 거기에 맞춘다. 아트보드가 크든 작든
 * 화면에 놓이는 크기는 적어 준 그대로가 된다.
 */
export function useTightArt(srcs: readonly string[]): Record<string, Tight> {
  const key = srcs.join('|')
  const [art, setArt] = useState<Record<string, Tight>>({})

  useEffect(() => {
    let alive = true
    const made: string[] = []
    // getBBox 는 화면에 올라가 있어야 답한다. 보이지만 않게 둔다
    const box = document.createElement('div')
    box.setAttribute('aria-hidden', 'true')
    box.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden'
    document.body.appendChild(box)

    const one = async (src: string): Promise<[string, Tight] | null> => {
      try {
        const res = await fetch(src)
        if (!res.ok) return null
        box.innerHTML = await res.text()
        const svg = box.querySelector('svg')
        if (!svg) return null
        svg.setAttribute('width', '500')
        svg.setAttribute('height', '500')
        const b = (svg as SVGSVGElement).getBBox()
        if (!b.width || !b.height) return null
        const pad = Math.max(b.width, b.height) * 0.02
        const w = b.width + pad * 2
        const h = b.height + pad * 2
        svg.setAttribute('viewBox', `${b.x - pad} ${b.y - pad} ${w} ${h}`)
        svg.removeAttribute('width')
        svg.removeAttribute('height')
        const url = URL.createObjectURL(new Blob([svg.outerHTML], { type: 'image/svg+xml' }))
        made.push(url)
        return [src, { url, ratio: h / w }]
      } catch {
        return null
      }
    }

    Promise.all(srcs.map(one)).then((rows) => {
      box.remove()
      if (!alive) return
      setArt(Object.fromEntries(rows.filter(Boolean) as [string, Tight][]))
    })

    return () => {
      alive = false
      box.remove()
      for (const u of made) URL.revokeObjectURL(u)
    }
  }, [key])

  return art
}
