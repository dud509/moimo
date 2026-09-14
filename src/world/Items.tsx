import { LINE_COLOR } from '../moimo/parts'
import type { ItemId } from './model'

const L = { stroke: LINE_COLOR, strokeWidth: 5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const, fill: 'none' }
const T = { ...L, strokeWidth: 3.2 }

/** 각 오브제는 200×200 안에 그려지고 바닥선은 y=186 */
export function ItemArt({ id }: { id: ItemId }) {
  switch (id) {
    case 'jar':
      return (
        <>
          <ellipse cx={100} cy={186} rx={62} ry={10} fill={LINE_COLOR} opacity={0.08} />
          {/* 코르크 마개 */}
          <path {...L} d="M78 40h44v16H78Z" fill="#E3C9A6" />
          <path {...L} d="M74 26h52v16H74Z" fill="#EFDCC0" />
          {/* 병 */}
          <path {...L} d="M80 56v14c0 6-26 22-26 52v42a18 18 0 0 0 18 18h56a18 18 0 0 0 18-18v-42c0-30-26-46-26-52V56Z"
                fill="#EAF3F6" />
          {/* 담긴 별사탕 */}
          <g clipPath="url(#jar-fill)">
            <path d="M54 108h92v76H54Z" fill="#FBE7EC" />
            {[[72,160,'#FFC7D4'],[96,168,'#FFE6A8'],[120,160,'#CFE6F5'],[84,142,'#D9EFD2'],[110,140,'#FFD9C2'],[130,176,'#E7DBF5'],[62,176,'#FFEFC0'],[100,126,'#FFC7D4']]
              .map(([x, y, f], i) => (
                <path key={i} d={star(x as number, y as number, 11)} fill={f as string} stroke={LINE_COLOR} strokeWidth={2.4} strokeLinejoin="round" />
              ))}
          </g>
          <defs>
            <clipPath id="jar-fill">
              <path d="M80 56v14c0 6-26 22-26 52v42a18 18 0 0 0 18 18h56a18 18 0 0 0 18-18v-42c0-30-26-46-26-52V56Z" />
            </clipPath>
          </defs>
          <path {...L} d="M80 56v14c0 6-26 22-26 52v42a18 18 0 0 0 18 18h56a18 18 0 0 0 18-18v-42c0-30-26-46-26-52V56Z" />
          {/* 유리 반짝임 */}
          <path {...T} d="M70 122c-2 14-2 30 0 44" opacity={0.5} />
          {/* 떠오르는 별 하나 */}
          <path d={star(150, 40, 13)} fill="#FFE6A8" stroke={LINE_COLOR} strokeWidth={3} strokeLinejoin="round" />
        </>
      )

    case 'camera':
      return (
        <>
          <ellipse cx={100} cy={186} rx={64} ry={10} fill={LINE_COLOR} opacity={0.08} />
          {/* 몸체 */}
          <path {...L} d="M34 72h132a14 14 0 0 1 14 14v76a14 14 0 0 1-14 14H34a14 14 0 0 1-14-14V86a14 14 0 0 1 14-14Z"
                fill="#FFF3D9" />
          {/* 윗면 튀어나온 부분 */}
          <path {...L} d="M72 72V58a8 8 0 0 1 8-8h40a8 8 0 0 1 8 8v14Z" fill="#FFE6A8" />
          {/* 렌즈 */}
          <circle {...L} cx={100} cy={124} r={36} fill="#EAF3F6" />
          <circle {...T} cx={100} cy={124} r={22} fill="#CFE6F5" />
          <circle cx={90} cy={114} r={7} fill="#FFFFFF" />
          {/* 셔터와 플래시 */}
          <circle {...T} cx={44} cy={90} r={7} fill="#FFB9C6" />
          <path {...T} d="M144 86h20v12h-20Z" fill="#FFFFFF" />
          {/* 반짝 */}
          <path d={star(172, 46, 12)} fill="#FFE6A8" stroke={LINE_COLOR} strokeWidth={3} strokeLinejoin="round" />
        </>
      )

    case 'album':
      return (
        <>
          <ellipse cx={100} cy={186} rx={64} ry={10} fill={LINE_COLOR} opacity={0.08} />
          {/* 뒤 표지 */}
          <path {...L} d="M30 54h140a10 10 0 0 1 10 10v104a10 10 0 0 1-10 10H30Z" fill="#F6D9C8" />
          {/* 속지 */}
          <path {...T} d="M38 62h130v108H38Z" fill="#FFFDF5" />
          {/* 사진 두 장 */}
          <g transform="rotate(-5 74 100)">
            <path {...T} d="M50 76h48v50H50Z" fill="#FFFFFF" />
            <path d="M54 80h40v34H54Z" fill="#CFE6F5" />
          </g>
          <g transform="rotate(6 134 106)">
            <path {...T} d="M110 82h48v50h-48Z" fill="#FFFFFF" />
            <path d="M114 86h40v34h-40Z" fill="#FFD9C2" />
          </g>
          {/* 방명록 줄 */}
          <path {...T} d="M52 146h96M52 158h64" opacity={0.55} />
          {/* 책등 */}
          <path {...L} d="M30 54v124" />
          <path {...L} d="M22 60h8v112h-8Z" fill="#E8BCA6" />
        </>
      )

    case 'music':
      return (
        <>
          <ellipse cx={100} cy={186} rx={52} ry={9} fill={LINE_COLOR} opacity={0.08} />
          {/* 본체 */}
          <path {...L} d="M56 44h88a16 16 0 0 1 16 16v112a16 16 0 0 1-16 16H56a16 16 0 0 1-16-16V60a16 16 0 0 1 16-16Z" fill="#FFF3D9" />
          {/* 화면 */}
          <path {...L} d="M58 62h84v54H58Z" fill="#CFE6F5" />
          <path {...T} d="M70 82h34M70 96h58" opacity={0.6} />
          {/* 조작 휠 */}
          <circle {...L} cx={100} cy={148} r={26} fill="#FFE6A8" />
          <circle {...T} cx={100} cy={148} r={9} fill="#FFF3D9" />
          {/* 떠오르는 음표 */}
          <g {...T} fill="none">
            <path d="M168 66v-28l20-6v28" />
            <ellipse cx={163} cy={68} rx={7} ry={5.5} transform="rotate(-18 163 68)" fill={LINE_COLOR} stroke="none" />
            <ellipse cx={183} cy={62} rx={7} ry={5.5} transform="rotate(-18 183 62)" fill={LINE_COLOR} stroke="none" />
          </g>
        </>
      )

    default: // glass
      return (
        <>
          <ellipse cx={100} cy={186} rx={50} ry={9} fill={LINE_COLOR} opacity={0.08} />
          {/* 손잡이 */}
          <path {...L} d="M118 122 156 172a13 13 0 0 0 20-16L138 106Z" fill="#E3C9A6" />
          {/* 테 */}
          <circle {...L} cx={88} cy={84} r={56} fill="#EAF3F6" fillOpacity={0.85} />
          <circle {...L} cx={88} cy={84} r={56} fill="none" />
          <circle {...T} cx={88} cy={84} r={44} opacity={0.5} />
          {/* 유리 반짝임 */}
          <path {...T} d="M62 56c-8 8-12 18-12 28" opacity={0.6} />
          {/* 안에 비치는 이름표 */}
          <g clipPath="url(#glass-in)">
            <path {...T} d="M52 74h72v26H52Z" rx={8} fill="#FFFFFF" />
            <path {...T} d="M62 84h30M62 92h44" opacity={0.45} />
          </g>
          <defs>
            <clipPath id="glass-in"><circle cx={88} cy={84} r={50} /></clipPath>
          </defs>
        </>
      )
  }
}

function star(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  const inner = r * 0.42
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : inner
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)} ${(cy + Math.sin(a) * rad).toFixed(1)}`)
  }
  return `M${pts.join('L')}Z`
}
