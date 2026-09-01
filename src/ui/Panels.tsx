import { useMemo, useState } from 'react'
import { Moimo } from '../moimo/Moimo'
import {
  SLOTS, TOTAL_COMBINATIONS, describeGenes, encodeGenes, randomGenes, randomName, type Genes,
} from '../moimo/genes'
import type { Resident } from '../village/world'

/* ------------------------------------------------------------------ */
/* 도감                                                                */
/* ------------------------------------------------------------------ */

export function Archive({
  residents, onClose, onFocus,
}: { residents: Resident[]; onClose: () => void; onFocus: (r: Resident) => void }) {
  const [mineOnly, setMineOnly] = useState(false)
  const [q, setQ] = useState('')

  const list = useMemo(() => {
    const base = mineOnly ? residents.filter((r) => r.mine) : residents
    const needle = q.trim()
    const filtered = needle ? base.filter((r) => r.name.includes(needle)) : base
    return [...filtered].sort((a, b) => b.at - a.at)
  }, [residents, mineOnly, q])

  const mineCount = residents.filter((r) => r.mine).length

  return (
    <div className="sheet">
      <header className="sheet-head">
        <div>
          <p className="eyebrow">모이모 도감</p>
          <h2>마을에 사는 {residents.length.toLocaleString('ko-KR')}명</h2>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="닫기">✕</button>
      </header>

      <div className="filters">
        <button className={`chip${!mineOnly ? ' on' : ''}`} onClick={() => setMineOnly(false)}>전체 {residents.length}</button>
        <button className={`chip${mineOnly ? ' on' : ''}`} onClick={() => setMineOnly(true)}>내가 만든 {mineCount}</button>
        <input className="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름으로 찾기" aria-label="이름으로 찾기" />
      </div>

      <div className="grid">
        {list.map((r) => (
          <button key={r.id} className={`card${r.mine ? ' mine' : ''}`} onClick={() => onFocus(r)}>
            <Moimo genes={r.genes} size={72} ignoreSizeGene animate={false} />
            <b>{r.name}</b>
            <i>{encodeGenes(r.genes)}</i>
          </button>
        ))}
        {!list.length && <p className="empty">아직 없어요. 공방에서 한 명 만들어 보내볼까요?</p>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 조합의 나무                                                          */
/* ------------------------------------------------------------------ */

export function Combinations({ residents, onClose }: { residents: Resident[]; onClose: () => void }) {
  const distinct = useMemo(
    () => new Set(residents.map((r) => encodeGenes(r.genes))).size,
    [residents],
  )
  const max = Math.max(...SLOTS.map((s) => s.options.length))
  const seenRatio = distinct / TOTAL_COMBINATIONS

  return (
    <div className="sheet">
      <header className="sheet-head">
        <div>
          <p className="eyebrow">조합의 나무</p>
          <h2>모이모는 몇 가지일까</h2>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="닫기">✕</button>
      </header>

      <div className="pad">
        <p className="lead">
          모이모는 아홉 칸의 조합으로 만들어져요. 칸마다 고를 수 있는 것을 전부 곱하면
        </p>
        <p className="bignum">{TOTAL_COMBINATIONS.toLocaleString('ko-KR')}<span>가지</span></p>

        <ul className="slots">
          {SLOTS.map((s) => (
            <li key={s.key}>
              <span className="slot-name">{s.label}</span>
              <span className="bar"><i style={{ width: `${(s.options.length / max) * 100}%` }} /></span>
              <span className="slot-n">{s.options.length}</span>
            </li>
          ))}
        </ul>

        <div className="stat-row">
          <div className="stat">
            <b>{distinct.toLocaleString('ko-KR')}</b>
            <span>지금까지 이 마을에 나타난 조합</span>
          </div>
          <div className="stat">
            <b>{(seenRatio * 100).toFixed(6)}%</b>
            <span>전체 중 우리가 본 만큼</span>
          </div>
        </div>

        <p className="note">
          하루에 백 명씩 만들어도 전부 보려면 <b>{Math.round(TOTAL_COMBINATIONS / 100 / 365).toLocaleString('ko-KR')}년</b>이 걸려요.
          그래서 당신이 방금 만든 모이모는, 아마 세상에 하나뿐입니다.
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 분수 — 뽑기                                                          */
/* ------------------------------------------------------------------ */

export function Fountain({ onClose, onSend }: { onClose: () => void; onSend: (g: Genes, name: string) => void }) {
  const [draw, setDraw] = useState(() => ({ genes: randomGenes(), name: randomName(), key: 0 }))
  const roll = () => setDraw((d) => ({ genes: randomGenes(), name: randomName(), key: d.key + 1 }))

  return (
    <div className="sheet narrow">
      <header className="sheet-head">
        <div>
          <p className="eyebrow">한가운데 분수</p>
          <h2>오늘의 모이모 뽑기</h2>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="닫기">✕</button>
      </header>

      <div className="pad center">
        <div className="draw" key={draw.key}>
          <Moimo genes={draw.genes} size={200} ignoreSizeGene />
        </div>
        <h3 className="draw-name">{draw.name}</h3>
        <p className="desc">{describeGenes(draw.genes)}</p>
        <p className="code-plain">{encodeGenes(draw.genes)}</p>
        <div className="stage-actions">
          <button className="btn ghost" onClick={roll}>다시 뽑기</button>
          <button className="btn primary" onClick={() => onSend(draw.genes, draw.name)}>마을에 보내기</button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 안내소                                                              */
/* ------------------------------------------------------------------ */

export function Info({ count, onClose, onReset }: { count: number; onClose: () => void; onReset: () => void }) {
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="sheet narrow">
      <header className="sheet-head">
        <div>
          <p className="eyebrow">마을 안내소</p>
          <h2>모이모 MOIMO</h2>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="닫기">✕</button>
      </header>

      <div className="pad">
        <p className="lead">
          모이모는 아홉 칸의 조합으로 태어나는 캐릭터예요.
          한 명씩 만들어 보낼 때마다 이 마을에 그대로 남아, 방문한 사람 수만큼 마을이 북적여요.
        </p>
        <p className="lead">
          지금 이 마을에는 <b>{count.toLocaleString('ko-KR')}</b>명이 모여 있어요.
          가운데 광장부터 자리가 차서, 사람이 많아질수록 바깥으로 마을이 넓어집니다.
        </p>

        <ul className="howto">
          <li><b>드래그</b> — 마을을 자유롭게 둘러보기</li>
          <li><b>휠 / 손가락 오므리기</b> — 확대·축소</li>
          <li><b>큰 오브제 누르기</b> — 공방·도감·나무·분수·안내소</li>
          <li><b>모이모 누르기</b> — 이름과 유전자 보기</li>
        </ul>

        <p className="credit">졸업전시 프로젝트 · 모이모 마을</p>

        <div className="danger">
          {confirm ? (
            <>
              <span>정말 마을을 처음 상태로 되돌릴까요?</span>
              <button className="btn ghost" onClick={() => setConfirm(false)}>아니요</button>
              <button className="btn warn" onClick={onReset}>되돌리기</button>
            </>
          ) : (
            <button className="btn ghost" onClick={() => setConfirm(true)}>마을 초기화</button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 주민 카드                                                            */
/* ------------------------------------------------------------------ */

export function ResidentCard({
  resident, onClose, onRemix,
}: { resident: Resident; onClose: () => void; onRemix: (g: Genes) => void }) {
  return (
    <div className="popover" role="dialog" aria-label={`${resident.name} 정보`}>
      <button className="icon-btn tiny" onClick={onClose} aria-label="닫기">✕</button>
      <Moimo genes={resident.genes} size={110} ignoreSizeGene />
      <b className="pop-name">{resident.name}</b>
      <p className="desc small">{describeGenes(resident.genes)}</p>
      <p className="code-plain">{encodeGenes(resident.genes)}</p>
      {resident.mine && <span className="badge">내가 만든 모이모</span>}
      <button className="btn ghost wide" onClick={() => onRemix(resident.genes)}>이 조합으로 만들어 보기</button>
    </div>
  )
}
