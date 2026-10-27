import { useState } from 'react'
import type { AnchorTable } from '../moimo/parts'
import type { PartsCache } from '../moimo/compose'
import { genesFromName } from '../moimo/name'
import { MoimoImg } from './World'
import type { Resident } from './model'

/*
 * 모이모 가이드 — 화면 오른쪽 끝에서 빼꼼 내다보는 요정을 누르면 작은 책자가 펼쳐진다.
 * 마을을 가리지 않게 옆으로만 열리고, 다시 누르면 접힌다. 짧게만 쓴다.
 */

const EXAMPLE = '김다영'

/** 이름 세 글자 × 초성·중성·종성 = 아홉 조각 */
const GRID = [
  { ch: '김', cells: ['머리장식', '몸통 색', '무늬'] },
  { ch: '다', cells: ['눈', '입', '볼'] },
  { ch: '영', cells: ['몸통', '꼬리', '몸통장식'] },
]

/** 흔한 글자는 따로 떼어 나눴다 — 이름 뒤 글자의 ㅇ 하나로 맛보기. 어떤 모습인지는 스포라 글자만 */
const SPLITS = ['ㅇ', '영·연·원', '아·윤']

/**
 * 빼꼼 요정 — 512 캔버스 오른쪽 끝에 몸 반쪽만 그려져 있다. 잘린 쪽(x=512)을
 * 책자 왼쪽 가장자리에 딱 붙여, 책자를 붙잡고 끌고 나오는 것처럼 보이게 한다
 */
const FAIRY = { src: '/items/guide05.svg', crop: '405 150 107 182' }

export function Manual({ cache, table }: { cache: PartsCache | null; table: AnchorTable }) {
  const [open, setOpen] = useState(false)
  const genes = genesFromName(EXAMPLE)
  const example: Resident | null = genes
    ? { id: 'manual', name: EXAMPLE, genes, x: 0, y: 0, phase: 0, at: 0, mine: false }
    : null

  return (
    <aside className={`manual${open ? ' open' : ''}`}>
      {/* 요정은 늘 책자 가장자리에 붙어 있다 — 접혀 있을 땐 화면 끝에서 빼꼼, 누르면 책자를 끌고 나온다 */}
      <button className="manual-peek" onClick={() => setOpen((o) => !o)} aria-label={open ? '가이드 접기' : '가이드 열기'}>
        <span className="manual-bubble">가이드</span>
        <svg viewBox={FAIRY.crop}><image href={FAIRY.src} width="512" height="512" /></svg>
      </button>

      <div className="manual-book" aria-hidden={!open}>
        <button className="manual-close" onClick={() => setOpen(false)} aria-label="가이드 접기">✕</button>
        <h2>이름이 모여, 모이모</h2>
        <p>한글 이름 세 글자를 아홉 조각으로 나누면, 조각마다 캐릭터의 한 부분이 정해져요.</p>

        <div className="manual-example">
          {example && cache && <MoimoImg resident={example} cache={cache} table={table} size={96} />}
          <table className="manual-grid">
            <thead>
              <tr><th /><th>초성</th><th>중성</th><th>종성</th></tr>
            </thead>
            <tbody>
              {GRID.map((g) => (
                <tr key={g.ch}>
                  <th>{g.ch}</th>
                  {g.cells.map((c) => <td key={c}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          파츠는 자음·모음마다 하나씩 정했어요. 다만 자주 쓰이는 글자는 자모 단위보다
          더 잘게, 글자 하나하나로 나눠 따로 파츠를 줬어요.
        </p>
        {/* ㅇ 하나가 그 안에서 다시 잘게 나뉜다 — 가지가 갈라지듯 */}
        <div className="manual-split">
          <b>ㅇ</b>
          <svg viewBox="0 0 240 22" preserveAspectRatio="none" aria-hidden>
            <path d="M120 0V8M40 22V14Q40 8 46 8H194Q200 8 200 14V22M120 8V22" />
          </svg>
          <ul>
            {SPLITS.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
        <p className="manual-note">같은 ㅇ이어도 서로 다른 모이모가 돼요. 도·두, 현·혁처럼 눈·입·꼬리·장식도 이렇게 나눴어요.</p>
      </div>
    </aside>
  )
}
