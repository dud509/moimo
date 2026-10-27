import { useEffect, useMemo, useRef, useState } from 'react'
import { CANVAS, PASTEL_BG } from '../moimo/parts'
import type { AnchorTable } from '../moimo/parts'
import { composeMoimo, moimoDataUri, type PartsCache } from '../moimo/compose'
import { explain, genesFromName, splitName } from '../moimo/name'
import { goodsSvg } from '../moimo/exportSvg'
import { MoimoImg } from './World'
import type { Resident } from './model'

type Common = { cache: PartsCache; table: AnchorTable; onClose: () => void }

/* ------------------------------------------------------------------ */
/* 별사탕 유리병 — 이름을 넣으면 모이모가 태어난다                       */
/* ------------------------------------------------------------------ */

export function Jar({
  cache, table, onClose, onSend, closeRef,
}: Common & {
  onSend: (name: string, note: string) => void
  /** 창 바깥을 눌렀을 때 쓸 닫기 — ✕ 와 똑같이 단계에 맞춰 닫는다 */
  closeRef?: { current: (() => void) | null }
}) {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  /** 이름 넣기 → 아기요정 마법 → 태어난 모이모와 방명록 */
  const [step, setStep] = useState<'name' | 'magic' | 'born'>('name')
  const sent = useRef(false)

  const parts = splitName(name)
  const genes = genesFromName(name)
  const born: Resident | null = genes && parts
    ? { id: 'preview', name: parts.full, genes, x: 0, y: 0, phase: 0, at: 0, mine: true }
    : null

  const make = () => {
    if (!born) return
    setStep('magic')
    window.setTimeout(() => setStep('born'), MAGIC_MS)
  }
  // 태어난 뒤에는 방명록을 쓰든 안 쓰든, 창을 닫으면 마을로 간다
  const finish = () => {
    if (!born || sent.current) return
    sent.current = true
    onSend(born.name, note.trim())
  }
  const close = () => (step === 'born' ? finish() : step === 'name' ? onClose() : undefined)
  if (closeRef) closeRef.current = close

  return (
    // 유리병 그림(ui_jar_bg.svg)을 창으로 쓰고, 원래 모습·이름 칸·✕ 만 위에 얹는다
    <div className={`jar-ui jar-${step}`}>
      <img className="jar-ui-bg" src="/world/ui_jar_bg.svg" alt="" draggable={false} />
      {step !== 'magic' && <button className="jar-ui-x" onClick={close} aria-label="닫기" />}

      <div className="jar-ui-stage">
        {step === 'name' && <img className="jar-ui-base" src="/world/ui_jar_base.svg" alt="" draggable={false} />}
        {step === 'magic' && (
          <div className="magic">
            <img className="jar-ui-base shake" src="/world/ui_jar_base.svg" alt="" draggable={false} />
            <img className="fairy f1" src="/items/guide01.svg" alt="" draggable={false} />
            <img className="fairy f2" src="/items/guide02.svg" alt="" draggable={false} />
            {SPARKS.map((sp, i) => <i key={i} className="spark" style={{ left: `${sp[0]}%`, top: `${sp[1]}%`, animationDelay: `${sp[2]}s` }}>✦</i>)}
          </div>
        )}
        {step === 'born' && born && (
          <div className="born">
            <p className="jar-ui-says">{born.name} 모이모가 태어났어요!</p>
            <MoimoImg resident={born} cache={cache} table={table} size={260} className="soft-in" />
          </div>
        )}
      </div>

      <div className="jar-ui-pill">
        {step === 'name' && (
          <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') make() }}
              placeholder="이름을 입력해주세요!"
              aria-label="이름"
              maxLength={10}
              autoFocus
            />
            <button className="jar-ui-go" disabled={!born} onClick={make} aria-label="만들기"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h13M13 6l6 6-6 6" /></svg></button>
          </>
        )}
        {step === 'magic' && <p className="jar-ui-wait">아기요정들이 마법을 부리는 중…</p>}
        {step === 'born' && (
          <>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') finish() }}
              placeholder="한마디 남겨주세요"
              aria-label="방명록"
              maxLength={40}
              autoFocus
            />
            {/* 비워 두면 방명록 없이 마을로 간다 */}
            <button className="jar-ui-go" onClick={finish} aria-label={note.trim() ? '남기기' : '마을로 가기'}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h13M13 6l6 6-6 6" /></svg></button>
          </>
        )}
      </div>
      {step === 'name' && name && !born && <p className="jar-ui-warn">한글 이름으로 두 글자 이상 적어주세요</p>}
    </div>
  )
}

/** 아기요정 마법 시간 */
const MAGIC_MS = 2800
/** 반짝이 자리 — 왼쪽 %, 위 %, 늦게 시작 */
const SPARKS: [number, number, number][] = [[18, 22, 0], [76, 18, 0.4], [30, 58, 0.8], [70, 52, 0.2], [50, 12, 0.6], [12, 44, 1.0], [86, 36, 1.2]]

/* ------------------------------------------------------------------ */
/* 카메라 — 같이 사진찍기                                               */
/* ------------------------------------------------------------------ */

/** 같이 찍을 수 있는 모이모 수 */
const CAM_MAX = 2
/** 모이모가 사진 속에 설 자리 — 가로 가운데(%) · 사람 얼굴은 가운데에 오니 양옆으로 비킨다 */
const CAM_SPOTS = [[80], [18, 82]]
/** 포즈 이름 — POSES 순서 */
const POSE_NAMES = ['기본', '갸웃', '브이', '양손', '빼꼼']
/** 빼꼼 포즈 — 손이 사진 아래 테두리에 얹히게, 그림 위에서부터 손 아래끝 높이(비율) */
const PEEK_POSE = 4
const PEEK_LINE = 0.63
/** 서 있는 포즈의 발끝 높이(그림 위에서부터 비율) — 발이 사진 아래 테두리에 닿게 */
const FEET_LINE = 0.8
/** 사진 속 모이모 크기 — 사진 너비에 대한 비율 */
const CAM_SIZE = 0.62

export function Camera({
  cache, table, onClose, residents,
}: Common & { residents: Resident[] }) {
  const [picked, setPicked] = useState<Resident[]>(() => residents.filter((r) => r.mine).slice(-1))
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cam, setCam] = useState<'wait' | 'on' | 'off'>('wait')
  const [count, setCount] = useState(0)
  const [shot, setShot] = useState<string | null>(null)

  // 창이 열려 있는 동안만 웹캠을 켠다
  useEffect(() => {
    let stream: MediaStream | null = null
    let gone = false
    const md = navigator.mediaDevices
    if (!md?.getUserMedia) { setCam('off'); return }
    md.getUserMedia({ video: { width: 1280, height: 960, facingMode: 'user' }, audio: false }).then(
      (s) => {
        if (gone) { s.getTracks().forEach((t) => t.stop()); return }
        stream = s
        const v = videoRef.current
        if (v) { v.srcObject = s; void v.play() }
        setCam('on')
      },
      () => setCam('off'),
    )
    return () => { gone = true; stream?.getTracks().forEach((t) => t.stop()) }
  }, [])

  const toggle = (r: Resident) =>
    setPicked((p) => p.some((x) => x.id === r.id)
      ? p.filter((x) => x.id !== r.id)
      : p.length >= CAM_MAX ? p : [...p, r])

  const [pose, setPose] = useState(0)
  const [query, setQuery] = useState('')
  const spots = CAM_SPOTS[Math.max(0, picked.length - 1)]
  const art = useMemo(
    () => picked.map((r) => moimoDataUri(composeMoimo(r.genes, cache, table, { pose }))),
    [picked, cache, table, pose],
  )
  // 사진 속에서 모이모 발(또는 빼꼼 포즈의 손)이 닿는 높이 — 그림 위에서부터의 비율
  const foot = pose === PEEK_POSE ? PEEK_LINE : FEET_LINE
  // 포즈 고르기 미리보기 — 고른 첫 모이모(없으면 가장 최근 모이모)로
  const sample = picked[0] ?? residents[residents.length - 1]
  const poseArt = useMemo(
    () => (sample ? POSE_NAMES.map((_, p) => moimoDataUri(composeMoimo(sample.genes, cache, table, { pose: p })
      // 미리보기는 몸 쪽만 크게 — 그림 둘레 여백을 잘라 낸다
      .replace(/viewBox="[^"]*"/, 'viewBox="96 120 320 320"'))) : []),
    [sample, cache, table],
  )
  const q = query.trim()
  const found = q ? residents.filter((r) => r.name.includes(q)).slice(0, 20) : []

  /** 3·2·1 세고 찍는다 */
  const start = () => {
    setCount(3)
    let n = 3
    const tick = window.setInterval(() => {
      n -= 1
      if (n > 0) { setCount(n); return }
      window.clearInterval(tick)
      setCount(0)
      void snap()
    }, 800)
  }

  /** 웹캠 화면(거울처럼 뒤집어)과 모이모를 한 장에 굽는다 — 아래는 폴라로이드 여백 */
  const snap = async () => {
    const v = videoRef.current
    // 카메라 그림의 화면 칸(1304×758)과 같은 비율로 찍는다
    const W = 1368, H = 796, PAD = 40, FOOT = 170
    const cv = document.createElement('canvas')
    cv.width = W + PAD * 2
    cv.height = H + PAD + FOOT
    const ctx = cv.getContext('2d')!
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, cv.width, cv.height)
    ctx.fillStyle = '#E5F0FB'
    ctx.fillRect(PAD, PAD, W, H)
    if (v && cam === 'on' && v.videoWidth) {
      // 화면을 꽉 채우게 가운데를 잘라 쓴다
      const k = Math.max(W / v.videoWidth, H / v.videoHeight)
      const dw = v.videoWidth * k, dh = v.videoHeight * k
      ctx.save()
      ctx.beginPath(); ctx.rect(PAD, PAD, W, H); ctx.clip()
      ctx.translate(PAD + W, PAD); ctx.scale(-1, 1)
      ctx.drawImage(v, (W - dw) / 2, (H - dh) / 2, dw, dh)
      ctx.restore()
    }
    ctx.save()
    ctx.beginPath(); ctx.rect(PAD, PAD, W, H); ctx.clip()
    const size = W * CAM_SIZE
    await Promise.all(art.map((src, i) => new Promise<void>((done) => {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, PAD + (W * spots[i]) / 100 - size / 2, PAD + H - size * foot, size, size)
        done()
      }
      img.onerror = () => done()
      img.src = src
    })))
    ctx.restore()
    ctx.fillStyle = '#38312A'
    ctx.font = '700 34px Pretendard, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(picked.map((r) => r.name).join('  ·  '), cv.width / 2, H + PAD + 78)
    ctx.font = '600 22px Pretendard, sans-serif'
    ctx.fillStyle = '#9C907F'
    ctx.fillText('MOIMO WORLD', cv.width / 2, H + PAD + 120)
    setShot(cv.toDataURL('image/png'))
  }

  const save = () => {
    if (!shot) return
    const a = document.createElement('a')
    a.href = shot
    a.download = `moimo-${picked.map((r) => r.name).join('-') || 'photo'}.png`
    a.click()
  }

  return (
    // 카메라 그림(ui_camera.svg)을 창으로 쓴다 — 화면 칸에 웹캠, 동그란 버튼이 셔터, 아래 띠에 고르는 목록
    <div className="cam-ui">
      <img className="cam-ui-bg" src="/world/ui_camera.svg" alt="" draggable={false} />
      <button className="cam-ui-x" onClick={onClose} aria-label="닫기" />
      <button
        className="cam-ui-shutter"
        disabled={!picked.length || count > 0 || !!shot}
        onClick={start}
        aria-label="찰칵"
        title="찰칵"
      />

      <div className="cam-ui-screen">
        {shot ? (
          <img className="cam-shot" src={shot} alt="찍은 사진" />
        ) : (
          <>
            <video ref={videoRef} muted playsInline />
            {cam !== 'on' && (
              <p className="cam-msg">{cam === 'wait' ? '카메라를 켜는 중…' : '카메라를 쓸 수 없어요 — 모이모만 찍혀요'}</p>
            )}
            {count > 0 && <b className="cam-count" key={count}>{count}</b>}
          </>
        )}
      </div>
      {/* 모이모는 화면 칸 위에 따로 얹고 화면 칸 모양으로 자른다 — 넘치면 귀 끝이 잘리는 편이 낫다 */}
      {!shot && (
        <div className="cam-ui-cast">
          {art.map((src, i) => (
            <img key={picked[i].id} className="cam-moimo" src={src} alt=""
              style={{ left: `${spots[i]}%`, width: `${CAM_SIZE * 100}%`, transform: `translate(-50%, ${(1 - foot) * 100}%)` }} />
          ))}
        </div>
      )}

      <div className="cam-ui-side">
        {shot ? (
          <>
            <button className="btn primary" onClick={save}>사진 저장</button>
            <button className="btn" onClick={() => setShot(null)}>다시 찍기</button>
          </>
        ) : (
          <p className="cam-ui-tip">모이모를 고르고<br />버튼을 눌러보세요<br />(최대 두 명)</p>
        )}
      </div>

      {/* 카메라 아래 분홍 띠 — 포즈 고르기 */}
      {!shot && (
        <div className="cam-ui-poses">
          {POSE_NAMES.map((label, p) => (
            <button key={p} className={`cam-ui-pose${pose === p ? ' on' : ''}`} onClick={() => setPose(p)} title={label}>
              {poseArt[p] && <img src={poseArt[p]} alt="" />}
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 카메라 바깥 아래 — 이름 찾기와 최근 모이모 */}
      {!shot && (
        <div className="cam-ui-below">
        <div className="cam-ui-find">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="이름 찾기" aria-label="이름 찾기" />
          {q && !found.length && <p>아직 생성되지 않았어요!</p>}
        </div>
        <div className="cam-ui-picks">
          {(q ? found : [...residents].reverse().slice(0, 60)).map((r) => (
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
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 선물 상자 — 굿즈 구경하기 (판매는 전시장에서만)                        */
/* ------------------------------------------------------------------ */

/**
 * 굿즈 목록. 사진은 public/goods/<id>.png 로 넣으면 뜬다(없으면 '사진 준비 중').
 * price 를 비워 두면 '현장에서 확인'으로 나온다.
 */
const GOODS: { id: string; name: string; price?: string; note?: string }[] = [
  { id: 'acrylic', name: '아크릴 키링', price: '3,500원', note: '24종 · 디자인당 6세트 한정' },
  { id: 'badge', name: '뱃지 4개 세트', price: '5,000원', note: '3종 · 디자인당 6세트 한정' },
  { id: 'sticker', name: '조각 스티커', price: '나눔', note: '한 분당 1개씩만 드려요' },
]

export function Goods({ onClose }: { onClose: () => void }) {
  return (
    <div className="obj-modal goods-modal">
    <div className="sheet goods">
      <header className="sheet-head">
        <div>
          <h2>모이모 굿즈</h2>
          <p className="goods-sub">온라인 판매는 하지 않아요 · 전시장 현장에서 만나요!</p>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="닫기">✕</button>
      </header>
      <div className="goods-grid">
        {GOODS.map((g) => (
          <figure key={g.id} className="goods-card">
            <span className="goods-pic">
              <img src={`/goods/${g.id}.png`} alt={g.name} onError={(e) => { e.currentTarget.style.display = 'none' }} />
              <i>사진 준비 중</i>
            </span>
            <figcaption>
              <b>{g.name}</b>
              <span>{g.price ?? '가격은 현장에서'}</span>
              {g.note && <small>{g.note}</small>}
            </figcaption>
          </figure>
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
    // 다이어리 그림(ui_dariy.svg)을 창으로 쓰고, 맨 앞 속지 자리에 사진을 붙인다
    <div className="album-ui">
      <img className="album-ui-bg" src="/world/ui_dariy.svg" alt="" draggable={false} />
      <div className="album-ui-page">
      <header className="album-ui-head">
        <h2>{made.length}명이 다녀갔어요</h2>
        <button className="icon-btn" onClick={onClose} aria-label="닫기">✕</button>
      </header>

      {/* 사진 앨범처럼 — 한 줄에 셋, 모이모마다 폴라로이드 한 장 */}
      <div className="album-grid">
        {made.map((r, i) => (
          <button key={r.id} className="album-photo" style={{ rotate: `${((i * 37) % 5) - 2}deg` }} onClick={() => onFocus(r)}>
            <span className="album-pic" style={{ background: PASTEL_BG[r.genes.color - 1] ?? PASTEL_BG[0] }}><MoimoImg resident={r} cache={cache} table={table} size={120} /></span>
            <b>{r.name}</b>
            {r.note && <p>“{r.note}”</p>}
            <time>{when(r.at)}</time>
          </button>
        ))}
        {!made.length && (
          <p className="empty">아직 아무도 만들지 않았어요.<br />별사탕 유리병에서 첫 모이모를 만들어보세요.</p>
        )}
      </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

/**
 * 굿즈용 SVG 저장 버튼을 보일지. 굿즈를 만들 때만 쓰고, 전시에 내놓기 전에는
 * false 로 꺼 둔다.
 */
const GOODS_EXPORT = true

/**
 * 모이모 한 마리를 SVG 파일로 내려받는다 — 굿즈용.
 * 그림이 차지하는 만큼만 잘라 여백을 줄이고, 배경은 투명하게 둔다.
 * 벡터라 아무리 키워도 깨지지 않는다.
 */
async function saveSvg(resident: Resident, cache: PartsCache, table: AnchorTable) {
  const file = await goodsSvg(resident.genes, resident.name, cache, table)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([file], { type: 'image/svg+xml' }))
  a.download = `모이모_${resident.name}.svg`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

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
      {GOODS_EXPORT && (
        <button className="goods-btn" onClick={() => { void saveSvg(resident, cache, table) }}>SVG 저장 (굿즈용)</button>
      )}
    </div>
  )
}
