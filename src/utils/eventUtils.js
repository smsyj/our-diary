/**
 * 일정 카테고리 정의
 * 각 카테고리는 컬러바로 캘린더에 표시됨
 */

export const EVENT_CATEGORIES = [
  { key: 'date', label: '데이트', icon: '♡', color: '#F4C0D1', textColor: '#8B3A55' },
  { key: 'trip', label: '여행', icon: '✈', color: '#B5D4F4', textColor: '#1E5A95' },
  { key: 'anniversary', label: '기념일', icon: '✦', color: '#FAD7A0', textColor: '#A56A14' },
  { key: 'meeting', label: '약속', icon: '☕', color: '#C8E6C9', textColor: '#2E7D4F' },
  { key: 'event', label: '이벤트', icon: '🎉', color: '#E1BEE7', textColor: '#6A4C8A' },
  { key: 'other', label: '기타', icon: '·', color: '#E8DCC4', textColor: '#5C4226' },
]

export function getCategoryByKey(key) {
  return EVENT_CATEGORIES.find(c => c.key === key) || EVENT_CATEGORIES[5]
}

/**
 * 시작일~종료일 사이의 모든 날짜 배열 반환
 */
export function getDatesInRange(startDate, endDate) {
  const dates = []
  const start = new Date(startDate)
  const end = new Date(endDate || startDate)
  const current = new Date(start)
  current.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  while (current <= end) {
    const y = current.getFullYear()
    const m = String(current.getMonth() + 1).padStart(2, '0')
    const d = String(current.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    current.setDate(current.getDate() + 1)
  }
  return dates
}

/**
 * 특정 날짜에 해당하는 모든 일정 (시작/종료 범위 안에 있는 것)
 */
export function getEventsForDate(events, dateStr) {
  return events.filter(e => {
    const start = e.date
    const end = e.endDate || e.date
    return dateStr >= start && dateStr <= end
  })
}

/**
 * 일정의 위치 (시작/중간/종료) 판별 - 바 그릴 때 모서리 처리용
 */
export function getEventPosition(event, dateStr) {
  const isStart = event.date === dateStr
  const isEnd = (event.endDate || event.date) === dateStr
  if (isStart && isEnd) return 'single'
  if (isStart) return 'start'
  if (isEnd) return 'end'
  return 'middle'
}
