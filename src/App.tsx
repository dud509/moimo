import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadParts, type PartsCache } from './moimo/compose'
import { normalizeTable, type AnchorTable } from './moimo/parts'
import anchorsJson from './data/anchors.json'
import { World, type Camera, type WorldHandle } from './world/World'
import { Album, Camera as CameraPanel, Goods, Jar } from './world/Panels'
import { fetchShared, postShared } from './world/shared'
import { Manual } from './world/Manual'
import { measureFootprints } from './world/footprint'
import {
  DECOR, ITEMS, WORLD, loadWorld, setFootprints, residentFromName, saveWorld, trimWorld,
  type ItemId, type Resident,
} from './world/model'
import './styles.css'

/**
 * 로고. `public/world/logo.svg` 를 놓으면 그 그림을 쓰고,
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
/** 마우스를 따라다니는 아기요정 그림 */
const MOUSE_FAIRY = '/items/guide.svg'
/** 마우스를 화면 끝까지 옮겼을 때 마을이 따라 움직이는 거리(px) */
const PARALLAX_PX = 16
/** 함께 보는 마을을 몇 ms 마다 새로 받아 올지 */
const SYNC_MS = 5000
/** 이름표가 붙어 있는 시간 */
const TAG_MS = 4000

function Brand() {
  const [png, setPng] = useState(true)
  if (HIDE_BRAND) return <div className="brand" />
  if (png) {
    return (
      <div className="brand">
        <img className="brand-art" src="/world/logo.svg" alt="모이모" onError={() => setPng(false)} draggable={false} />
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
  /** 눌러서 이름표를 단 모이모 — 잠깐 뒤에 저절로 떼어진다 */
  const [tagged, setTagged] = useState<string | null>(null)
  const tagTimer = useRef(0)
  const tag = useCallback((id: string | null) => {
    window.clearTimeout(tagTimer.current)
    setTagged(id)
    if (id) tagTimer.current = window.setTimeout(() => setTagged(null), TAG_MS)
  }, [])
  const [arrived, setArrived] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  /** 돋보기를 들고 있나 — 렌즈에 대 본 모이모의 이름이 보인다 */
  const [lens, setLens] = useState(false)
  const [, setCamera] = useState<Camera>({ tx: 0, ty: 0, scale: 0.6 })

  const worldRef = useRef<WorldHandle>(null)
  const parRef = useRef<HTMLDivElement>(null)
  const fairyRef = useRef<HTMLImageElement>(null)
  const panelOpen = useRef(false)
  const jarClose = useRef<(() => void) | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const table = useMemo<AnchorTable>(() => normalizeTable(anchorsJson), [])

  useEffect(() => { loadParts().then(setCache) }, [])

  useEffect(() => { panelOpen.current = panel !== null }, [panel])

  // 마우스 쪽으로 아기요정이 살짝 늦게 따라오고, 마을은 반대쪽으로 조금 밀린다
  useEffect(() => {
    let mx = window.innerWidth / 2, my = window.innerHeight / 2
    let fx = mx, fy = my, px = 0, py = 0, raf = 0
    const onMove = (e: PointerEvent) => {
      mx = e.clientX; my = e.clientY
      if (fairyRef.current) fairyRef.current.style.opacity = '1'
      wake()
    }
    // 커서가 창 밖으로 나가면 요정도 같이 숨는다
    const onOut = (e: MouseEvent) => { if (!e.relatedTarget && fairyRef.current) fairyRef.current.style.opacity = '0' }
    // 다 따라잡으면 멈춰 쉰다 — 가만히 있을 때까지 매 프레임 마을을 옮기면 사파리가 버벅인다
    const step = () => {
      fx += (mx + 14 - fx) * 0.2
      fy += (my + 10 - fy) * 0.2
      let moving = Math.abs(mx + 14 - fx) > 0.3 || Math.abs(my + 10 - fy) > 0.3
      // 창이 떠 있는 동안은 뒤의 마을을 그 자리에 세워 둔다
      if (!panelOpen.current) {
        const tx = -(mx / window.innerWidth - 0.5) * 2 * PARALLAX_PX
        const ty = -(my / window.innerHeight - 0.5) * 2 * PARALLAX_PX
        px += (tx - px) * 0.06
        py += (ty - py) * 0.06
        if (Math.abs(tx - px) > 0.05 || Math.abs(ty - py) > 0.05) moving = true
        if (parRef.current) parRef.current.style.transform = `translate3d(${px.toFixed(2)}px, ${py.toFixed(2)}px, 0)`
      }
      if (fairyRef.current) fairyRef.current.style.transform = `translate(${fx}px, ${fy}px)`
      raf = moving ? requestAnimationFrame(step) : 0
    }
    const wake = () => { if (!raf) raf = requestAnimationFrame(step) }
    window.addEventListener('pointermove', onMove)
    document.addEventListener('mouseout', onOut)
    raf = requestAnimationFrame(step)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('mouseout', onOut)
      cancelAnimationFrame(raf)
    }
  }, [])
  /** 서버의 함께 보는 마을에 붙었나 — 아니면 이 브라우저에만 저장한다 */
  const shared = useRef(false)
  useEffect(() => {
    // 전시 오픈 — 미리 심어 둔 이웃 없이 빈 마을에서 시작한다
    Promise.all([measureFootprints([...ITEMS, ...DECOR].map((p) => p.src)), fetchShared()]).then(([f, list]) => {
      setFootprints(f)
      shared.current = list !== null
      setResidents(trimWorld(list ?? loadWorld(0)))
      setSettled(true)
    })
  }, [])
  // 다른 사람이 만든 모이모도 몇 초마다 받아 온다. 막 보낸 것이 아직 서버에 없으면 그대로 둔다
  useEffect(() => {
    if (!settled || !shared.current) return
    const t = window.setInterval(() => {
      if (document.hidden) return
      fetchShared().then((list) => {
        if (!list) return
        setResidents((prev) => {
          const ids = new Set(list.map((r) => r.id))
          const pending = prev.filter((r) => !ids.has(r.id) && Date.now() - r.at < 30_000)
          if (!pending.length && list.length === prev.length && list.every((r, i) => r.id === prev[i]?.id)) return prev
          return trimWorld([...list, ...pending])
        })
      })
    }, SYNC_MS)
    return () => window.clearInterval(t)
  }, [settled])
  // 다 세우기 전의 빈 마을을 저장하면 저장된 모이모가 날아간다
  useEffect(() => { if (settled && !shared.current) saveWorld(residents) }, [residents, settled])

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

  // Esc 로 돋보기를 내려놓는다
  useEffect(() => {
    if (!lens) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLens(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lens])

  // 주소에 #jar 처럼 붙어 있으면 그 페이지로 바로 연다
  useEffect(() => {
    if (!settled) return
    const id = window.location.hash.slice(1)
    if (ITEMS.some((it) => it.id === id)) setPanel(id as ItemId)
  }, [settled])

  // 지금 마을 — send 에서 자리를 정할 때 읽는다 (갱신 함수 안에서 서버로 보내면 두 번 갈 수 있다)
  const residentsRef = useRef(residents)
  residentsRef.current = residents
  const send = useCallback((name: string, note: string) => {
    const prev = residentsRef.current
    const r = residentFromName(name, prev.length, note || undefined, prev)
    if (!r) return
    leave(false)
    setArrived(r.id)
    window.setTimeout(() => {
      worldRef.current?.flyTo(r.x, r.y, Math.max(0.8, worldRef.current.camera().scale))
    }, 60)
    window.setTimeout(() => setArrived((id) => (id === r.id ? null : id)), 2400)
    say(`${r.name} 도착! 한층 복작여졌어요`)
    if (shared.current) postShared(r)
    setResidents((list) => trimWorld([...list, r]))
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
    // 돋보기는 페이지로 가지 않고 손에 든다
    if (id === 'glass') { tag(null); setLens((v) => !v); return }
    const it = ITEMS.find((x) => x.id === id)!
    tag(null)
    // 오브제 쪽으로 성큼 다가간 뒤 페이지로 넘어간다
    backCam.current = worldRef.current?.camera() ?? null
    // 너무 당기면 화면이 깨진 것처럼 보여 살짝만 다가간다
    worldRef.current?.flyTo(it.x, it.y, 1.15)
    window.setTimeout(() => {
      setPanel(id)
      window.history.pushState({ page: id }, '', `#${id}`)
      pushed.current = true
    }, 620)
  }, [toggleMusic, tag])

  const focus = useCallback((r: Resident) => {
    leave(false)
    worldRef.current?.flyTo(r.x, r.y, 1.3)
    window.setTimeout(() => tag(r.id), 420)
  }, [leave, tag])

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
      {/* 마우스를 따라 마을이 살짝 같이 움직인다 */}
      <div className="parallax" ref={parRef}>
      <World
        ref={worldRef}
        residents={residents}
        cache={cache}
        table={table}
        arrivedId={arrived}
        showNames={false}
        hits={null}
        lens={lens}
        onItem={openItem}
        onResident={(r) => tag(tagged === r.id ? null : r.id)}
        tagged={tagged}
        onCamera={setCamera}
      />
      </div>
      {!lens && <img className="mouse-fairy" ref={fairyRef} src={MOUSE_FAIRY} alt="" draggable={false} />}

      <header className="topbar">
        <Brand />
        <div className="top-right">
          <div className="counter">
            <span>지금 모여 있는 모이모</span>
            <b>{residents.length.toLocaleString('ko-KR')}</b>
          </div>
        </div>
      </header>


      {lens && (
        <div className="lens-hint">
          모이모에 돋보기를 대 보세요
          <button onClick={() => setLens(false)}>내려놓기</button>
        </div>
      )}

      {/* 오브제를 누르면 마을 위에 창을 띄운다 — 뒤의 마을은 흐리게 */}
      {panel && (
        <div
          className="scrim obj-scrim"
          // 바깥을 누르면 닫는다. 유리병은 ✕ 와 같은 길로 — 태어난 모이모는 마을로 보내며 닫힌다
          onClick={(e) => {
            if (e.target !== e.currentTarget) return
            if (panel === 'jar') jarClose.current?.()
            else leave(true)
          }}
        >
          {panel === 'jar' && <Jar {...common} onSend={send} closeRef={jarClose} />}
          {panel === 'camera' && <CameraPanel {...common} residents={residents} />}
          {panel === 'album' && <Album {...common} residents={residents} onFocus={focus} />}
          {panel === 'goods' && <Goods onClose={() => leave(true)} />}
        </div>
      )}

      <Manual cache={cache} table={table} />

      {toast && <div className="toast">{toast}</div>}
      <span className="world-size" hidden>{WORLD.w}×{WORLD.h}</span>
    </div>
  )
}
