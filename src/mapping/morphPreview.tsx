// 임시 — 무늬 0~5 × 흰 바탕/누름 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { BODY_COLORS, normalizeTable, type AnchorTable } from '../moimo/parts'
import type { MoimoGenes } from '../moimo/name'

const MORPH = ['없음', '01 귀·꼬리 끝', '02 아래 꽉 채움', '03 얼굴 네모 비움', '04 세로 반', '05 머리 덮음']

function Art({ g, cache, table }: { g: MoimoGenes; cache: PartsCache; table: AnchorTable }) {
  const src = useMemo(() => moimoDataUri(composeMoimo(g, cache, table).replace(/viewBox="[^"]*"/, 'viewBox="60 50 392 400"')), [g, cache, table])
  return <img src={src} alt="" />
}

function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  const q = new URLSearchParams(location.search)
  const body = Number(q.get('body') ?? 3), color = Number(q.get('color') ?? 5)
  return (
    <>
      <h1>무늬 옵션 — 몸통 {body} · {BODY_COLORS[color - 1].name}</h1>
      {[0, 1].map((tone) => (
        <div key={tone} className="row" style={{ gridTemplateColumns: '150px repeat(6, 1fr)' }}>
          <div className="label"><b>{tone ? '누름' : '흰 바탕'}</b><small>이름 앞 글자 모음이 정함</small></div>
          {MORPH.map((m, morph) => (
            <figure key={morph}><Art g={{ body, color, morph, tone, eye: 7, mouth: 9, cheek: 1, hair: 4, tail: 9, deco: 1 }} cache={cache} table={table} /><figcaption>{m}</figcaption></figure>
          ))}
        </div>
      ))}
    </>
  )
}

function App() {
  const [cache, setCache] = useState<PartsCache | null>(null)
  const table = useMemo<AnchorTable>(() => normalizeTable(anchorsJson), [])
  useEffect(() => { loadParts().then(setCache) }, [])
  return cache ? <Page cache={cache} table={table} /> : <p style={{ padding: 16 }}>불러오는 중…</p>
}

createRoot(document.getElementById('root')!).render(<App />)
