import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadParts, type PartsCache } from './moimo/compose'
import { normalizeTable, type AnchorTable } from './moimo/parts'
import anchorsJson from './data/anchors.json'
import { World, type Camera, type WorldHandle } from './world/World'
import { Album, Camera as CameraPanel, Card, Glass, Jar } from './world/Panels'
import {
  ITEMS, WORLD, loadWorld, residentFromName, resetWorld, saveWorld, trimWorld,
  type ItemId, type Resident,
} from './world/model'
import './styles.css'

export default function App() {
  const [cache, setCache] = useState<PartsCache | null>(null)
  const [residents, setResidents] = useState<Resident[]>(() => trimWorld(loadWorld()))
  const [panel, setPanel] = useState<ItemId | null>(null)
  const [selected, setSelected] = useState<Resident | null>(null)
  const [arrived, setArrived] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [showNames, setShowNames] = useState(false)
  const [query, setQuery] = useState('')
  const [, setCamera] = useState<Camera>({ tx: 0, ty: 0, scale: 0.6 })

  const worldRef = useRef<WorldHandle>(null)
  const table = useMemo<AnchorTable>(() => normalizeTable(anchorsJson), [])

  useEffect(() => { loadParts().then(setCache) }, [])
  useEffect(() => { saveWorld(residents) }, [residents])

  const say = useCallback((text: string) => {
    setToast(text)
    window.setTimeout(() => setToast((t) => (t === text ? null : t)), 2600)
  }, [])

  const send = useCallback((name: string, note: string) => {
    setResidents((prev) => {
      const r = residentFromName(name, prev.length, note || undefined)
      if (!r) return prev
      setPanel(null)
      setArrived(r.id)
      window.setTimeout(() => {
        worldRef.current?.flyTo(r.x, r.y, Math.max(0.8, worldRef.current.camera().scale))
      }, 60)
      window.setTimeout(() => setArrived((id) => (id === r.id ? null : id)), 2400)
      say(`${r.name} 도착! 마을이 한 명 더 북적여요`)
      return trimWorld([...prev, r])
    })
  }, [say])

  const openItem = useCallback((id: ItemId) => {
    const it = ITEMS.find((x) => x.id === id)!
    setSelected(null)
    worldRef.current?.flyTo(it.x, it.y - 40, Math.max(0.75, worldRef.current.camera().scale))
    window.setTimeout(() => setPanel(id), 360)
  }, [])

  const focus = useCallback((r: Resident) => {
    setPanel(null)
    worldRef.current?.flyTo(r.x, r.y, 1.3)
    window.setTimeout(() => setSelected(r), 420)
  }, [])

  const hits = useMemo(() => {
    const q = query.trim()
    if (!q) return null
    return new Set(residents.filter((r) => r.name.includes(q)).map((r) => r.id))
  }, [residents, query])

  if (!cache) {
    return (
      <div className="booting">
        <p>모이모를 부르는 중…</p>
      </div>
    )
  }

  const common = { cache, table, onClose: () => setPanel(null) }

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
        onResident={(r) => { setPanel(null); setSelected(r) }}
        onCamera={setCamera}
      />

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">모이모</span>
          <span className="brand-sub">MOIMO WORLD</span>
        </div>
        <div className="counter">
          <span>지금 모여 있는 모이모</span>
          <b>{residents.length.toLocaleString('ko-KR')}</b>
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
            setResidents(loadWorld())
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

      {panel && (
        <div className="scrim" onClick={() => setPanel(null)}>
          <div className="scrim-inner" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
      <span className="world-size" hidden>{WORLD.w}×{WORLD.h}</span>
    </div>
  )
}
