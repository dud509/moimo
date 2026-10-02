import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadParts, type PartsCache } from './moimo/compose'
import { normalizeTable, type AnchorTable } from './moimo/parts'
import anchorsJson from './data/anchors.json'
import { World, type Camera, type WorldHandle } from './world/World'
import { Album, Camera as CameraPanel, Card, Glass, Jar } from './world/Panels'
import { measureFootprints } from './world/footprint'
import {
  DECOR, ITEMS, WORLD, loadWorld, setFootprints, residentFromName, resetWorld, saveWorld, seedCountFor, trimWorld,
  type ItemId, type Resident,
} from './world/model'
import './styles.css'

/**
 * 로고. `public/world/logo.png` 를 놓으면 그 그림을 쓰고,
 * 없으면 글자로 나온다. 배경 그림에 로고를 그려 넣었다면
 * 아래 `HIDE_BRAND` 를 true 로 두어 아예 지울 수 있다.
 */
const HIDE_BRAND = false

/**
 * 첫 클릭에 노래를 저절로 튼다. 브라우저는 사람이 화면을 한 번 누르기 전에는
 * 소리를 막으므로, 첫 클릭·터치 때 작은 소리로 시작한다. false 면 오른쪽 위
 * 소리 버튼을 눌러야만 나온다.
 */
const AUTO_MUSIC = false
/** 노래 소리 크기 (0~1) */
const MUSIC_VOLUME = 0.35

function Brand() {
  const [png, setPng] = useState(true)
  if (HIDE_BRAND) return <div className="brand" />
  if (png) {
    return (
      <div className="brand">
        <img className="brand-art" src="/world/logo.png" alt="모이모" onError={() => setPng(false)} draggable={false} />
      </div>
    )
  }
  return (
    <div className="brand">
      <span className="brand-mark">모이모</span>
      <span className="brand-sub">MOIMO WORLD</span>
    </div>
  )
}

export default function App() {
  const [cache, setCache] = useState<PartsCache | null>(null)
  // 모이모는 오브제 외곽선을 잰 뒤에 세운다 — 그림 위에 올라타지 않게
  const [residents, setResidents] = useState<Resident[]>([])
  const [settled, setSettled] = useState(false)
  const [panel, setPanel] = useState<ItemId | null>(null)
  const [selected, setSelected] = useState<Resident | null>(null)
  const [arrived, setArrived] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [showNames, setShowNames] = useState(false)
  const [query, setQuery] = useState('')
  const [, setCamera] = useState<Camera>({ tx: 0, ty: 0, scale: 0.6 })

  const worldRef = useRef<WorldHandle>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const table = useMemo<AnchorTable>(() => normalizeTable(anchorsJson), [])

  useEffect(() => { loadParts().then(setCache) }, [])
  useEffect(() => {
    measureFootprints([...ITEMS, ...DECOR].map((p) => p.src)).then((f) => {
      setFootprints(f)
      setResidents(trimWorld(loadWorld(seedCountFor(window.innerWidth, window.innerHeight))))
      setSettled(true)
    })
  }, [])
  // 다 세우기 전의 빈 마을을 저장하면 저장된 모이모가 날아간다
  useEffect(() => { if (settled) saveWorld(residents) }, [residents, settled])

  const say = useCallback((text: string) => {
    setToast(text)
    window.setTimeout(() => setToast((t) => (t === text ? null : t)), 2600)
  }, [])

  /*
   * 오브제 페이지 — 오브제를 누르면 그쪽으로 다가간 뒤 페이지로 넘어간다.
   * 주소 뒤에 #jar 처럼 붙여 두어 브라우저의 뒤로 가기로도 마을에 돌아온다.
   * 돌아오면 들어가기 전에 보던 자리로 물러난다.
   */
  const backCam = useRef<Camera | null>(null)
  const pushed = useRef(false)
  const restoreOnPop = useRef(true)

  const restoreCamera = useCallback(() => {
    const c = backCam.current
    backCam.current = null
    if (!c) return
    const box = document.querySelector('.world-box')
    const vw = box?.clientWidth ?? window.innerWidth
    const vh = box?.clientHeight ?? window.innerHeight
    worldRef.current?.flyTo((vw / 2 - c.tx) / c.scale, (vh / 2 - c.ty) / c.scale, c.scale)
  }, [])

  /** 페이지를 닫고 마을로 — restore 면 들어가기 전 자리로 물러난다 */
  const leave = useCallback((restore = true) => {
    if (pushed.current) {
      // 뒤로 가기와 같은 길로 닫는다. 닫는 일은 popstate 가 한다
      restoreOnPop.current = restore
      pushed.current = false
      window.history.back()
      return
    }
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname + window.location.search)
    setPanel(null)
    if (restore) restoreCamera()
    else backCam.current = null
  }, [restoreCamera])

  useEffect(() => {
    const onPop = () => {
      const id = window.location.hash.slice(1)
      if (ITEMS.some((it) => it.id === id)) { setPanel(id as ItemId); return }
      pushed.current = false
      setPanel(null)
      if (restoreOnPop.current) restoreCamera()
      else backCam.current = null
      restoreOnPop.current = true
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [restoreCamera])

  // 주소에 #jar 처럼 붙어 있으면 그 페이지로 바로 연다
  useEffect(() => {
    if (!settled) return
    const id = window.location.hash.slice(1)
    if (ITEMS.some((it) => it.id === id)) setPanel(id as ItemId)
  }, [settled])

  const send = useCallback((name: string, note: string) => {
    setResidents((prev) => {
      const r = residentFromName(name, prev.length, note || undefined, prev)
      if (!r) return prev
      leave(false)
      setArrived(r.id)
      window.setTimeout(() => {
        worldRef.current?.flyTo(r.x, r.y, Math.max(0.8, worldRef.current.camera().scale))
      }, 60)
      window.setTimeout(() => setArrived((id) => (id === r.id ? null : id)), 2400)
      say(`${r.name} 도착! 마을이 한 명 더 북적여요`)
      return trimWorld([...prev, r])
    })
  }, [say, leave])

  /** 마을 노래를 켜고 끈다. 파일이 없으면 그 사실을 알린다 */
  const audio = useCallback(() => {
    let a = audioRef.current
    if (!a) {
      a = new Audio('/sound/moimo.mp3')
      a.loop = true
      a.volume = MUSIC_VOLUME
      a.addEventListener('ended', () => setPlaying(false))
      audioRef.current = a
    }
    return a
  }, [])

  const toggleMusic = useCallback(() => {
    const a = audio()
    if (playing) {
      a.pause()
      setPlaying(false)
      return
    }
    a.play().then(
      () => setPlaying(true),
      () => say('public/sound/moimo.mp3 을 넣어주세요'),
    )
  }, [audio, playing, say])

  // 첫 클릭에 은은하게 — AUTO_MUSIC 이 켜져 있을 때만
  useEffect(() => {
    if (!AUTO_MUSIC) return
    const start = () => {
      audio().play().then(() => setPlaying(true), () => { /* 파일이 없으면 조용히 넘어간다 */ })
    }
    window.addEventListener('pointerdown', start, { once: true })
    return () => window.removeEventListener('pointerdown', start)
  }, [audio])

  const openItem = useCallback((id: ItemId) => {
    // 플레이어는 시트를 열지 않고 그 자리에서 켜고 끈다
    if (id === 'music') { toggleMusic(); return }
    const it = ITEMS.find((x) => x.id === id)!
    setSelected(null)
    // 오브제 쪽으로 성큼 다가간 뒤 페이지로 넘어간다
    backCam.current = worldRef.current?.camera() ?? null
    worldRef.current?.flyTo(it.x, it.y, 1.9)
    window.setTimeout(() => {
      setPanel(id)
      window.history.pushState({ page: id }, '', `#${id}`)
      pushed.current = true
    }, 620)
  }, [toggleMusic])

  const focus = useCallback((r: Resident) => {
    leave(false)
    worldRef.current?.flyTo(r.x, r.y, 1.3)
    window.setTimeout(() => setSelected(r), 420)
  }, [leave])

  const hits = useMemo(() => {
    const q = query.trim()
    if (!q) return null
    return new Set(residents.filter((r) => r.name.includes(q)).map((r) => r.id))
  }, [residents, query])

  if (!cache || !settled) {
    return (
      <div className="booting">
        <p>모이모를 부르는 중…</p>
      </div>
    )
  }

  const common = { cache, table, onClose: () => leave(true) }

  return (
    <div className="app">
      <World
        ref={worldRef}
        residents={residents}
        cache={cache}
        table={table}
        arrivedId={arrived}
        showNames={showNames}
        hits={hits}
        onItem={openItem}
        onResident={(r) => { setSelected(r) }}
        onCamera={setCamera}
      />

      <header className="topbar">
        <Brand />
        <div className="top-right">
          <div className="counter">
            <span>지금 모여 있는 모이모</span>
            <b>{residents.length.toLocaleString('ko-KR')}</b>
          </div>
          {/* 노래 — 꼭 필요한 기능은 아니라 구석에 작게 둔다. 처음엔 꺼져 있다 */}
          <button
            className={`sound-btn${playing ? ' on' : ''}`}
            onClick={toggleMusic}
            aria-label={playing ? '노래 끄기' : '노래 켜기'}
            title={playing ? '노래 끄기' : '노래 켜기'}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
              {playing ? (
                <>
                  <path d="M15.5 9a4 4 0 0 1 0 6" />
                  <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
                </>
              ) : (
                <path d="M16 9.5l5 5M21 9.5l-5 5" />
              )}
            </svg>
          </button>
        </div>
      </header>

      <nav className="dock">
        {ITEMS.map((it) => (
          <button key={it.id} onClick={() => openItem(it.id)}>{it.name}</button>
        ))}
        <button
          className="ghost"
          onClick={() => {
            resetWorld()
            setResidents(loadWorld(seedCountFor(window.innerWidth, window.innerHeight)))
            say('마을을 처음 상태로 되돌렸어요')
          }}
        >
          초기화
        </button>
      </nav>

      <button className="fab" onClick={() => openItem('jar')}>＋ 모이모 만들기</button>

      {selected && (
        <Card resident={selected} cache={cache} table={table} onClose={() => setSelected(null)} />
      )}

      {panel && (() => {
        const it = ITEMS.find((x) => x.id === panel)!
        return (
          <div className="page" key={panel}>
            <button className="page-back" onClick={() => leave(true)}>← 마을로</button>
            <aside className="page-hero">
              <img src={it.src} alt="" draggable={false} />
              <b>{it.name}</b>
              <i>{it.tag}</i>
            </aside>
            <section className="page-body">
              {panel === 'jar' && <Jar {...common} onSend={send} count={residents.length} />}
              {panel === 'camera' && <CameraPanel {...common} residents={residents} />}
              {panel === 'album' && <Album {...common} residents={residents} onFocus={focus} />}
              {panel === 'glass' && (
                <Glass
                  {...common}
                  residents={residents}
                  query={query}
                  setQuery={setQuery}
                  showNames={showNames}
                  setShowNames={setShowNames}
                  onFocus={focus}
                />
              )}
            </section>
          </div>
        )
      })()}

      {toast && <div className="toast">{toast}</div>}
      <span className="world-size" hidden>{WORLD.w}×{WORLD.h}</span>
    </div>
  )
}
