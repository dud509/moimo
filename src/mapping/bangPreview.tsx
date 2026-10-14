// 임시 — 뱅글눈(11) 이 나오는 이름 후보 (커밋하지 않음)
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import anchorsJson from '../data/anchors.json'
import { composeMoimo, loadParts, moimoDataUri, type PartsCache } from '../moimo/compose'
import { BODY_COLORS, normalizeTable, type AnchorTable } from '../moimo/parts'
import { genesFromName, type MoimoGenes } from '../moimo/name'

const BODY = ['', '고양이', '코끼리', '햄스터', '강아지', '사막여우', '원숭이', '토끼', '코알라', '롭이어', '쥐', '고양이2', '롭이어2']
const SETS: Record<string, string[]> = {
  도: ['도준', '도빈', '도연', '도경', '도현', '도솔', '도서', '도담', '도윤', '도은', '도희', '도린'],
  대: ['대준', '대빈', '대연', '대경', '대현', '대성', '대수', '대철', '대윤', '대우', '대호', '대륜'],
  '노랑 강아지': ['민규', '은경', '수경', '혜경', '현규', '준기', '태경', '동건', '채경', '지건', '가경', '도경', '미경', '윤기', '성규', '한결', '재경', '보경'],
  두: ['두준', '두빈', '두연', '두경', '두현', '두성', '두서', '두나', '두윤', '두은', '두희', '두리'],
}
const SURS_ALL = ['김', '박', '최', '정', '조', '이']
// 노랑(ㅏ 성) — 머리장식이 서로 다른 성들
const SURS_YELLOW = ['박', '강', '장', '한', '안', '하', '차', '남', '사']

function Art({ g, cache, table }: { g: MoimoGenes; cache: PartsCache; table: AnchorTable }) {
  const src = useMemo(() => moimoDataUri(composeMoimo(g, cache, table).replace(/viewBox="[^"]*"/, 'viewBox="60 50 392 400"')), [g, cache, table])
  return <img loading="lazy" src={src} alt="" />
}

function Page({ cache, table }: { cache: PartsCache; table: AnchorTable }) {
  const [pre, setPre] = useState(new URLSearchParams(location.search).get('p') ?? '대')
  const GIVEN = SETS[pre] ?? SETS.대
  const SURS = pre === '노랑 강아지' ? SURS_YELLOW : SURS_ALL
  const cols = `90px repeat(${SURS.length}, 1fr)`
  return (
    <>
      <h1>{pre === '노랑 강아지' ? '노랑 강아지 후보 ' : '뱅글눈 후보 — 이름 앞 글자가 '}{Object.keys(SETS).map((k) => <button key={k} onClick={() => setPre(k)} style={{ font: 'inherit', margin: '0 3px', padding: '2px 12px', borderRadius: 999, border: '1px solid #ddd2c6', background: k === pre ? '#4a3d33' : '#fff', color: k === pre ? '#fff' : 'inherit', cursor: 'pointer' }}>{k}</button>)}</h1>
      <p className="hint">가로는 성(색·머리장식·무늬), 세로는 이름 뒤 글자(몸통·꼬리·몸통장식)</p>
      <div className="row" style={{ gridTemplateColumns: cols }}>
        <div />{SURS.map((s) => { const c = BODY_COLORS[genesFromName(s + '도윤')!.color - 1]; return <b key={s} style={{ fontSize: 12, textAlign: 'center' }}><i className="chip" style={{ background: c.hex }} /> {s} · {c.name}</b> })}
      </div>
      {GIVEN.map((g) => (
        <div key={g} className="row" style={{ gridTemplateColumns: cols }}>
          <div className="label"><b>{pre === '노랑 강아지' ? '○' + g : BODY[genesFromName('김' + g)!.body]}</b><small>{pre === '노랑 강아지' ? `눈 ${String(genesFromName('김' + g)!.eye).padStart(2, '0')} · 입 ${String(genesFromName('김' + g)!.mouth).padStart(2, '0')}` : '○' + g}</small></div>
          {SURS.map((s) => { const x = genesFromName(s + g)!; return <figure key={s}><Art g={x} cache={cache} table={table} /><figcaption>{s + g}</figcaption></figure> })}
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
