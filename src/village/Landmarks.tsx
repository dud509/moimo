import type { LandmarkId } from './world'

const INK = '#4A4250'
const line = { stroke: INK, strokeWidth: 2.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
const thin = { stroke: INK, strokeWidth: 1.6, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }

/** 각 오브제는 200×200 안에 그려지고, 바닥선은 y=188 */
export function LandmarkArt({ id }: { id: LandmarkId }) {
  switch (id) {
    case 'workshop':
      return (
        <>
          <ellipse cx={100} cy={188} rx={86} ry={12} fill="#000" opacity={0.08} />
          {/* 굴뚝 연기 */}
          <g fill="#FFFFFF" opacity={0.85}>
            <circle cx={148} cy={30} r={9} /><circle cx={160} cy={18} r={12} /><circle cx={140} cy={14} r={8} />
          </g>
          {/* 굴뚝 */}
          <path d="M138 62V36h18v26Z" fill="#E77E77" {...line} />
          {/* 지붕 */}
          <path d="M100 22 182 74H18Z" fill="#F58E86" {...line} />
          <path d="M100 40 152 74H48Z" fill="#FFA9A2" {...thin} />
          {/* 몸통 */}
          <path d="M30 74h140v104a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6Z" fill="#FFF6E5" {...line} />
          {/* 간판 */}
          <path d="M56 84h88v26H56Z" fill="#FFE1A8" {...line} />
          <text x={100} y={103} textAnchor="middle" fontSize={17} fontWeight={800} fill={INK} fontFamily="inherit">공방</text>
          {/* 창문 */}
          <circle cx={58} cy={136} r={17} fill="#C7E7F5" {...line} />
          <path d="M41 136h34M58 119v34" {...thin} />
          <circle cx={142} cy={136} r={17} fill="#C7E7F5" {...line} />
          <path d="M125 136h34M142 119v34" {...thin} />
          {/* 문 */}
          <path d="M84 184v-40a16 16 0 0 1 32 0v40Z" fill="#D79A6A" {...line} />
          <circle cx={109} cy={165} r={3} fill={INK} />
          {/* 알 컨베이어 */}
          <g>
            <path d="M22 176h30" stroke={INK} strokeWidth={3} strokeLinecap="round" />
            <ellipse cx={30} cy={168} rx={7} ry={8.5} fill="#FFD9D2" {...thin} />
            <ellipse cx={46} cy={169} rx={6} ry={7.5} fill="#CFC6F5" {...thin} />
          </g>
        </>
      )

    case 'archive':
      return (
        <>
          <ellipse cx={100} cy={188} rx={84} ry={12} fill="#000" opacity={0.08} />
          {/* 돔 */}
          <path d="M40 76a60 60 0 0 1 120 0Z" fill="#93CFC4" {...line} />
          <path d="M100 16v-10" {...line} />
          <circle cx={100} cy={4} r={6} fill="#FFD966" {...line} />
          {/* 본체 */}
          <path d="M28 76h144v102H28Z" fill="#FFF6E5" {...line} />
          {/* 진열창 3칸 — 안에 모이모 실루엣 */}
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={40 + i * 44} y={92} width={36} height={44} rx={9} fill="#E8F4FB" {...thin} />
              <ellipse cx={58 + i * 44} cy={118} rx={11} ry={12} fill={['#FFB3C4', '#CFC6F5', '#CBE8B4'][i]} {...thin} />
              <circle cx={54 + i * 44} cy={116} r={1.8} fill={INK} />
              <circle cx={62 + i * 44} cy={116} r={1.8} fill={INK} />
            </g>
          ))}
          {/* 계단 + 문 */}
          <path d="M86 178v-32h28v32Z" fill="#D79A6A" {...line} />
          <path d="M62 178h76l10 10H52Z" fill="#EADDC2" {...line} />
          {/* 현판 */}
          <path d="M62 148h76v20H62Z" fill="#FFE1A8" {...line} />
          <text x={100} y={163} textAnchor="middle" fontSize={13} fontWeight={800} fill={INK} fontFamily="inherit">모이모 도감</text>
        </>
      )

    case 'tree':
      return (
        <>
          <ellipse cx={100} cy={188} rx={78} ry={12} fill="#000" opacity={0.08} />
          {/* 잎 뭉치 */}
          <g fill="#BEE4A0" {...line}>
            <circle cx={62} cy={72} r={38} />
            <circle cx={138} cy={70} r={40} />
            <circle cx={100} cy={44} r={42} />
            <circle cx={82} cy={100} r={34} />
            <circle cx={124} cy={102} r={32} />
          </g>
          <g fill="#D3EEBA" opacity={0.9}>
            <circle cx={92} cy={40} r={22} /><circle cx={128} cy={64} r={16} />
          </g>
          {/* 열매처럼 매달린 모이모 */}
          {[[64, 108, '#FFB3C4'], [110, 118, '#CFC6F5'], [140, 96, '#FFEBA6'], [86, 76, '#BFE0F8']].map(
            ([x, y, f], i) => (
              <g key={i}>
                <path d={`M${x} ${(y as number) - 12}v-8`} stroke="#7FA86A" strokeWidth={2} />
                <ellipse cx={x as number} cy={y as number} rx={11} ry={12} fill={f as string} {...thin} />
                <circle cx={(x as number) - 4} cy={(y as number) - 2} r={1.8} fill={INK} />
                <circle cx={(x as number) + 4} cy={(y as number) - 2} r={1.8} fill={INK} />
                <path d={`M${(x as number) - 3} ${(y as number) + 4}q3 3 6 0`} {...thin} strokeWidth={1.3} fill="none" />
              </g>
            ),
          )}
          {/* 줄기 */}
          <path d="M86 178q-4-40 6-56h16q10 16 6 56Z" fill="#C99B6E" {...line} />
          <path d="M96 168q0-24 4-36" {...thin} strokeWidth={1.4} />
          {/* 팻말 */}
          <path d="M126 186v-24" {...line} />
          <path d="M110 150h48v20h-48Z" fill="#FFF6E5" {...line} />
          <text x={134} y={164} textAnchor="middle" fontSize={11} fontWeight={800} fill={INK} fontFamily="inherit">조합의 나무</text>
        </>
      )

    case 'fountain':
      return (
        <>
          <ellipse cx={100} cy={182} rx={86} ry={20} fill="#000" opacity={0.07} />
          {/* 아래 수반 */}
          <ellipse cx={100} cy={162} rx={82} ry={26} fill="#E7DCC4" {...line} />
          <ellipse cx={100} cy={156} rx={70} ry={20} fill="#BFE3EE" {...line} />
          {/* 기둥 */}
          <path d="M90 152V96h20v56Z" fill="#EADDC2" {...line} />
          {/* 위 수반 */}
          <ellipse cx={100} cy={94} rx={38} ry={13} fill="#E7DCC4" {...line} />
          <ellipse cx={100} cy={91} rx={30} ry={9} fill="#BFE3EE" {...thin} />
          {/* 물줄기 */}
          <g fill="none" stroke="#8FCFE4" strokeWidth={4} strokeLinecap="round" opacity={0.95}>
            <path d="M100 78q-22 6-28 26" /><path d="M100 78q22 6 28 26" /><path d="M100 74v-18" />
          </g>
          <circle cx={100} cy={48} r={9} fill="#BFE3EE" {...thin} />
          {/* 물결 */}
          <g stroke="#7FBBD1" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.7}>
            <path d="M58 158q7-5 14 0t14 0" /><path d="M116 162q7-5 14 0t14 0" />
          </g>
        </>
      )

    default: // info
      return (
        <>
          <ellipse cx={100} cy={188} rx={76} ry={12} fill="#000" opacity={0.08} />
          {/* 깃대 */}
          <path d="M168 180V44" {...line} />
          <path d="M168 46h34l-9 12 9 12h-34Z" fill="#F58E86" {...line} />
          {/* 차양 */}
          <path d="M26 84h124l-10 22H36Z" fill="#F58E86" {...line} />
          <g fill="#FFF6E5">
            {[0, 1, 2, 3].map((i) => <path key={i} d={`M${40 + i * 28} 84h14l-4 22h-14Z`} />)}
          </g>
          <path d="M26 84h124l-10 22H36Z" fill="none" {...line} />
          {/* 부스 */}
          <path d="M40 106h96v72H40Z" fill="#FFF6E5" {...line} />
          <path d="M52 118h72v34H52Z" fill="#E8F4FB" {...line} />
          <text x={88} y={140} textAnchor="middle" fontSize={14} fontWeight={800} fill={INK} fontFamily="inherit">안내</text>
          <path d="M40 160h96" {...thin} />
          {/* 카운터 위 모이모 */}
          <ellipse cx={112} cy={96} rx={13} ry={14} fill="#FFEBA6" {...thin} />
          <circle cx={107} cy={94} r={2} fill={INK} /><circle cx={117} cy={94} r={2} fill={INK} />
          <path d="M108 101q4 4 8 0" fill="none" {...thin} strokeWidth={1.4} />
        </>
      )
  }
}
