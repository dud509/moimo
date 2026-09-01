import { useMemo, useState } from 'react'
import { Moimo } from '../moimo/Moimo'
import {
  COLORS, SLOTS, TOTAL_COMBINATIONS, describeGenes, encodeGenes, randomGenes, randomName,
  type GeneKey, type Genes,
} from '../moimo/genes'

type Props = {
  initial?: Genes | null
  onClose: () => void
  onSend: (genes: Genes, name: string) => void
}

export function Creator({ initial, onClose, onSend }: Props) {
  const [genes, setGenes] = useState<Genes>(() => initial ?? randomGenes())
  const [name, setName] = useState(() => randomName())
  const [slot, setSlot] = useState<GeneKey>('body')
  const [copied, setCopied] = useState(false)

  const active = useMemo(() => SLOTS.find((s) => s.key === slot)!, [slot])
  const code = encodeGenes(genes)

  const set = (key: GeneKey, v: number) => setGenes((g) => ({ ...g, [key]: v }))
  const shuffle = () => { setGenes(randomGenes()); setName(randomName()) }

  const copy = () => {
    navigator.clipboard?.writeText(code).then(
      () => { setCopied(true); window.setTimeout(() => setCopied(false), 1400) },
      () => { /* 클립보드가 막혀 있어도 코드는 화면에 있다 */ },
    )
  }

  return (
    <div className="sheet creator">
      <header className="sheet-head">
        <div>
          <p className="eyebrow">모이모 공방</p>
          <h2>세상에 하나뿐인 모이모 만들기</h2>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="닫기">✕</button>
      </header>

      <div className="creator-body">
        <div className="stage">
          <div className="stage-art">
            <Moimo genes={genes} size={230} ignoreSizeGene animate />
          </div>

          <div className="stage-meta">
            <input
              className="name-input"
              value={name}
              maxLength={8}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              aria-label="모이모 이름"
            />
            <p className="desc">{describeGenes(genes)}</p>
            <button className="code" onClick={copy} title="유전자 코드 복사">
              <span>유전자</span> {code} {copied ? '복사됨' : '⧉'}
            </button>
          </div>

          <div className="stage-actions">
            <button className="btn ghost" onClick={shuffle}>🎲 아무거나</button>
            <button className="btn primary" onClick={() => onSend(genes, name.trim() || randomName())}>
              마을에 보내기
            </button>
          </div>
        </div>

        <div className="picker">
          <div className="tabs" role="tablist">
            {SLOTS.map((s) => (
              <button
                key={s.key}
                role="tab"
                aria-selected={s.key === slot}
                className={`tab${s.key === slot ? ' on' : ''}`}
                onClick={() => setSlot(s.key)}
              >
                {s.label}
                <em>{s.options.length}</em>
              </button>
            ))}
          </div>

          <div className="options">
            {active.options.map((label, i) => {
              const preview = { ...genes, [active.key]: i } as Genes
              const on = genes[active.key] === i
              return (
                <button
                  key={label + i}
                  className={`opt${on ? ' on' : ''}`}
                  onClick={() => set(active.key, i)}
                  aria-pressed={on}
                >
                  {active.key === 'color' ? (
                    <span className="swatch" style={{ background: COLORS[i].fill, borderColor: COLORS[i].line }} />
                  ) : (
                    <Moimo genes={preview} size={54} ignoreSizeGene={active.key !== 'size'} animate={false} />
                  )}
                  <span className="opt-label">{label}</span>
                </button>
              )
            })}
          </div>

          <p className="footnote">
            지금 고를 수 있는 조합 <b>{TOTAL_COMBINATIONS.toLocaleString('ko-KR')}</b>가지.
            같은 모이모를 다시 만날 확률은 거의 없어요.
          </p>
        </div>
      </div>
    </div>
  )
}
