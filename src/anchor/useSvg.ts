import { useEffect, useState } from 'react'

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
          const res = await fetch(url)
          if (!res.ok) continue
          const text = await res.text()
          if (!text.trim().startsWith('<')) continue
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
