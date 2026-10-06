# 간척월명로

2026년 10월 하얀도화지 MT 때 걸었던 강원 화천군 간동면 간척월명로의 가게 13곳과 사진 40장. 보기 전용 사이트.

## 화면

핸드폰으로 보는 게 기본이다. 카카오맵·네이버지도 앱처럼 **지도 전체 화면 + 아래 바텀시트**.

- 지도: 카카오맵을 원래 색으로, 평면으로. 상점가는 흰 원 번호 핀, MT 장소는 검은 사각 `A/B/C`
- 위쪽: `간척월명로` 바와 칩 `전체 · MT 장소 · 식당 · 카페·떡집 · 상점·기관`
- 오른쪽 버튼: `3D`(지도를 기울이고 막대 핀으로, 두 손가락으로 회전) · `◎` 내 위치 · `+` · `−`
- 바텀시트: peek 36% · half 52% · full 88%. 손잡이를 끌거나 탭한다
  - 목록: 상점가 → MT 장소 → 상점가 밖. 칩 필터를 따른다
  - 상세: `← 목록 · 길찾기(카카오맵 앱) · 사진 n장`, 가로로 넘기는 사진, 이전·다음 장소, 아래로 전체 사진
- 사진을 누르면 검은 라이트박스 (스와이프, `닫기`)
- 링크: `?shop=10`, `?shop=A`로 그 장소 상세가 바로 열린다 (단톡방 공유용). `?view=mt`는 MT 장소 칩
- 900px 이상에서는 바텀시트가 왼쪽 420px 패널이 된다
- UI는 흑백, 사진은 원본 색. 누를 수 있는 것은 모두 44px 이상

기술: React + Vite + Tailwind CSS (JavaScript), 카카오맵(react-kakao-maps-sdk). 배포는 Vercel 정적 사이트.

## 폴더 구조

```
gandong-street-archive/
├─ client/                 ← 프론트엔드 (Vite 프로젝트)
│  ├─ public/photos/       ← 사진 (번호_가게이름_순번.jpg), thumb/ 는 목록용 400px 썸네일
│  ├─ scripts/
│  │  ├─ check-photos.js   ← npm run check:photos
│  │  ├─ make-thumbs.js    ← npm run thumbs (400px 썸네일 만들기)
│  │  └─ geocode.js        ← npm run geocode (개발용 좌표 조회)
│  └─ src/
│     ├─ data/stores.js    ← 가게 데이터 (이름, 주소, 사진 수, 좌표)
│     ├─ data/mtPlaces.js  ← MT 장소 3곳 (숙소·MT 장소)
│     ├─ data/site.js      ← 머리 바 문구
│     ├─ data/places.js    ← 가게·MT 장소를 목록·지도에서 같이 다루는 묶음, 목록 순서, 길찾기 링크
│     └─ components/       ← KakaoMain(지도·핀·3D·내 위치), BottomSheet, PlaceList, PlaceDetail, Lightbox, EditMap(?edit)
└─ README.md
```

나중에 참여자 업로드·댓글 기능을 넣을 때 `server/` 폴더를 추가해서 Render·NeonDB와 연결한다.

## 실행

```bash
cd client
npm install
npm run dev
```

### 카카오맵 키

`client/.env.example`을 `client/.env`로 복사하고 JavaScript 키를 넣는다. `.env`는 GitHub에 올라가지 않는다.

```
VITE_KAKAO_MAP_KEY=카카오_JavaScript_키
```

[Kakao Developers](https://developers.kakao.com) → 내 애플리케이션 → 앱 설정 → 플랫폼 → **Web 사이트 도메인**에 아래 주소를 등록해야 지도가 뜬다. 등록 안 된 주소에서는 지도가 뜨지 않는다.

- `http://localhost:5173` (개발)
- `https://gandong-street-archive.vercel.app` (운영, 아래 배포 섹션 참고)

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 배포용 빌드 (`client/dist`) |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run thumbs` | 목록용 400px 썸네일 만들기 (사진을 넣은 뒤 실행) |
| `npm run check:photos` | `stores.js`의 `photoCount`와 실제 사진 파일이 맞는지 검사 |
| `npm run geocode` | Nominatim으로 주소 좌표 조회 (개발용, 결과는 손으로 `stores.js`에 고정) |

## 내용 고치기

- **문구**: `client/src/data/site.js`
- **한 줄 기록**: `stores.js` 각 가게의 `memo`. 상세 머리에 한 줄로 나오고, 비어 있으면 숨김
- **분류**: `stores.js`의 `cat`과 `categories` (칩 이름)
- **MT 장소 사진**: `client/public/photos/mt/`에 `A_월남파병용사만남의장_1.jpg`처럼 넣고 `mtPlaces.js`의 `photoCount`만 고친다. 0장이면 `사진 준비 중` 카드가 나온다
- **사진 추가**: `client/public/photos/`에 `번호_slug_순번.jpg` 규칙으로 넣고 `stores.js`의 `photoCount`를 고친 뒤 `npm run thumbs` → `npm run check:photos`
- **가게 추가·수정**: `client/src/data/stores.js`. `slug`는 사진 파일명에 쓰인 이름 (예: `무래이커피 (MOORAEE COFFEE)` → `무래이커피`)

## 핀 위치 조정 (`?edit` 모드)

1. `npm run dev` 후 `http://localhost:5173/?edit` 접속
2. 핀을 드래그해서 실제 위치에 놓는다. 좌표가 없는 가게는 회색 핀으로 나온다
3. 놓을 때마다 화면 아래 검은 칸과 브라우저 콘솔에 `export const stores = [...]`가 출력된다
4. `stores.js`의 `stores` 배열, `mtPlaces.js`의 `mtPlaces` 배열을 그 내용으로 교체

MT 장소는 상점가에서 멀어서 첫 화면 밖에 있다. 지도 왼쪽 위 `A · B · C` 버튼으로 옮겨 가서 끈다.

`?edit`가 없는 일반 방문자에게는 드래그·출력 UI가 보이지 않는다.

> 별관(`annex: true`, 지금은 01 식물의정석)은 목록 맨 아래 `상점가 밖`에 나온다.
>
> 현재 좌표는 카카오 주소 검색(번지 단위) 결과를 고정한 값이다. 07 다올미용실(306 검색 안 됨)은 우체국 옆에, 312의 세 가게는 도로 방향을 따라 약 12m 간격으로 벌려 놓았다.

## 배포 (Vercel)

**운영 주소: https://gandong-street-archive.vercel.app**

| 항목 | 값 |
|---|---|
| Vercel 프로젝트 | `gandong-street-archive` (h20266616-maker's projects) |
| GitHub 연결 | `h20266616-maker/gandong-street-archive`, `main` 브랜치 → push하면 자동 운영 배포 |
| Root Directory | `client` |
| Framework / Build / Output | Vite / `npm run build` / `dist` |
| 환경변수 | `VITE_KAKAO_MAP_KEY` (Production·Preview·Development, 타입 Config) |

- Vite 환경변수는 **빌드할 때** 코드에 들어간다. 키를 바꾸면 반드시 다시 배포해야 한다.
- 카카오 JavaScript 키는 원래 브라우저에 공개되는 키라 Config 타입으로 둔다. 보안은 아래 도메인 등록으로 제한된다.
- CLI로 직접 배포할 때는 프로젝트 루트(`client` 바깥)에서 `npx vercel@latest --prod`. `.vercelignore`가 `.env`를 업로드에서 뺀다.

### 처음부터 다시 만들 때

1. Vercel → **Add New… → Project** → GitHub의 `gandong-street-archive` 선택
2. **Root Directory: `client`** ← 이걸 빠뜨리면 빌드 실패
3. Framework Preset: **Vite** / Build Command: `npm run build` / Output Directory: `dist`
4. Environment Variables에 `VITE_KAKAO_MAP_KEY` 추가 → **Deploy**
5. Settings → Domains에서 `gandong-street-archive.vercel.app` 추가

### 카카오 도메인 등록

[Kakao Developers](https://developers.kakao.com) → 내 애플리케이션 → (화천 앱과 같은 앱) → 앱 설정 → 플랫폼 → **Web → 사이트 도메인**에 아래 주소가 있어야 카카오맵이 뜬다. 없으면 지도가 뜨지 않고 목록만 보인다.

- `https://gandong-street-archive.vercel.app` (운영)
- `http://localhost:5173` (개발, 이미 등록됨)

등록 후 반영까지 몇 분 걸릴 수 있다. 미등록이면 SDK 요청이 `401 domain mismatched`로 거절된다.

## 작업 흐름

```bash
git add .
git commit -m "짧은 설명"
git push
```

## 남은 TODO

- [x] 01 식물의정석 → 별관(간동면 유촌리 1043-4, 상점가에서 서쪽 약 3km)으로 분리
- [ ] 312번지 세 가게(11·12·13)의 실제 순서·위치를 `?edit` 모드에서 확인
- [x] 13 미정이네 주소 → 간척월명로 312 (카카오맵 장소 검색)
- [ ] `01_식물의정석_7`(마을 전망 사진)을 식물의정석에 둘지, 사이트 메인 이미지로 뺄지 결정
