// 참가자용 타임테이블.xlsx를 그대로 옮긴 파일 (시트: 전체 · 상점가 거리 · 모자이크 · 간판)
// - team: true = 엑셀에서 노란 칸으로 칠해진 그 팀만의 일정
// - note 안의 줄바꿈 문자는 화면에서도 줄바꿈된다
// - '집결' 안내 첫 줄(CLC 희망터 앞 · 10:20까지 도착)은 집합 공지에 맞춰 엑셀 뒤에 덧붙인 것이다
// - Day 제목의 날짜(10/9, 10/10)로 MT 당일을 알아내서 지금 일정을 표시한다
export const timetable = {
  "all": [
    {
      "title": "Day 1 · 10/9(금)",
      "items": [
        {
          "time": "10:00~10:30",
          "title": "집결",
          "note": "CLC 희망터 앞 · 10:20까지 도착\n출석 체크 후 명찰 받기\n10:30 정시 출발! 늦으면 개별로 이동해야 해요",
          "team": false
        },
        {
          "time": "10:30",
          "title": "출발",
          "note": "간동면까지 약 40분",
          "team": false
        },
        {
          "time": "11:10",
          "title": "도착·점심",
          "note": "식당에서 점심 먹으면서 OT",
          "team": false
        },
        {
          "time": "11:50",
          "title": "조별 이동",
          "note": "담당 운영진을 따라 조별 장소로 이동",
          "team": false
        },
        {
          "time": "12:00",
          "title": "활동 시작",
          "note": "[모자이크] 마을회관에서 작업 준비\n[상점가 거리] 상점가 현장 스케치\n[간판] 간판 시안 작업",
          "team": false
        },
        {
          "time": "13:00",
          "title": "모자이크 작업 시작",
          "note": "[모자이크] 주민분들과 함께 모자이크 작업\n[상점가 거리] 마을회관으로 이동해서 채색\n(스케치를 더 하고 싶으면 14:00까지 상점가에 남아도 돼요)",
          "team": false
        },
        {
          "time": "14:00",
          "title": "쉬는 시간 (15분)",
          "note": "상점가 조 전원 마을회관에서 채색",
          "team": false
        },
        {
          "time": "16:00",
          "title": "모자이크 완성",
          "note": "작품을 모아 단체사진",
          "team": false
        },
        {
          "time": "16:30",
          "title": "정리",
          "note": "사용한 자리 정리. 간판 조도 마을회관으로 모이기",
          "team": false
        },
        {
          "time": "17:30",
          "title": "숙소 이동",
          "note": "",
          "team": false
        },
        {
          "time": "17:45",
          "title": "체크인·휴식",
          "note": "방 배정 후 18:30까지 씻고 쉬기",
          "team": false
        },
        {
          "time": "18:30",
          "title": "저녁 식사",
          "note": "",
          "team": false
        },
        {
          "time": "19:30",
          "title": "조별 중간 공유",
          "note": "조마다 10분씩 오늘 한 작업과 내일 계획 발표",
          "team": false
        },
        {
          "time": "20:30",
          "title": "자유시간",
          "note": "숙소 밖으로 나갈 때는 운영진에게 꼭 알려 주세요",
          "team": false
        }
      ]
    },
    {
      "title": "Day 2 · 10/10(토)",
      "items": [
        {
          "time": "10:00",
          "title": "기상",
          "note": "짐 정리",
          "team": false
        },
        {
          "time": "11:00",
          "title": "체크아웃",
          "note": "두고 가는 물건 없는지 확인",
          "team": false
        },
        {
          "time": "11:00~12:00",
          "title": "아침 겸 점심",
          "note": "",
          "team": false
        },
        {
          "time": "12:00",
          "title": "남은 작업",
          "note": "[모자이크] 작품 마감\n[상점가 거리] 채색 마무리\n[간판] 간판 제작\n상점가 거리·간판은 다 못 끝내면 학교에 돌아와서 마무리하고, 가게 전달은 전시 이후에 할 예정이에요",
          "team": false
        },
        {
          "time": "16:00",
          "title": "작업 종료·정리",
          "note": "전체 단체사진, 사용한 자리 정리",
          "team": false
        },
        {
          "time": "17:00",
          "title": "출발",
          "note": "",
          "team": false
        },
        {
          "time": "17:40",
          "title": "춘천 도착·해산",
          "note": "수고하셨습니다!",
          "team": false
        }
      ]
    }
  ],
  "street": [
    {
      "title": "Day 1 · 10/9(금)",
      "items": [
        {
          "time": "10:00~10:30",
          "title": "집결",
          "note": "CLC 희망터 앞 · 10:20까지 도착\n출석 체크 후 명찰 받기\n10:30 정시 출발! 늦으면 개별로 이동해야 해요",
          "team": false
        },
        {
          "time": "10:30",
          "title": "출발",
          "note": "간동면까지 약 40분",
          "team": false
        },
        {
          "time": "11:10",
          "title": "도착·점심",
          "note": "식당에서 점심 먹으면서 OT",
          "team": false
        },
        {
          "time": "11:50",
          "title": "조별 이동",
          "note": "담당 운영진을 따라 조별 장소로 이동",
          "team": false
        },
        {
          "time": "12:00",
          "title": "현장 스케치",
          "note": "상점가에서 거리 모습 스케치",
          "team": true
        },
        {
          "time": "12:50",
          "title": "스케치 마무리·이동",
          "note": "마을회관으로 이동\n스케치를 더 하고 싶으면 14:00까지 상점가에 남아도 돼요",
          "team": true
        },
        {
          "time": "13:00",
          "title": "채색",
          "note": "마을회관에서 스케치 채색 (모자이크 조와 같은 공간)",
          "team": true
        },
        {
          "time": "13:50",
          "title": "남은 인원 이동",
          "note": "상점가에 남았던 인원도 마을회관으로 이동",
          "team": true
        },
        {
          "time": "14:00",
          "title": "전원 채색",
          "note": "쉬는 시간 15분 후 이어서 채색",
          "team": true
        },
        {
          "time": "16:00",
          "title": "단체사진",
          "note": "모자이크 작품과 함께 단체사진",
          "team": true
        },
        {
          "time": "16:30",
          "title": "정리",
          "note": "사용한 자리 정리",
          "team": true
        },
        {
          "time": "17:30",
          "title": "숙소 이동",
          "note": "",
          "team": false
        },
        {
          "time": "17:45",
          "title": "체크인·휴식",
          "note": "방 배정 후 18:30까지 씻고 쉬기",
          "team": false
        },
        {
          "time": "18:30",
          "title": "저녁 식사",
          "note": "",
          "team": false
        },
        {
          "time": "19:30",
          "title": "조별 중간 공유",
          "note": "조마다 10분씩 오늘 한 작업과 내일 계획 발표",
          "team": false
        },
        {
          "time": "20:30",
          "title": "자유시간",
          "note": "숙소 밖으로 나갈 때는 운영진에게 꼭 알려 주세요",
          "team": false
        }
      ]
    },
    {
      "title": "Day 2 · 10/10(토)",
      "items": [
        {
          "time": "10:00",
          "title": "기상",
          "note": "짐 정리",
          "team": false
        },
        {
          "time": "11:00",
          "title": "체크아웃",
          "note": "두고 가는 물건 없는지 확인",
          "team": false
        },
        {
          "time": "11:00~12:00",
          "title": "아침 겸 점심",
          "note": "",
          "team": false
        },
        {
          "time": "12:00",
          "title": "채색 마무리",
          "note": "남은 채색 작업 마무리\n다 못 끝내면 학교에 돌아와서 마무리해요\n가게 전달은 전시 이후에 할 예정이에요",
          "team": true
        },
        {
          "time": "16:00",
          "title": "작업 종료·정리",
          "note": "전체 단체사진, 사용한 자리 정리",
          "team": false
        },
        {
          "time": "17:00",
          "title": "출발",
          "note": "",
          "team": false
        },
        {
          "time": "17:40",
          "title": "춘천 도착·해산",
          "note": "수고하셨습니다!",
          "team": false
        }
      ]
    }
  ],
  "mosaic": [
    {
      "title": "Day 1 · 10/9(금)",
      "items": [
        {
          "time": "10:00~10:30",
          "title": "집결",
          "note": "CLC 희망터 앞 · 10:20까지 도착\n출석 체크 후 명찰 받기\n10:30 정시 출발! 늦으면 개별로 이동해야 해요",
          "team": false
        },
        {
          "time": "10:30",
          "title": "출발",
          "note": "간동면까지 약 40분",
          "team": false
        },
        {
          "time": "11:10",
          "title": "도착·점심",
          "note": "식당에서 점심 먹으면서 OT",
          "team": false
        },
        {
          "time": "11:50",
          "title": "조별 이동",
          "note": "담당 운영진을 따라 조별 장소로 이동",
          "team": false
        },
        {
          "time": "12:00",
          "title": "작업 준비",
          "note": "마을회관에 테이블·캔버스·물감 세팅\n상점가 조 채색 자리도 함께 준비",
          "team": true
        },
        {
          "time": "13:00",
          "title": "모자이크 작업 시작",
          "note": "주민분들과 함께 모자이크 작업 (상점가 조도 합류해서 채색)",
          "team": true
        },
        {
          "time": "14:00",
          "title": "쉬는 시간 (15분)",
          "note": "",
          "team": true
        },
        {
          "time": "16:00",
          "title": "모자이크 완성",
          "note": "캔버스를 모아 단체사진, 주민분들 배웅",
          "team": true
        },
        {
          "time": "16:30",
          "title": "정리",
          "note": "마을회관 원상복구, 쓰레기 수거",
          "team": true
        },
        {
          "time": "17:30",
          "title": "숙소 이동",
          "note": "",
          "team": false
        },
        {
          "time": "17:45",
          "title": "체크인·휴식",
          "note": "방 배정 후 18:30까지 씻고 쉬기",
          "team": false
        },
        {
          "time": "18:30",
          "title": "저녁 식사",
          "note": "",
          "team": false
        },
        {
          "time": "19:30",
          "title": "조별 중간 공유",
          "note": "조마다 10분씩 오늘 한 작업과 내일 계획 발표",
          "team": false
        },
        {
          "time": "20:30",
          "title": "자유시간",
          "note": "숙소 밖으로 나갈 때는 운영진에게 꼭 알려 주세요",
          "team": false
        }
      ]
    },
    {
      "title": "Day 2 · 10/10(토)",
      "items": [
        {
          "time": "10:00",
          "title": "기상",
          "note": "짐 정리",
          "team": false
        },
        {
          "time": "11:00",
          "title": "체크아웃",
          "note": "두고 가는 물건 없는지 확인",
          "team": false
        },
        {
          "time": "11:00~12:00",
          "title": "아침 겸 점심",
          "note": "",
          "team": false
        },
        {
          "time": "12:00",
          "title": "작품 마감",
          "note": "모자이크 작품 마감",
          "team": true
        },
        {
          "time": "16:00",
          "title": "작업 종료·정리",
          "note": "전체 단체사진, 사용한 자리 정리",
          "team": false
        },
        {
          "time": "17:00",
          "title": "출발",
          "note": "",
          "team": false
        },
        {
          "time": "17:40",
          "title": "춘천 도착·해산",
          "note": "수고하셨습니다!",
          "team": false
        }
      ]
    }
  ],
  "sign": [
    {
      "title": "Day 1 · 10/9(금)",
      "items": [
        {
          "time": "10:00~10:30",
          "title": "집결",
          "note": "CLC 희망터 앞 · 10:20까지 도착\n출석 체크 후 명찰 받기\n10:30 정시 출발! 늦으면 개별로 이동해야 해요",
          "team": false
        },
        {
          "time": "10:30",
          "title": "출발",
          "note": "간동면까지 약 40분",
          "team": false
        },
        {
          "time": "11:10",
          "title": "도착·점심",
          "note": "식당에서 점심 먹으면서 OT",
          "team": false
        },
        {
          "time": "11:50",
          "title": "조별 이동",
          "note": "담당 운영진을 따라 조별 장소로 이동",
          "team": false
        },
        {
          "time": "12:00",
          "title": "시안 작업",
          "note": "간판 디자인 시안 작업",
          "team": true
        },
        {
          "time": "14:00",
          "title": "쉬는 시간 (15분)",
          "note": "",
          "team": true
        },
        {
          "time": "16:00",
          "title": "1일 차 작업 마무리",
          "note": "시안 정리",
          "team": true
        },
        {
          "time": "16:30",
          "title": "마을회관 합류",
          "note": "마을회관으로 이동해서 함께 정리",
          "team": true
        },
        {
          "time": "17:30",
          "title": "숙소 이동",
          "note": "",
          "team": false
        },
        {
          "time": "17:45",
          "title": "체크인·휴식",
          "note": "방 배정 후 18:30까지 씻고 쉬기",
          "team": false
        },
        {
          "time": "18:30",
          "title": "저녁 식사",
          "note": "",
          "team": false
        },
        {
          "time": "19:30",
          "title": "조별 중간 공유",
          "note": "조마다 10분씩 오늘 한 작업과 내일 계획 발표",
          "team": false
        },
        {
          "time": "20:30",
          "title": "자유시간",
          "note": "숙소 밖으로 나갈 때는 운영진에게 꼭 알려 주세요",
          "team": false
        }
      ]
    },
    {
      "title": "Day 2 · 10/10(토)",
      "items": [
        {
          "time": "10:00",
          "title": "기상",
          "note": "짐 정리",
          "team": false
        },
        {
          "time": "11:00",
          "title": "체크아웃",
          "note": "두고 가는 물건 없는지 확인",
          "team": false
        },
        {
          "time": "11:00~12:00",
          "title": "아침 겸 점심",
          "note": "",
          "team": false
        },
        {
          "time": "12:00",
          "title": "간판 제작",
          "note": "간판 제작\n다 못 끝내면 학교에 돌아와서 마무리해요\n가게 전달은 전시 이후에 할 예정이에요",
          "team": true
        },
        {
          "time": "16:00",
          "title": "작업 종료·정리",
          "note": "전체 단체사진, 사용한 자리 정리",
          "team": false
        },
        {
          "time": "17:00",
          "title": "출발",
          "note": "",
          "team": false
        },
        {
          "time": "17:40",
          "title": "춘천 도착·해산",
          "note": "수고하셨습니다!",
          "team": false
        }
      ]
    }
  ]
}
