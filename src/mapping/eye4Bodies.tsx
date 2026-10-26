// 임시 — 몸통 12종에 점 눈(04)만, 색은 몸통마다 둘씩 무작위 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { BODY_COLORS, normalizeTable, type AnchorTable } from '../moimo/parts'
import type { MoimoGenes } from '../moimo/name'
import { goodsSheet, goodsSvg } from '../moimo/exportSvg'

const BODY = ['', '고양이', '코끼리', '햄스터', '강아지', '사막여우', '원숭이', '토끼', '코알라', '롭이어', '쥐', '고양이2', '롭이어2']

function pairs(seed: number) {
  let s = seed
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  return BODY.slice(1).map((_, i) => {
    const a = 1 + Math.floor(rnd() * 6)
    let b = a
    while (b === a) b = 1 + Math.floor(rnd() * 6)
    return [i + 1, a, b] as const
  })
}
const genesOf = (body: number, color: number): MoimoGenes => ({ body, color, morph: 0, tone: 0, eye: 4, mouth: 0, cheek: 0, hair: 0, tail: 0, deco: 0 })

function Art({ g, cache, table }: { g: MoimoGenes; cache: PartsCache; table: AnchorTable }) {
  const src = useMemo(() => moimoDataUri(composeMoimo(g, cache, table).replace(/viewBox="[^"]*"/, 'viewBox="60 50 392 400"')), [g, cache, table])
  return <img src={src} alt="" />
}

function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  const [seed, setSeed] = useState(2026)
  const [msg, setMsg] = useState('')
  const list = useMemo(() => pairs(seed), [seed])
  const save = async () => {
    setMsg('뽑는 중…')
    const items: { name: string; svg: string }[] = []
    for (const [b, c1, c2] of list) for (const c of [c1, c2]) {
      const name = `${String(b).padStart(2, '0')}_${BODY[b]}_${BODY_COLORS[c - 1].name}`
      const svg = await goodsSvg(genesOf(b, c), name, cache, table)
      items.push({ name, svg })
      await fetch('/__goods', { method: 'POST', body: JSON.stringify({ folder: '몸통 점눈', file: name, svg }) })
    }
    await fetch('/__goods', { method: 'POST', body: JSON.stringify({ folder: '몸통 점눈', file: '한장에_모아보기_24', svg: goodsSheet(items) }) })
    setMsg('goods-export/몸통 점눈/ 에 24장 + 모아보기 한 장')
  }
  return (
    <>
      <h1>몸통 12종 · 점 눈(04) · 색 둘씩 무작위</h1>
      <p className="hint">
        <button onClick={() => setSeed((x) => x + 1)}>다시 뽑기</button>{' '}
        <button onClick={() => { void save() }}>SVG 뽑기</button> {msg}
      </p>
      {list.map(([b, c1, c2]) => (
        <div key={b} className="row" style={{ gridTemplateColumns: '90px repeat(2, 180px)' }}>
          <div className="label"><b>{String(b).padStart(2, '0')} {BODY[b]}</b></div>
          {[c1, c2].map((c) => <figure key={c}><Art g={genesOf(b, c)} cache={cache} table={table} /><figcaption>{BODY_COLORS[c - 1].name}</figcaption></figure>)}
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
