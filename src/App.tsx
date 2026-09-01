import { useCallback, useEffect, useRef, useState } from 'react'
import { Village, type Camera, type VillageHandle } from './village/Village'
import {
  LANDMARKS, loadVillage, makeResident, resetVillage, saveVillage, seedResidents,
  type LandmarkId, type Resident,
} from './village/world'
import { Creator } from './ui/Creator'
import { Archive, Combinations, Fountain, Info, ResidentCard } from './ui/Panels'
import { Coach, Minimap, QuickNav, Toast, TopBar } from './ui/Hud'
import type { Genes } from './moimo/genes'

const COACH_KEY = 'moimo.coach.seen.v1'

export default function App() {
  const [residents, setResidents] = useState<Resident[]>(() => loadVillage())
  const [panel, setPanel] = useState<LandmarkId | null>(null)
  const [seedGenes, setSeedGenes] = useState<Genes | null>(null)
  const [selected, setSelected] = useState<Resident | null>(null)
  const [arrived, setArrived] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [camera, setCamera] = useState<Camera>({ tx: 0, ty: 0, scale: 0.62 })
  const [viewport, setViewport] = useState({ w: 1200, h: 800 })
  const [coach, setCoach] = useState(false)

  const villageRef = useRef<VillageHandle>(null)

  useEffect(() => {
    try { if (!localStorage.getItem(COACH_KEY)) setCoach(true) } catch { setCoach(true) }
  }, [])

  useEffect(() => { saveVillage(residents) }, [residents])

  useEffect(() => {
    const measure = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const say = useCallback((text: string) => {
    setToast(text)
    window.setTimeout(() => setToast((t) => (t === text ? null : t)), 2600)
  }, [])

  const send = useCallback((genes: Genes, name: string) => {
    setResidents((prev) => {
      const r = makeResident(genes, name, prev.length, Math.random, true)
      setPanel(null)
      setSeedGenes(null)
      setArrived(r.id)
      window.setTimeout(() => {
        villageRef.current?.flyTo(r.x, r.y, Math.max(0.85, villageRef.current.camera().scale))
      }, 60)
      window.setTimeout(() => setArrived((id) => (id === r.id ? null : id)), 2200)
      say(`${name} 도착! 마을이 한 명 더 북적여요`)
      return [...prev, r]
    })
  }, [say])

  const goto = useCallback((id: LandmarkId) => {
    const l = LANDMARKS.find((x) => x.id === id)!
    villageRef.current?.flyTo(l.x, l.y - 40, Math.max(0.8, villageRef.current.camera().scale))
  }, [])

  const openLandmark = useCallback((id: LandmarkId) => {
    setSelected(null)
    goto(id)
    window.setTimeout(() => setPanel(id), 380)
  }, [goto])

  const focusResident = useCallback((r: Resident) => {
    setPanel(null)
    villageRef.current?.flyTo(r.x, r.y, 1.25)
    window.setTimeout(() => setSelected(r), 420)
  }, [])

  const remix = useCallback((g: Genes) => {
    setSelected(null)
    setSeedGenes(g)
    setPanel('workshop')
  }, [])

  const hardReset = useCallback(() => {
    resetVillage()
    setResidents(seedResidents(96))
    setPanel(null)
    say('마을을 처음 상태로 되돌렸어요')
  }, [say])

  const closeCoach = () => {
    setCoach(false)
    try { localStorage.setItem(COACH_KEY, '1') } catch { /* noop */ }
  }

  return (
    <div className="app">
      <Village
        ref={villageRef}
        residents={residents}
        arrivedId={arrived}
        onLandmark={openLandmark}
        onResident={(r) => { setPanel(null); setSelected(r) }}
        onCamera={setCamera}
      />

      <TopBar count={residents.length} onHelp={() => setCoach(true)} />
      <QuickNav onGo={openLandmark} />
      <Minimap
        residents={residents}
        camera={camera}
        viewport={viewport}
        onJump={(x, y) => villageRef.current?.flyTo(x, y)}
      />

      <button className="fab" onClick={() => openLandmark('workshop')}>
        <span>＋</span> 모이모 만들기
      </button>

      {selected && (
        <ResidentCard resident={selected} onClose={() => setSelected(null)} onRemix={remix} />
      )}

      {panel && (
        <div className="scrim" onClick={() => { setPanel(null); setSeedGenes(null) }}>
          <div className="scrim-inner" onClick={(e) => e.stopPropagation()}>
            {panel === 'workshop' && (
              <Creator initial={seedGenes} onClose={() => { setPanel(null); setSeedGenes(null) }} onSend={send} />
            )}
            {panel === 'archive' && (
              <Archive residents={residents} onClose={() => setPanel(null)} onFocus={focusResident} />
            )}
            {panel === 'tree' && <Combinations residents={residents} onClose={() => setPanel(null)} />}
            {panel === 'fountain' && <Fountain onClose={() => setPanel(null)} onSend={send} />}
            {panel === 'info' && (
              <Info count={residents.length} onClose={() => setPanel(null)} onReset={hardReset} />
            )}
          </div>
        </div>
      )}

      {coach && <Coach onClose={closeCoach} />}
      {toast && <Toast text={toast} />}
    </div>
  )
}
