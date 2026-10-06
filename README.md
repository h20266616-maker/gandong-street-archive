# 간동에 뭐가 있드래 — 간척월명로 상점가 아카이브

2026 하얀도화지 MT 때 걸었던 강원 화천군 간동면 간척월명로 상점가를 기록한 보기 전용 아카이브.
지도 위 번호 핀이나 목록을 누르면 그 가게에서 찍은 사진이 열린다.

- React + Vite + Tailwind CSS (JavaScript)
- 지도: Leaflet + react-leaflet, OpenStreetMap 타일
- 배포: Vercel (정적 사이트). 서버·DB는 아직 없음

## 폴더 구조

```
gandong-street-archive/
├─ client/                 ← 프론트엔드 (Vite 프로젝트)
│  ├─ public/photos/       ← 사진 (번호_가게이름_순번.jpg)
│  ├─ scripts/
│  │  ├─ check-photos.js   ← npm run check:photos
│  │  └─ geocode.js        ← npm run geocode (개발용 좌표 조회)
│  └─ src/
│     ├─ data/stores.js    ← 가게 데이터 (이름, 주소, 사진 수, 좌표)
│     ├─ data/site.js      ← 사이트 제목·소개 문구
│     └─ components/       ← MapView, StoreList, StoreDetail, Lightbox
└─ README.md
```

나중에 참여자 업로드·댓글 기능을 넣을 때 `server/` 폴더를 추가해서 Render·NeonDB와 연결한다.

## 실행

```bash
cd client
npm install
npm run dev
```

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 배포용 빌드 (`client/dist`) |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run check:photos` | `stores.js`의 `photoCount`와 실제 사진 파일이 맞는지 검사 |
| `npm run geocode` | Nominatim으로 주소 좌표 조회 (개발용, 결과는 손으로 `stores.js`에 고정) |

## 내용 고치기

- **문구**: `client/src/data/site.js`
- **사진 추가**: `client/public/photos/`에 `번호_slug_순번.jpg` 규칙으로 넣고 `stores.js`의 `photoCount`만 고친 뒤 `npm run check:photos`로 확인
- **가게 추가·수정**: `client/src/data/stores.js`. `slug`는 사진 파일명에 쓰인 이름 (예: `무래이커피 (MOORAEE COFFEE)` → `무래이커피`)

## 핀 위치 조정 (`?edit` 모드)

1. `npm run dev` 후 `http://localhost:5173/?edit` 접속
2. 핀을 드래그해서 실제 위치에 놓는다. 좌표가 없는 가게는 회색 핀으로 나온다
3. 놓을 때마다 화면 하단과 브라우저 콘솔에 `export const stores = [...]`가 출력된다
4. `stores.js`의 `stores` 배열을 그 내용으로 교체

`?edit`가 없는 일반 방문자에게는 드래그·출력 UI가 보이지 않는다.

> 현재 좌표는 307 간동우체국만 Nominatim 번지 단위 결과이고, 나머지는 OSM 기준점(292 오음보건진료소, 307 간동우체국) 사이를 번지 순서대로 보간한 근사값이다.

## 배포 (Vercel)

1. [Vercel](https://vercel.com) → **Add New… → Project** → GitHub의 `gandong-street-archive` 선택
2. **Root Directory: `client`** ← 이걸 빠뜨리면 빌드 실패
3. Framework Preset: **Vite** / Build Command: `npm run build` / Output Directory: `dist`
4. **Deploy**. 이후 `main`에 push할 때마다 자동 배포된다

## 작업 흐름

```bash
git add .
git commit -m "짧은 설명"
git push
```

## 남은 TODO

- [ ] 01 식물의정석 주소
- [ ] 13 미정이네 주소 (대략 위치만 알아도 `?edit` 모드에서 핀을 옮기면 됨)
- [ ] `01_식물의정석_7`(마을 전망 사진)을 식물의정석에 둘지, 사이트 메인 이미지로 뺄지 결정
- [ ] 나머지 가게 핀 위치를 `?edit` 모드에서 실제 위치로 미세 조정
