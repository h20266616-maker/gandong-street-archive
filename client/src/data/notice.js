// 공지. 하나도 없으면 공지 탭에 '아직 공지가 없어요'가 나온다.
// 형식: { id, pin, label, title, items?, text? }
// - id: 체크 상태를 저장하는 이름 (각자 핸드폰에 ck_id로 저장된다). 바꾸면 체크가 초기화된다
// - pin: true면 맨 위에 고정되고 왼쪽에 검은 막대, 탭바 공지 아이콘에 점이 찍힌다
// - items: 있으면 누르면 체크되는 체크리스트로 보인다 (글자 배열)
// - text: 회색 바탕 강조 문단
// 예전 형식 { pin, label, text }도 그대로 보인다 (title이 없으면 label이 제목)
export const notices = []
