// MT 타임테이블. 시간은 'HH:MM'으로 채운다 (모르면 '--:--').
// - date: 'YYYY-MM-DD'. 화면의 요일은 날짜에서 계산한다
// - place: 지도에서 찾을 장소 id ('A'~'D', '02'~'13') → 행에 [지도] 버튼이 붙고 누르면 지도 탭에서 그 장소가 선택된다
//   연결할 곳이 없으면 null
// - 그날 MT 중에는 지금 시각에 해당하는 일정이 반전된다
export const timetable = [
  {
    day: 1,
    date: '2026-10-09',
    items: [
      { time: '--:--', title: '한림대학교 출발', where: '학교 정문', place: null },
      { time: '--:--', title: '간동 도착 · 점심', where: '장소 미정', place: null },
      { time: '--:--', title: '작업', where: '간동종합문화센터', place: 'D' },
      { time: '--:--', title: '상점가 기록 산책', where: '간척월명로 상점가', place: '02' },
      { time: '--:--', title: '저녁', where: '장소 미정', place: null },
      { time: '--:--', title: '숙소 체크인', where: '월남파병용사만남의장', place: 'A' },
    ],
  },
  {
    day: 2,
    date: '2026-10-10',
    items: [
      { time: '--:--', title: '숙소 출발', where: '월남파병용사만남의장', place: 'A' },
      { time: '--:--', title: '작업 마무리', where: '간동종합문화센터', place: 'D' },
      { time: '--:--', title: '점심', where: '장소 미정', place: null },
      { time: '--:--', title: '학교 도착', where: '한림대학교', place: null },
    ],
  },
]
