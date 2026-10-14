// 임시 — 나눔 스티커에서 뺄 다섯의 교체 후보 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { normalizeTable, type AnchorTable } from '../moimo/parts'
import { genesFromName, type MoimoGenes } from '../moimo/name'

const ALT: Record<string, string[]> = {"설재석":["설잭석"],"손수아":["손숙아"],"신태현":["신택현"],"전세영":["전섹영"],"지예린":["지옐린"],"진다민":["진달민"],"최미수":["최밀수"],"홍채원":["홍책원"]}
const BODY = ['', '고양이', '코끼리', '햄스터', '강아지', '사막여우', '원숭이', '토끼', '코알라', '롭이어', '쥐', '고양이2', '롭이어2']

function Art({ g, cache, table }: { g: MoimoGenes; cache: PartsCache; table: AnchorTable }) {
  const src = useMemo(() => moimoDataUri(composeMoimo(g, cache, table).replace(/viewBox="[^"]*"/, 'viewBox="60 50 392 400"')), [g, cache, table])
  return <img loading="lazy" src={src} alt="" />
}

function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  return (
    <>
      <h1>아크릴 키링 — 볼만 03 으로</h1>
      <p className="hint">지금 볼 01(분홍 동그라미)인 13명 중 볼만 바꿀 수 있는 애들 · 볼 말고는 전부 같아요 (이름은 굿즈에 안 들어가요)</p>
      {Object.entries(ALT).map(([o, alts]) => (
        <div key={o} className="row" style={{ gridTemplateColumns: '70px repeat(2, 170px)' }}>
          <div className="label"><b>{BODY[genesFromName(o)!.body]}</b></div>
          {[o, ...alts].map((n, i) => { const g = genesFromName(n)!; return (
            <figure key={n} style={{ opacity: 1 }}><Art g={g} cache={cache} table={table} /><figcaption>{i ? `→ ${n}` : `${n} (지금)`}<br /><small>{['', '파랑', '노랑', '분홍', '밀크티', '민트', '연보라'][g.color]} · 볼 {String(g.cheek).padStart(2, '0')}</small></figcaption></figure>
          ) })}
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
