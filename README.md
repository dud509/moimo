# moimo
졸업전시 프로젝트 모이모 웹사이트

## 세로형(모바일) 레이아웃

데스크톱에서도 폰 화면처럼 세로로 길게 이어지는 원페이지 구조입니다.

```
index.html   # 섹션을 위에서 아래로 쌓은 마크업
styles.css   # 세로 기둥(.phone) + 섹션(100svh) 스타일
main.js      # 스크롤 등장 애니메이션 (IntersectionObserver)
```

로컬에서 보기:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

### 세로로 길게 만드는 4가지 포인트

1. `<meta name="viewport" content="width=device-width, initial-scale=1">` — 없으면 모바일에서 데스크톱 폭으로 축소됩니다.
2. `.phone { max-width: 430px; margin-inline: auto; }` — 콘텐츠 폭을 폰 크기로 묶어 세로 기둥을 만듭니다. 폭은 `--phone-width` 변수로 조절.
3. `html, body { overflow-x: hidden; }` + `img { max-width: 100% }` — 가로 스크롤 차단.
4. `.section { min-height: 100svh; flex-direction: column; }` — 섹션을 한 화면씩 세워 아래로 쌓습니다. `svh`는 모바일 주소창이 접혔다 펴져도 높이가 튀지 않습니다.

다단 배치를 1열로 내리는 것(`grid-template-columns: 1fr`)이 실제로 페이지를 길게 만드는 작업입니다.

### 옵션

- **한 섹션씩 딱딱 넘기기**: `styles.css` 맨 아래 스크롤 스냅 블록의 주석을 해제하세요.
- **화면 꽉 채우는 풀블리드**: `.phone`의 `max-width`를 `none`으로 두면 폰 기둥 없이 전체 폭을 씁니다.
