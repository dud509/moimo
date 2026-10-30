import { genesFromName } from '../moimo/name'
import type { Resident } from './model'

/*
 * 함께 보는 마을 — 서버(api/moimo.js)에 모이모를 모아 두고 모두가 같은 마을을 본다.
 * 서버가 없으면(로컬 개발 등) null 을 돌려주고, 그때는 이 브라우저에만 저장한다.
 */

const API = '/api/moimo'

/** 서버의 마을 — 유전자는 이름에서 다시 계산한다 */
export async function fetchShared(): Promise<Resident[] | null> {
  try {
    const r = await fetch(API, { cache: 'no-store' })
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return null
    const list = (await r.json()) as Omit<Resident, 'genes' | 'mine'>[]
    if (!Array.isArray(list)) return null
    return list.flatMap((r) => {
      const genes = genesFromName(r.name)
      return genes ? [{ ...r, genes, mine: true }] : []
    })
  } catch {
    return null
  }
}

export async function postShared(r: Resident): Promise<boolean> {
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, name: r.name, x: r.x, y: r.y, phase: r.phase, at: r.at, note: r.note }),
    })
    return res.ok
  } catch {
    return false
  }
}

/** 끌어다 놓은 자리를 모두의 마을에 알린다 */
export async function moveShared(id: string, x: number, y: number): Promise<boolean> {
  try {
    const res = await fetch(API, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, x, y }),
    })
    return res.ok
  } catch {
    return false
  }
}
