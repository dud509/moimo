import { useEffect, useState } from 'react'
import { isSvgText } from '../moimo/parts'

const cache = new Map<string, string | null>()

/** SVG 파일을 텍스트로. 없으면 null */
export function useSvg(urls: string | string[] | null): { svg: string | null; missing: boolean } {
  const list = urls == null ? [] : Array.isArray(urls) ? urls : [urls]
  const key = list.join('|')
  const [, bump] = useState(0)

  useEffect(() => {
    if (!key || cache.has(key)) return
    let alive = true
    ;(async () => {
      for (const url of list) {
        try {
          // 개발 중에는 파츠를 갈아끼워도 예전 파일이 캐시에서 나오지 않게 한다
          const res = await fetch(url, import.meta.env.DEV ? { cache: 'no-store' } : undefined)
          if (!res.ok) continue
          const text = await res.text()
          // 없는 파일에는 개발 서버가 index.html 을 돌려주므로 내용을 확인한다
          if (!isSvgText(text)) continue
          if (alive) { cache.set(key, text); bump((n) => n + 1) }
          return
        } catch { /* 다음 후보로 */ }
      }
      if (alive) { cache.set(key, null); bump((n) => n + 1) }
    })()
    return () => { alive = false }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!key) return { svg: null, missing: false }
  const hit = cache.get(key)
  return { svg: hit ?? null, missing: hit === null }
}

export function svgCacheHas(key: string) { return cache.has(key) }
