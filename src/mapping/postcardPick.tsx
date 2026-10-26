// 임시 — 엽서 9종 고르기 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { BODY_COLORS, normalizeTable, type AnchorTable } from '../moimo/parts'
import { genesFromName, type MoimoGenes } from '../moimo/name'

const MINE = [["김다영","설윤아","한소희","지예린","배하늘","최지현","이현준","서경민","송준우"]]
const OH = ['이현준', '이도준', '이도진', '이도재', '이대중', '임도준', '신도진', '심도재', '민도준', '이두진']
const MINE_ALT: Record<string, string[]> = {"햄스터":["김다영","장원영","박보영","한채연","고채영","이하영"],"고양이":["김나주","김민지","이영지","안유진","최유진","김세정"],"코끼리":["김다미","장수민","박수빈","권은비","이재민"],"강아지":["조혜경","윤태규","배한결","안준기"],"사막여우":["강지현","최지현","김다현","황민현","김태현","남주혁"],"원숭이":["설재석","최우식","변우석","설재석","이지성"],"토끼":["최미수","노윤서"],"코알라":["최예나","정유나","최수찬","이유찬","최예찬"],"롭이어":["손도아","설윤아","민서아","이하윤","곽소윤","박도윤"],"쥐":["정해인","박시은","배하은","권다은","박현우","최현우"],"고양이2":["정지호","한소희","김소희","박지훈","김선호","이준호"],"롭이어2":["강하린","이서린","한서린"]}
const PICK = ['김다영', '김나주', '최예나', '조민서', '강해린', '최지아', '서경민', '설재석', '학도현']
const FOUND = ['지옐린', '손지연', '김나주', '이나영', '최예나', '서경민', '설재석', '학도현', '조민수', '조민서', '황다솔', '황채선']
const SWAP = ['박소희', '한도희', '한해린', '정서린', '서미래', '강미소', '박한솔', '강민경', '서도경', '정해린']
const SJS = ['설재석', '설재성', '설재솔', '설재승', '설재선', '설재상']
const PICK_B = ['김다영', '배하늘', '윤슬기', '김민정', '한지민', '남예린', '전건우', '문태현', '이주호']
const ALT: Record<string, string[]> = {"고양이":["박서진","오형준","오수정","고예진","오석진","오연주"],"코끼리":["유영민","정수민","김은비","김정민","장경민","김경민"],"햄스터":["허지원","윤시원","신나연","장소연","장나연","장수연"],"강아지":["강동건","장민규","전혜경","백동건","황은경","홍미경"],"사막여우":["황도현","심동현","홍지현","홍도현","고다현","안상현"],"원숭이":["허지선","유지선","장재석","고재석","백미소","문지선"],"토끼":["서명수","장준서","황민수","강민서","강민수","강준서"],"코알라":["김하늘","황유나","박하늘","오유나","서유찬","배하늘"],"롭이어":["박윤아","심태윤","강수아","윤도윤","오수아","신지아"],"쥐":["홍연우","윤연우","박승우","오정우","권현우","서지웅"],"고양이2":["손영훈","서성호","한승훈","서은호","권정훈","권지훈"],"롭이어2":["안아름","전유리","윤보람","강채린","이채린","강하린"]}
const BODY = ['', '고양이', '코끼리', '햄스터', '강아지', '사막여우', '원숭이', '토끼', '코알라', '롭이어', '쥐', '고양이2', '롭이어2']

function Art({ g, cache, table }: { g: MoimoGenes; cache: PartsCache; table: AnchorTable }) {
  const src = useMemo(() => moimoDataUri(composeMoimo(g, cache, table).replace(/viewBox="[^"]*"/, 'viewBox="60 50 392 400"')), [g, cache, table])
  return <img loading="lazy" src={src} alt="" />
}
const Fig = ({ n, cache, table }: { n: string; cache: PartsCache; table: AnchorTable }) => { const g = genesFromName(n)!; return <figure><Art g={g} cache={cache} table={table} /><figcaption>{n}<br /><small>{BODY[g.body]} · {BODY_COLORS[g.color - 1].name}</small></figcaption></figure> }

const BG: [string, string, string][] = [['김다영', '#D3E6EE', '#FFF0C2'], ['설윤아', '#F1E1CF', '#F9DCE5'], ['한소희', '#FFECA8', '#D9E6F5'], ['지예린', '#D6E7EF', '#FADFE7'], ['배하늘', '#F8D6E0', '#D8EDDF'], ['최지현', '#F8D9E2', '#FFF0C0'], ['이현준', '#DCD3EA', '#FFF1BF'], ['서경민', '#EAD6C1', '#D9EADF'], ['송준우', '#CFE6D6', '#FBE1D2']]
const TXT: Record<string, string> = { 김다영: '#536874', 설윤아: '#8A5634', 한소희: '#7E6743', 지예린: '#536874', 배하늘: '#845465', 최지현: '#845465', 이현준: '#62587E', 서경민: '#8A5634', 송준우: '#4D6A5B' }
const Bg = ({ n, bg, cache, table }: { n: string; bg: string; cache: PartsCache; table: AnchorTable }) => <figure className="bgfig" style={{ background: bg, margin: 0, borderRadius: 10, padding: 6 }}><Art g={genesFromName(n)!} cache={cache} table={table} /><figcaption style={{ fontSize: 13, fontWeight: 700, color: TXT[n] }}>{n}<br /><small style={{ fontWeight: 400 }}>{TXT[n]}</small></figcaption></figure>
function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  return (
    <>
      <h1>배경색 · 위: 같은 계열 / 아래: 대비색</h1>
      <div className="row" style={{ gridTemplateColumns: 'repeat(9, 1fr)', gap: 6, marginBottom: 6 }}>{BG.map(([n, a]) => <Bg key={n} n={n} bg={a} cache={cache} table={table} />)}</div>
      <div className="row" style={{ gridTemplateColumns: 'repeat(9, 1fr)', gap: 6, marginBottom: 20 }}>{BG.map(([n, , b]) => <Bg key={n} n={n} bg={b} cache={cache} table={table} />)}</div>
      {MINE.map((m, i) => (<div key={i}><h1>엽서 9종 · 최종 후보</h1>
      <div className="row" style={{ gridTemplateColumns: 'repeat(9, 1fr)', marginBottom: 20 }}>{m.map((n) => <Fig key={n} n={n} cache={cache} table={table} />)}</div></div>))}
      <h1>이현준 자리 · 뱅글눈 연보라 고양이</h1>
      <div className="row" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: 20 }}>{OH.map((n) => <Fig key={n} n={n} cache={cache} table={table} />)}</div>
      <h1>직접 넣은 이름 · 몸통별 후보</h1>
      {Object.entries(MINE_ALT).map(([b, ns]) => (<div key={b} className="row" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: 8 }}>{ns.map((n) => <Fig key={n} n={n} cache={cache} table={table} />)}</div>))}
      <h1>엽서 9종 — 찾은 애들 넣은 안</h1>
      <p className="hint">몸통 9종 · 눈 9종 모두 다름 · 분홍·노랑·파랑·밀크티는 두 마리까지, 민트·연보라는 한 마리</p>
      <div className="row" style={{ gridTemplateColumns: 'repeat(9, 1fr)', marginBottom: 20 }}>{PICK.map((n) => <Fig key={n} n={n} cache={cache} table={table} />)}</div>
      <h1>설재석과 비슷한 이름</h1>
      <div className="row" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: 20 }}>{SJS.map((n) => <Fig key={n} n={n} cache={cache} table={table} />)}</div>
      <h1>찾은 애들 (+ 못 찾은 둘의 짐작)</h1>
      <div className="row" style={{ gridTemplateColumns: 'repeat(12, 1fr)', marginBottom: 20 }}>{FOUND.map((n) => <Fig key={n} n={n} cache={cache} table={table} />)}</div>
      <h1>서슬기·남민서 자리 후보 (둘 고르기)</h1>
      <p className="hint">남은 일곱과 몸통·눈이 겹치지 않는 애들 · 색은 노랑이나 밀크티 — 밀크티는 한 마리만</p>
      <div className="row" style={{ gridTemplateColumns: 'repeat(10, 1fr)', marginBottom: 20 }}>{SWAP.map((n) => <Fig key={n} n={n} cache={cache} table={table} />)}</div>
      <h1>B · 김준범 없이 9종</h1>
      <div className="row" style={{ gridTemplateColumns: 'repeat(9, 1fr)', marginBottom: 20 }}>{PICK_B.map((n) => <Fig key={n} n={n} cache={cache} table={table} />)}</div>
      <h1>몸통별 다른 후보</h1>
      {Object.entries(ALT).map(([b, ns]) => (
        <div key={b} className="row" style={{ gridTemplateColumns: '80px repeat(6, 1fr)' }}><div className="label"><b>{b}</b></div>{ns.map((n) => <Fig key={n} n={n} cache={cache} table={table} />)}</div>
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
