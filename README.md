# 🏠 우리집 인테리어 사이트

애인 + 인테리어 업자들과 공사 정보를 공유하는 여러 페이지짜리 사이트입니다.

## 페이지 구성
| 파일 | 내용 |
|------|------|
| `index.html` | 홈 — 우리집 소개 · 평면도 · 공간 구성 · 바로가기 |
| `schedule.html` | 공정 계획표(달력 간트) · 결정 필요 · 확인 필요 |
| `plans.html` | 공정별 작업계획서 (작업 · 결정 · 확인 · 관련 레퍼런스) |
| `references.html` | 레퍼런스 갤러리 (컨셉/디테일 참고 이미지) |
| `contacts.html` | 업체 연락처 · 디자인 외주 후보 |

## 공통 파일
- `data.js` — **모든 내용이 여기 있음.** 일정·작업·연락처·결정·확인·레퍼런스를 여기서 수정
- `styles.css` — 디자인 (수정할 일 거의 없음)
- `app.js` — 네비게이션 + 렌더링 (수정할 일 거의 없음)
- `images/` — 도면/사진/레퍼런스 이미지 폴더

## 내용 수정하는 법 (`data.js`)
- 공정/작업 → `PHASES`의 `tasks`
- 결정 못 한 것 → `decisions` (공정표 "결정 필요"에 자동 수집)
- 놓치기 쉬운 것 → `checks` (공정표 "확인 필요"에 자동 수집)
- 공사 일정 → `SCHEDULE.tasks`의 `spans` (시작일·종료일)
- 업체 연락처 → `CONTACTS`
- 소개글 → `PROJECT.intro`

## 사진 / 도면 넣는 법
`images/` 폴더에 아래 이름으로 넣으면 자동 표시됩니다.
- `평면도.png` (홈)
- `급기배기_위치.png` · `에어컨_위치.png` (냉난방·환기 공정)
- `조명_계획.png` · `콘센트_계획.png` (전기 공정)

## 레퍼런스(컨셉 사진) 추가하는 법
1. 사진을 `images/` 폴더에 넣기 (예: `images/ref_거실.jpg`)
2. `data.js`의 `REFERENCES`에 한 줄 추가:
   ```js
   { title: "거실 우드톤", file: "ref_거실.jpg",
     desc: "이런 우드톤 거실을 원해요.", phases: ["carpentry", "wallpaper"] },
   ```
3. `phases`에 적은 공정 작업계획서에도 자동으로 함께 표시됩니다.

## 로컬에서 보기
```bash
cd our-home-interior
python3 -m http.server 8080
# 브라우저에서 http://localhost:8080
```

## 인터넷에 올려서 공유하기 (무료)
1. https://app.netlify.com/drop 접속
2. 이 폴더를 통째로 드래그&드롭
3. 생기는 링크를 애인/업자에게 공유

또는 Vercel / GitHub Pages 사용 가능.
