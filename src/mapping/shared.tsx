/** 매칭표와 비교표가 같이 쓰는 것 — 모이모 한 마리를 잘라 그리는 법 */

import { useMemo } from 'react'
import { composeMoimo, moimoDataUri, type PartsCache } from '../moimo/compose'
import { MAPPINGS, type MappingId, type MapRow, type MoimoGenes } from '../moimo/name'
import type { AnchorTable } from '../moimo/parts'

/** 이 자리에서 가장 흔한 줄의 파츠 */
export const commonest = (rows: readonly MapRow[]) =>
  [...rows].filter((r) => r.pct > 0).sort((a, b) => b.pct - a.pct)[0].part

/** 나머지를 채울 바탕 — 자리마다 가장 흔한 파츠. 무늬는 없이 둔다 */
export const baseFor = (id: MappingId): MoimoGenes => ({
  ...(Object.fromEntries(MAPPINGS[id].slots.map((m) => [m.slot, commonest(m.rows)])) as Record<string, number>),
  color: 2,
  morph: 0,
  tone: 0,
} as MoimoGenes)

/** 무늬는 노랑 흰 바탕에서 잘 안 보여서, 파랑을 한 톤 눌러 입혀 본다 */
export const MORPH_LOOK = { color: 1, tone: 1 }

/** 얼굴·머리에 붙는 작은 파츠는 그 언저리만 크게 잘라 본다 */
export const CROP: Partial<Record<string, string>> = {
  eye: '96 140 320 200',
  mouth: '96 140 320 200',
  cheek: '96 140 320 200',
  hair: '76 66 360 250',
  body: '40 50 432 432',
  morph: '40 50 432 432',
  tail: '100 190 340 240',
  deco: '100 190 340 240',
}

export const jamoLabel = (r: MapRow) =>
  r.label ?? (r.jamo ?? []).map((j) => (j === '' ? '받침 없음' : j)).join(' ')

export const pad = (n: number) => String(n).padStart(2, '0')

export function Moimo({ genes, crop, cache, table }: {
  genes: MoimoGenes; crop?: string; cache: PartsCache; table: AnchorTable
}) {
  const uri = useMemo(() => {
    let svg = composeMoimo(genes, cache, table)
    if (crop) svg = svg.replace(/viewBox="[^"]*"/, `viewBox="${crop}"`)
    return moimoDataUri(svg)
  }, [genes, crop, cache, table])
  const [, , w, h] = (crop ?? '0 0 1 1').split(' ').map(Number)
  return <img className="art" style={{ aspectRatio: `${w} / ${h}` }} src={uri} alt="" draggable={false} />
}

