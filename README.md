# Our Diary 💌

은진 & 상명의 커플 다이어리. 빈티지 폴라로이드 무드의 React 앱.

## ✦ 기능

- 📔 **일기 작성/공유** - 두 사람이 함께 쓰는 일기 (사진 9장 + 태그 + 기분/날씨/장소)
- 📷 **갤러리** - 월별 자동 정리, 작성자 필터, 즐겨찾기
- 📅 **캘린더** - 일정 추가, 일기 표시, 기념일 자동 강조
- 🎉 **기념일 자동 계산** - 100일 단위 + 주년 + 생일 (5/7/10일 전부터 알림)
- ⚙️ **설정** - 시작 날짜, 이름, 컬러, 백업

## ✦ 1단계: 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

**테스트 계정:**
- 은진: `eunjin` / `0601`
- 상명: `sangmyeong` / `0601`

## ✦ 2단계: GitHub Pages 배포

### 1. GitHub 저장소 만들기

1. GitHub에서 새 저장소 생성 (예: `our-diary`)
2. 이 코드를 push:
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/[USERNAME]/our-diary.git
git push -u origin main
```

### 2. vite.config.js 수정

저장소 이름에 맞게 `base` 경로 수정:

```js
// vite.config.js
base: '/our-diary/',  // ← 본인 저장소 이름으로 변경
```

### 3. GitHub Pages 활성화

저장소 → Settings → Pages → Source를 **GitHub Actions**로 설정.

### 4. 자동 배포

`main` 브랜치에 푸시하면 자동으로 빌드 + 배포됩니다.
배포 URL: `https://[USERNAME].github.io/our-diary/`

## ✦ 3단계 (예정): Cloudflare 백엔드 연동

현재 1단계는 데이터를 브라우저(localStorage)에 저장.
다음 단계에서 Cloudflare Workers + D1 + R2로 클라우드 동기화.

- ✅ Workers: 백엔드 API + 인증
- ✅ D1: 일기/일정 데이터베이스
- ✅ R2: 사진 저장소 (10GB 무료)

## ✦ 폴더 구조

```
src/
├── App.jsx                 # 라우팅
├── main.jsx                # 진입점
├── pages/
│   ├── LoginPage.jsx       # 1. 로그인
│   ├── DashboardPage.jsx   # 2. 대시보드
│   ├── WritePage.jsx       # 3. 일기 작성
│   ├── CalendarPage.jsx    # 4. 캘린더
│   ├── GalleryPage.jsx     # 5. 갤러리
│   └── SettingsPage.jsx    # 6. 설정
├── hooks/
│   └── useAppData.js       # 전역 데이터 관리
├── utils/
│   ├── dateUtils.js        # 날짜/D+/기념일 계산
│   └── photoUtils.js       # 사진 압축/처리
└── styles/
    ├── diary.css           # 디자인 토큰
    └── index.css           # 반응형 + 글로벌
```

## ✦ 디자인 수정

색상/폰트는 `src/styles/diary.css` 파일 상단의 `:root` 변수에서:

```css
--color-her: #B73E5F;       /* 은진 컬러 */
--color-him: #1E5A95;        /* 상명 컬러 */
--paper-bg: #F1E6D2;         /* 종이 베이지 */
--font-serif: 'Cormorant Garamond'...
```

## ✦ 반응형

- 모바일: 풀스크린 (480px 이하)
- PC: 폰 프레임 중앙 정렬 (768px 이상)
