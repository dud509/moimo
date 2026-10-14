// 임시 — 볼 03 을 쓰는 캐릭터 모아 보기 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { BODY_COLORS, normalizeTable, type AnchorTable } from '../moimo/parts'
import { genesFromName, type MoimoGenes } from '../moimo/name'

const GUKHEE = ['이국희', '신국희', '박국희', '한국희', '강국희', '남국희', '최국희', '윤국희', '권국희', '류국희', '정국희', '서국희', '전국희', '조국희', '홍국희', '고국희', '진국희', '기국희']
const NAMES = ['김슬기', '박석진', '최석현', '정범수', '조혁준', '이학민', '김국희', '박길준', '최일우', '정율아', '조덕희', '이탁현', '김숙희', '박옥순', '최복희', '정갑수', '조칠성', '이말순', '김별아', '박솔비', '최락현', '정밀우', '조설아', '이욱진']

function Art({ g, cache, table }: { g: MoimoGenes; cache: PartsCache; table: AnchorTable }) {
  const src = useMemo(() => moimoDataUri(composeMoimo(g, cache, table).replace(/viewBox="[^"]*"/, 'viewBox="60 50 392 400"')), [g, cache, table])
  return <img loading="lazy" src={src} alt="" />
}

function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  return (
    <>
      <h1>○국희 — 성마다</h1>
      <p className="hint">고양이2 · 점 눈(04) · 볼 03 은 같고, 성이 색·머리장식·무늬를 바꿔요</p>
      <div className="row" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: 24 }}>
        {GUKHEE.map((n) => { const g = genesFromName(n)!; return (
          <figure key={n}><Art g={g} cache={cache} table={table} /><figcaption>{n}<br /><small>{BODY_COLORS[g.color - 1].name} · 머리 {String(g.hair).padStart(2, '0')}</small></figcaption></figure>
        ) })}
      </div>
      <h1>볼 03 쓰는 캐릭터 24</h1>
      <p className="hint">이름 앞 글자 받침이 ㄱ·ㄹ·ㅁ·ㅂ·ㅅ… 드문 받침 · 색 6가지를 돌아가며</p>
      <div className="row" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {NAMES.map((n) => { const g = genesFromName(n)!; return (
          <figure key={n}><Art g={g} cache={cache} table={table} /><figcaption>{n}<br /><small>{BODY_COLORS[g.color - 1].name} · 눈 {String(g.eye).padStart(2, '0')} · 볼 {String(g.cheek).padStart(2, '0')}</small></figcaption></figure>
        ) })}
      </div>
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
