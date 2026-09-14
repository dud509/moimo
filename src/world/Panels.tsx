import { useMemo, useRef, useState } from 'react'
import { CANVAS } from '../moimo/parts'
import type { AnchorTable } from '../moimo/parts'
import { composeMoimo, moimoDataUri, type PartsCache } from '../moimo/compose'
import { TOTAL_COMBINATIONS, explain, genesFromName, splitName } from '../moimo/name'
import { MoimoImg } from './World'
import type { Resident } from './model'

type Common = { cache: PartsCache; table: AnchorTable; onClose: () => void }

/* ------------------------------------------------------------------ */
/* 별사탕 유리병 — 이름을 넣으면 모이모가 태어난다                       */
/* ------------------------------------------------------------------ */

export function Jar({
  cache, table, onClose, onSend, count,
}: Common & { onSend: (name: string, note: string) => void; count: number }) {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')

  const parts = splitName(name)
  const genes = genesFromName(name)
  const preview: Resident | null = genes && parts
    ? { id: 'preview', name: parts.full, genes, x: 0, y: 0, flip: false, phase: 0, at: 0, mine: true }
    : null

  return (
    <div className="sheet">
      <header className="sheet-head">
        <div>
          <p className="eyebrow">별사탕 유리병</p>
          <h2>이름을 넣으면 모이모가 태어나요</h2>
        </div>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </header>

      <div className="jar-body">
        <div className="jar-stage">
          {preview ? (
            <MoimoImg resident={preview} cache={cache} table={table} size={230} className="pop" />
          ) : (
            <p className="jar-empty">이름을 적으면<br />여기에 나타나요</p>
          )}
        </div>

        <div className="jar-form">
          <label className="field">
            <span>이름</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="한글 이름"
              maxLength={10}
              autoFocus
            />
          </label>

          {name && !preview && <p className="warn">한글 이름으로 두 글자 이상 적어주세요</p>}

          {preview && parts && (
            <ul className="why">
              {explain(parts).map((r) => (
                <li key={r.slot}>
                  <b>{r.from}</b>의 {r.place} <b>{r.jamo}</b>
                  <span>→ {r.label}</span>
                </li>
              ))}
            </ul>
          )}

          <label className="field">
            <span>한마디</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="앨범에 남길 한 줄 (선택)"
              maxLength={40}
            />
          </label>

          <button
            className="btn primary wide"
            disabled={!preview}
            onClick={() => preview && onSend(preview.name, note.trim())}
          >
            마을로 보내기
          </button>

          <p className="footnote">
            지금 {count.toLocaleString('ko-KR')}명이 모여 있어요 ·
            가능한 조합 {TOTAL_COMBINATIONS.toLocaleString('ko-KR')}가지
          </p>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 카메라 — 같이 사진찍기                                               */
/* ------------------------------------------------------------------ */

export function Camera({
  cache, table, onClose, residents,
}: Common & { residents: Resident[] }) {
  const [picked, setPicked] = useState<Resident[]>(() => residents.slice(-4).reverse())
  const frameRef = useRef<HTMLDivElement>(null)
  const [saved, setSaved] = useState(false)

  const toggle = (r: Resident) =>
    setPicked((p) => p.some((x) => x.id === r.id)
      ? p.filter((x) => x.id !== r.id)
      : p.length >= 5 ? p : [...p, r])

  const save = async () => {
    const W = 1200
    const H = 800
    const cv = document.createElement('canvas')
    cv.width = W
    cv.height = H
    const ctx = cv.getContext('2d')!
    ctx.fillStyle = '#FFFDF4'
    ctx.fillRect(0, 0, W, H)

    const size = 300
    const gap = Math.min(240, (W - 160) / Math.max(1, picked.length))
    const startX = W / 2 - (gap * (picked.length - 1)) / 2

    await Promise.all(picked.map((r, i) => new Promise<void>((done) => {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, startX + gap * i - size / 2, H / 2 - size / 2 - 20, size, size)
        done()
      }
      img.onerror = () => done()
      img.src = moimoDataUri(composeMoimo(r.genes, cache, table))
    })))

    ctx.fillStyle = '#38312A'
    ctx.font = '600 30px Pretendard, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(picked.map((r) => r.name).join('  ·  '), W / 2, H - 90)
    ctx.font = '500 20px Pretendard, sans-serif'
    ctx.fillStyle = '#9C907F'
    ctx.fillText('MOIMO WORLD', W / 2, H - 50)

    const a = document.createElement('a')
    a.href = cv.toDataURL('image/png')
    a.download = `moimo-${picked.map((r) => r.name).join('-') || 'photo'}.png`
    a.click()
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  return (
    <div className="sheet">
      <header className="sheet-head">
        <div>
          <p className="eyebrow">카메라</p>
          <h2>같이 사진찍기</h2>
        </div>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </header>

      <div className="pad">
        <div className="photo" ref={frameRef}>
          {picked.length
            ? picked.map((r) => (
                <div key={r.id} className="photo-one">
                  <MoimoImg resident={r} cache={cache} table={table} size={120} />
                  <b>{r.name}</b>
                </div>
              ))
            : <p className="empty">아래에서 같이 찍을 모이모를 골라주세요</p>}
        </div>

        <div className="row">
          <span className="hint-sm">최대 5명까지 · 눌러서 넣고 빼요</span>
          <button className="btn primary" disabled={!picked.length} onClick={save}>
            {saved ? '저장했어요' : '사진 저장'}
          </button>
        </div>

        <div className="picks">
          {[...residents].reverse().slice(0, 60).map((r) => (
            <button
              key={r.id}
              className={`pick${picked.some((x) => x.id === r.id) ? ' on' : ''}`}
              onClick={() => toggle(r)}
            >
              <MoimoImg resident={r} cache={cache} table={table} size={54} />
              <span>{r.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 앨범 — 생성 기록과 방명록                                            */
/* ------------------------------------------------------------------ */

export function Album({
  cache, table, onClose, residents, onFocus,
}: Common & { residents: Resident[]; onFocus: (r: Resident) => void }) {
  const made = useMemo(
    () => residents.filter((r) => r.at > 0).sort((a, b) => b.at - a.at),
    [residents],
  )
  const when = (t: number) => new Date(t).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="sheet">
      <header className="sheet-head">
        <div>
          <p className="eyebrow">앨범</p>
          <h2>{made.length}명이 다녀갔어요</h2>
        </div>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </header>

      <div className="log">
        {made.map((r) => (
          <button key={r.id} className="log-row" onClick={() => onFocus(r)}>
            <MoimoImg resident={r} cache={cache} table={table} size={62} />
            <div className="log-text">
              <b>{r.name}</b>
              {r.note && <p className="note-line">“{r.note}”</p>}
              <time>{when(r.at)}</time>
            </div>
          </button>
        ))}
        {!made.length && (
          <p className="empty">아직 아무도 만들지 않았어요.<br />별사탕 유리병에서 첫 모이모를 만들어보세요.</p>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 돋보기 — 이름 찾아보기                                               */
/* ------------------------------------------------------------------ */

export function Glass({
  onClose, residents, query, setQuery, showNames, setShowNames, onFocus, cache, table,
}: Common & {
  residents: Resident[]
  query: string
  setQuery: (v: string) => void
  showNames: boolean
  setShowNames: (v: boolean) => void
  onFocus: (r: Resident) => void
}) {
  const hits = useMemo(() => {
    const q = query.trim()
    if (!q) return []
    return residents.filter((r) => r.name.includes(q))
  }, [residents, query])

  return (
    <div className="sheet narrow">
      <header className="sheet-head">
        <div>
          <p className="eyebrow">돋보기</p>
          <h2>이름 찾아보기</h2>
        </div>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </header>

      <div className="pad">
        <label className="field">
          <span>검색</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="이름 일부" autoFocus />
        </label>

        <label className="check">
          <input type="checkbox" checked={showNames} onChange={(e) => setShowNames(e.target.checked)} />
          마을에 이름표 모두 띄우기
        </label>

        {query.trim() && (
          <div className="hits">
            <p className="hint-sm">{hits.length}명 찾음</p>
            {hits.slice(0, 40).map((r) => (
              <button key={r.id} className="hit" onClick={() => onFocus(r)}>
                <MoimoImg resident={r} cache={cache} table={table} size={44} />
                <b>{r.name}</b>
                <span>보러 가기</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

export function Card({
  resident, cache, table, onClose,
}: { resident: Resident } & Common) {
  const parts = splitName(resident.name)
  return (
    <div className="card">
      <button className="icon-btn tiny" onClick={onClose}>✕</button>
      <MoimoImg resident={resident} cache={cache} table={table} size={130} />
      <b className="card-name">{resident.name}</b>
      {resident.note && <p className="note-line">“{resident.note}”</p>}
      {parts && (
        <ul className="why small">
          {explain(parts).slice(0, 3).map((r) => (
            <li key={r.slot}><b>{r.jamo}</b><span>→ {r.label}</span></li>
          ))}
        </ul>
      )}
      <span className="dim-note">캔버스 {CANVAS}px 기준</span>
    </div>
  )
}
