// 비상연락망. 이 사이트는 링크만 알면 누구나 볼 수 있으니 번호를 넣을 때 당사자 동의를 받는다
export const contacts = [
  { role: '회장', name: '문아정', phone: '010-6677-4633' },
  { role: '부회장', name: '박채빈', phone: '010-2295-6356' },
]

export const emergency = [
  { label: '화재·구급', phone: '119' },
  { label: '경찰', phone: '112' },
]

export const telHref = (phone) => `tel:${phone.replace(/[^0-9+]/g, '')}`
export const smsHref = (phone) => `sms:${phone.replace(/[^0-9+]/g, '')}`
