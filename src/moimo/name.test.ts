import { splitName, genesFromName, explain, TOTAL_COMBINATIONS, encodeGenes } from './name'
import { decompose } from './hangul'

let fail = 0
const eq = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) { fail++; console.log(`  ✗ ${label}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`) }
}

console.log('조합 수:', TOTAL_COMBINATIONS.toLocaleString('ko-KR'))

// 자모 분해
eq('김 분해', decompose('김'), { char: '김', cho: 'ㄱ', jung: 'ㅣ', jong: 'ㅁ' })
eq('빛 분해(쌍/겹 정리)', decompose('빛'), { char: '빛', cho: 'ㅂ', jung: 'ㅣ', jong: 'ㅊ' })
eq('닭 겹받침→ㄹ', decompose('닭')!.jong, 'ㄹ')
eq('까 쌍자음→ㄱ', decompose('까')!.cho, 'ㄱ')

// 이름 쪼개기
eq('김민수 성', splitName('김민수')!.surname, '김')
eq('남궁민수 복성', splitName('남궁민수')!.surname, '남궁')
eq('남궁민 복성', splitName('남궁민')!.surname, '남궁')
eq('나민 홑성', splitName('나민')!.surname, '나')
eq('김민 외자→메아리', splitName('김민')!.echoed, true)
eq('김민 n2=n1', splitName('김민')!.n2.char, '민')
eq('김민수현 첫·끝', [splitName('김민수현')!.n1.char, splitName('김민수현')!.n2.char], ['민', '현'])
eq('공백·영문 제거', splitName('  김 민수 ok ')!.full, '김민수')
eq('한 글자는 불가', splitName('김'), null)
eq('영문만은 불가', splitName('Kim'), null)

// 매핑
eq('김 → 몸통01', genesFromName('김민수')!.body, 1)
eq('이 → 몸통02', genesFromName('이민수')!.body, 2)
eq('박 → 몸통03', genesFromName('박민수')!.body, 3)
eq('강 → ㄱ 몸통04', genesFromName('강민수')!.body, 4)
eq('안 → ㅇ 몸통08', genesFromName('안민수')!.body, 8)
eq('마 → 기타 몸통12', genesFromName('마민수')!.body, 12)
eq('김 ㅣ → 색01', genesFromName('김민수')!.color, 1)
eq('강 ㅏ → 색02', genesFromName('강민수')!.color, 2)
eq('최 ㅚ → 색06', genesFromName('최민수')!.color, 6)
eq('김 받침ㅁ → 무늬03', genesFromName('김민수')!.pattern, 3)
eq('나 받침없음 → 무늬0', genesFromName('나민수')!.pattern, 0)
eq('민 ㅁ → 눈05', genesFromName('김민수')!.eye, 5)
eq('민 ㅣ → 입07', genesFromName('김민수')!.mouth, 7)
eq('민 받침ㄴ → 볼02', genesFromName('김민수')!.cheek, 2)
eq('수 ㅅ → 머리07', genesFromName('김민수')!.hair, 7)
eq('수 ㅜ → 꼬리05', genesFromName('김민수')!.tail, 5)
eq('수 받침없음 → 몸통장식05', genesFromName('김민수')!.deco, 5)

// 같은 이름은 같은 결과
eq('결정론적', encodeGenes(genesFromName('김민수')!), encodeGenes(genesFromName('김민수')!))

// 가족 닮음
const kims = ['김민수', '김서연', '김도윤'].map((n) => genesFromName(n)!)
eq('김씨는 몸통·색·무늬가 같다', kims.map((g) => [g.body, g.color, g.pattern]),
   [[1,1,3],[1,1,3],[1,1,3]])

// 범위
const NAMES = ['김민수','이서연','박도윤','최지우','정하준','강예은','조은우','윤시아','장서준','임하윤','한지호','오유진','서건우','신다은','권太']
for (const n of NAMES) {
  const g = genesFromName(n)
  if (!g) continue
  const bad = Object.entries(g).filter(([k, v]) =>
    k === 'pattern' ? (v < 0 || v > 5) : v < 1 || v > ({body:12,color:6,eye:11,mouth:9,cheek:6,hair:11,tail:9,deco:6} as any)[k])
  if (bad.length) { fail++; console.log(`  ✗ ${n} 범위 벗어남`, bad) }
}

// 설명
console.log('\n김민수 →', encodeGenes(genesFromName('김민수')!))
for (const r of explain(splitName('김민수')!)) {
  console.log(`  ${r.from}의 ${r.place} ${r.jamo}\t→ ${r.label} ${String(r.value).padStart(2,'0')}`)
}

console.log(fail ? `\n실패 ${fail}건` : '\n전부 통과')
