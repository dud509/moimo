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
eq('김민수현 → 김수현', [splitName('김민수현')!.n1.char, splitName('김민수현')!.n2.char], ['수', '현'])
eq('남궁민수 자모는 남에서', splitName('남궁민수')!.s.char, '남')
eq('남궁민수 이름 민수', [splitName('남궁민수')!.n1.char, splitName('남궁민수')!.n2.char], ['민', '수'])
eq('김민 → 김민민', [splitName('김민')!.n1.char, splitName('김민')!.n2.char], ['민', '민'])
eq('공백·영문 제거', splitName('  김 민수 ok ')!.full, '김민수')
eq('한 글자는 불가', splitName('김'), null)
eq('영문만은 불가', splitName('Kim'), null)

// 매핑 — 흔한 정도
eq('김 → 몸통02', genesFromName('김민수', 'freq')!.body, 2)
eq('이 → 몸통08', genesFromName('이민수', 'freq')!.body, 8)
eq('박 → 몸통06', genesFromName('박민수', 'freq')!.body, 6)
eq('강 → ㄱ 몸통10', genesFromName('강민수', 'freq')!.body, 10)
eq('안 → ㅇ 몸통04', genesFromName('안민수', 'freq')!.body, 4)
eq('마 → 기타 몸통07', genesFromName('마민수', 'freq')!.body, 7)
eq('김 ㅣ → 색01', genesFromName('김민수', 'freq')!.color, 1)
eq('강 ㅏ → 색02', genesFromName('강민수', 'freq')!.color, 2)
eq('최 ㅚ → 색03 분홍', genesFromName('최민수', 'freq')!.color, 3)
eq('정 ㅓ → 색04 갈색', genesFromName('정민수', 'freq')!.color, 4)
eq('조 ㅗ → 색05 민트', genesFromName('조민수', 'freq')!.color, 5)
eq('이 ㅣ → 색06 연보라', genesFromName('이민수', 'freq')!.color, 6)
eq('김 받침ㅁ → 무늬03', genesFromName('김민수', 'freq')!.morph, 3)
eq('나 받침없음 → 무늬0', genesFromName('나민수', 'freq')!.morph, 0)
eq('민 ㅁ → 눈05', genesFromName('김민수', 'freq')!.eye, 5)
eq('민 ㅣ → 입05', genesFromName('김민수', 'freq')!.mouth, 5)
eq('민 받침ㄴ → 볼05', genesFromName('김민수', 'freq')!.cheek, 5)
eq('수 ㅅ → 머리03', genesFromName('김민수', 'freq')!.hair, 3)
eq('수 ㅜ → 꼬리03', genesFromName('김민수', 'freq')!.tail, 3)
eq('수 받침없음 → 몸통장식03', genesFromName('김민수', 'freq')!.deco, 3)
eq('눈 01 은 앞 글자 ㄹ 에만', genesFromName('김라수', 'freq')!.eye, 1)
eq('머리장식 11 은 뒤 글자 ㄷ 에만', genesFromName('김수다', 'freq')!.hair, 11)

// 매핑 — 닮은 모양
// 몸통은 이름 뒤 글자에서 — 같은 성이어도 몸통이 다르다
eq('모양: 현 → 곧게 선 귀 몸통05', genesFromName('이지현', 'shape')!.body, 5)
eq('모양: 우 ㅇ → 둥근 귀 몸통10', genesFromName('이지우', 'shape')!.body, 10)
eq('모양: 영 → 햄스터 몸통03', genesFromName('이다영', 'shape')!.body, 3)
eq('모양: 호 → 비스듬한 귀 몸통11', genesFromName('이민호', 'shape')!.body, 11)
eq('모양: 수 → 보송한 털 귀 몸통07', genesFromName('이민수', 'shape')!.body, 7)
eq('모양: 미 ㅁ → 뭉실한 귀 몸통02', genesFromName('이은미', 'shape')!.body, 2)
eq('모양: 재 ㅈ → 삐죽 털 몸통01', genesFromName('이민재', 'shape')!.body, 1)
eq('모양: 진 ㅈ → 삐죽 털 몸통01', genesFromName('이우진', 'shape')!.body, 1)
eq('모양: 준 ㅈ → 삐죽 털 몸통01', genesFromName('이민준', 'shape')!.body, 1)
eq('모양: 원 → 햄스터 몸통03', genesFromName('이지원', 'shape')!.body, 3)
eq('모양: 혁 → 사막여우 몸통05', genesFromName('이민혁', 'shape')!.body, 5)
eq('모양: 단 ㄷ → 옆으로 뻗은 귀 몸통08', genesFromName('이하단', 'shape')!.body, 8)
eq('모양: 린 → 롭이어2 몸통12', genesFromName('이하린', 'shape')!.body, 12)
eq('모양: 아 → 롭이어 몸통09', genesFromName('이수아', 'shape')!.body, 9)
eq('모양: 희 ㅎ → 고양이2 몸통11', genesFromName('이영희', 'shape')!.body, 11)
eq('모양: 리 ㄹ → 롭이어2 몸통12', genesFromName('이유리', 'shape')!.body, 12)
eq('모양: 솔 ㅅ → 원숭이 몸통06', genesFromName('이한솔', 'shape')!.body, 6)
eq('모양: 규 ㄱ → 접힌 귀 몸통04', genesFromName('이민규', 'shape')!.body, 4)
eq('모양: 철 ㅊ → 코알라 몸통08', genesFromName('이영철', 'shape')!.body, 8)
eq('모양: 윤 → 롭이어 몸통09', genesFromName('이서윤', 'shape')!.body, 9)
// 머리장식은 성에서 — 같은 집안은 같은 표식
eq('모양: 김 → 별 머리01', genesFromName('김다영', 'shape')!.hair, 1)
eq('모양: 이 → 초록 잎 머리05', genesFromName('이다영', 'shape')!.hair, 5)
eq('모양: 박 → 클로버 머리10', genesFromName('박다영', 'shape')!.hair, 10)
eq('모양: 정 → 체리 머리02', genesFromName('정다영', 'shape')!.hair, 2)
eq('모양: 안 ㅇ → 하트 머리03', genesFromName('안다영', 'shape')!.hair, 3)
eq('모양: 강 ㄱ 은 김과 따로 안경 머리11', genesFromName('강다영', 'shape')!.hair, 11)
eq('모양: 조 ㅈ → 고깔 머리09', genesFromName('조다영', 'shape')!.hair, 9)
eq('모양: 서 ㅅ → 작은 리본 머리04', genesFromName('서다영', 'shape')!.hair, 4)
eq('모양: 최 ㅊ → 작은 날개 머리07', genesFromName('최다영', 'shape')!.hair, 7)
eq('모양: 한 ㅎ → 앞머리 머리06', genesFromName('한다영', 'shape')!.hair, 6)
eq('모양: 노 ㄴ → 달걀 머리08', genesFromName('노다영', 'shape')!.hair, 8)
eq('모양: 황보 는 ㅎ → 앞머리 머리06', genesFromName('황보다영', 'shape')!.hair, 6)
eq('모양: 강 받침ㅇ → 귀 끝 무늬01', genesFromName('강민수', 'shape')!.morph, 1)
eq('모양: 김 → 반반 무늬04', genesFromName('김민수', 'shape')!.morph, 4)
eq('모양: 임 받침ㅁ → 얼굴 비운 무늬03', genesFromName('임민수', 'shape')!.morph, 3)
eq('모양: 박 받침ㄱ → 귀 끝 무늬01', genesFromName('박민수', 'shape')!.morph, 1)
eq('모양: 정 받침ㅇ → 머리 덮는 무늬05', genesFromName('정민수', 'shape')!.morph, 5)
eq('모양: 연 ㅇ → 꽉 찬 눈02', genesFromName('김연수', 'shape')!.eye, 2)
eq('모양: 서 ㅅ → 가로획 걸친 눈09', genesFromName('김서연', 'shape')!.eye, 9)
eq('모양: 하 → 속눈썹 눈06', genesFromName('김하린', 'shape')!.eye, 6)
eq('모양: 현우 → 테두리 눈05', genesFromName('김현우', 'shape')!.eye, 5)
eq('모양: 현준 은 속눈썹 눈이 아니다', genesFromName('이현준', 'shape')!.eye === 6, false)
eq('모양: 지 → 감은 눈07', genesFromName('김지우', 'shape')!.eye, 7)
eq('모양: 다 → 뱅글 눈11', genesFromName('김다영', 'shape')!.eye, 11)
eq('모양: 동 ㄷ → 반짝 눈08', genesFromName('김동현', 'shape')!.eye, 8)
eq('모양: 수 ㅜ → 꼬리01', genesFromName('김민수', 'shape')!.tail, 1)
eq('모양: 성 ㅓ → 원숭이 + 방울 꼬리04', [genesFromName('김민성', 'shape')!.body, genesFromName('김민성', 'shape')!.tail], [6, 4])
eq('모양: 은 → 리본 몸통장식01', genesFromName('김지은', 'shape')!.deco, 1)
eq('모양: 준 ㄴ → 가방 몸통장식03', genesFromName('김민준', 'shape')!.deco, 3)
eq('모양: 수 받침없음 → 스카프 몸통장식04', genesFromName('김민수', 'shape')!.deco, 4)
eq('모양: 철 ㄹ → 날개 몸통장식06', genesFromName('김영철', 'shape')!.deco, 6)
eq('모양: 우 ㅜ → 입06', genesFromName('김우진', 'shape')!.mouth, 6)
eq('모양: 도 ㅗ → 솟은 입04', genesFromName('김도윤', 'shape')!.mouth, 4)
eq('모양: 유 ㅠ → 솟은 입04', genesFromName('김유나', 'shape')!.mouth, 4)
eq('모양: 경 → 두꺼운 입08', genesFromName('김경민', 'shape')!.mouth, 8)
eq('모양: 효 ㅛ → 솟은 입04', genesFromName('임효경', 'shape')!.mouth, 4)
eq('모양: 가 ㅏ → 입01', genesFromName('김가은', 'shape')!.mouth, 1)

// 같은 이름은 같은 결과
eq('결정론적', encodeGenes(genesFromName('김민수')!), encodeGenes(genesFromName('김민수')!))

// 가족 닮음
const kims = ['김민수', '김서연', '김도윤'].map((n) => genesFromName(n, 'freq')!)
eq('김씨는 몸통·색·무늬가 같다', kims.map((g) => [g.body, g.color, g.morph]),
   [[2,1,3],[2,1,3],[2,1,3]])

// 범위
const NAMES = ['김민수','이서연','박도윤','최지우','정하준','강예은','조은우','윤시아','장서준','임하윤','한지호','오유진','서건우','신다은','권太']
for (const n of NAMES) {
  const g = genesFromName(n)
  if (!g) continue
  // 무늬와 바탕만 0부터 — 무늬 0 은 «무늬 없음», 바탕 0 은 «흰 바탕» 이다
  const bad = Object.entries(g).filter(([k, v]) =>
    k === 'morph' ? (v < 0 || v > 5)
      : k === 'tone' ? (v < 0 || v > 1)
      : v < 1 || v > ({body:12,color:6,eye:11,mouth:9,cheek:6,hair:11,tail:9,deco:6} as any)[k])
  if (bad.length) { fail++; console.log(`  ✗ ${n} 범위 벗어남`, bad) }
}

// 눈 11(빙글 눈)과 볼 05(나선 볼)는 만나면 안 된다. 앞 글자를 가·각…힣까지
// 다 넣어 보고 둘이 한 번도 같이 나오지 않는지 본다
{
  let met = 0
  for (let c = 0xac00; c <= 0xd7a3; c++) {
    const g = genesFromName('김' + String.fromCharCode(c) + '수', 'shape')!
    if (g.eye === 11 && g.cheek === 5) met++
  }
  eq('눈 11 과 볼 05 는 만나지 않는다', met, 0)
}

// 설명
console.log('\n김민수 →', encodeGenes(genesFromName('김민수')!))
for (const r of explain(splitName('김민수')!)) {
  console.log(`  ${r.from}의 ${r.place} ${r.jamo}\t→ ${r.label} ${String(r.value).padStart(2,'0')}`)
}

console.log(fail ? `\n실패 ${fail}건` : '\n전부 통과')

// 두꺼운 입(08)은 점 눈(04)하고만 만난다
{
  const met = new Set<number>()
  for (let c = 0xac00; c <= 0xd7a3; c++) {
    const g = genesFromName('김' + String.fromCharCode(c) + '수', 'shape')!
    if (g.mouth === 8) met.add(g.eye)
  }
  eq('두꺼운 입은 점 눈하고만', [...met], [4])
}
