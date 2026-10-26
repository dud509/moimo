// 임시 — 응용 포즈 미리보기 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { normalizeTable, type AnchorTable } from '../moimo/parts'
import { genesFromName } from '../moimo/name'

const NAMES = ['김다영', '설윤아', '한소희', '배하늘', '박지민', '윤지민', '임지민', '정지민']
const POSE_LABEL = ['기본', '1 한 손', '2 양손', '3 모으기', '4 빼꼼']
const TILTS = [-5, -6, -7, -8, -9]

function Pic({ n, pose, tilt, cache, table }: { n: string; pose: number; tilt?: number; cache: PartsCache; table: AnchorTable }) {
  const src = useMemo(() => moimoDataUri(composeMoimo(genesFromName(n)!, cache, table, { pose, tilt }).replace(/viewBox="[^"]*"/, 'viewBox="90 110 332 300"')), [n, pose, tilt, cache, table])
  return <figure><img src={src} alt="" /><figcaption>{n}{tilt !== undefined ? ` ${tilt}°` : ''}</figcaption></figure>
}

const BIG = ['김다영', '박지민', '정지민']
function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  return (
    <>
      <div className="big">{BIG.flatMap((n) => [0, 1, 2, 3, 4].map((p) => <Pic key={n + p} n={n} pose={p} cache={cache} table={table} />))}</div>
      <h1>포즈별 (1번 고개 −7°) · 뒤 넷은 무늬 있는 애들</h1>
      {POSE_LABEL.map((l, p) => (
        <div className="row" key={p}><b>{l}</b>{NAMES.map((n) => <Pic key={n} n={n} pose={p} cache={cache} table={table} />)}</div>
      ))}
      <h1>1번 고개 각도 비교</h1>
      {['김다영', '설윤아', '배하늘'].map((n) => (
        <div className="row" key={n}><b>{n}</b>{TILTS.map((t) => <Pic key={t} n={n} pose={1} tilt={t} cache={cache} table={table} />)}</div>
      ))}
    </>
  )
}

function App() {
  const [cache, setCache] = useState<PartsCache | null>(null)
  const table = useMemo<AnchorTable>(() => normalizeTable(anchorsJson), [])
  useEffect(() => { loadParts().then(setCache) }, [])
  return cache ? <Page cache={cache} table={table} /> : <p>불러오는 중…</p>
}
createRoot(document.getElementById('root')!).render(<App />)
