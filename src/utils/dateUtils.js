/**
 * 날짜 계산 유틸리티
 * D+일수, 100일 단위 기념일, 주년 자동 계산
 */

export function daysSince(startDate, today = new Date()) {
  const start = new Date(startDate)
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24))
  return diff + 1 // 만난 날을 1일째로
}

export function dDay(targetDate, today = new Date()) {
  const target = new Date(targetDate)
  const t = new Date(today)
  t.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = Math.floor((target - t) / (1000 * 60 * 60 * 24))
  return diff
}

/**
 * 100일 단위 다음 기념일 찾기
 * 예: D+329이면 다음 100일 단위는 D+400 (71일 남음)
 */
export function nextHundredDayAnniversary(startDate, today = new Date()) {
  const days = daysSince(startDate, today)
  const nextMilestone = Math.ceil(days / 100) * 100
  if (nextMilestone === days) {
    // 오늘이 100일 단위면 다음 100일 반환
    const target = new Date(startDate)
    target.setDate(target.getDate() + nextMilestone + 100 - 1)
    return { days: nextMilestone + 100, date: target, dDay: 100 }
  }
  const target = new Date(startDate)
  target.setDate(target.getDate() + nextMilestone - 1)
  return { days: nextMilestone, date: target, dDay: nextMilestone - days }
}

/**
 * 다음 주년 기념일 찾기
 */
export function nextYearAnniversary(startDate, today = new Date()) {
  const start = new Date(startDate)
  const t = new Date(today)
  t.setHours(0, 0, 0, 0)

  let years = t.getFullYear() - start.getFullYear()
  const target = new Date(start)
  target.setFullYear(start.getFullYear() + years)

  if (target < t) {
    years += 1
    target.setFullYear(start.getFullYear() + years)
  }

  const diff = Math.floor((target - t) / (1000 * 60 * 60 * 24))
  return { years, date: target, dDay: diff }
}

/**
 * 다음 생일 찾기
 */
export function nextBirthday(birthday, today = new Date()) {
  if (!birthday) return null
  const b = new Date(birthday)
  const t = new Date(today)
  t.setHours(0, 0, 0, 0)

  const target = new Date(t.getFullYear(), b.getMonth(), b.getDate())
  if (target < t) {
    target.setFullYear(t.getFullYear() + 1)
  }
  const diff = Math.floor((target - t) / (1000 * 60 * 60 * 24))
  return { date: target, dDay: diff, age: target.getFullYear() - b.getFullYear() }
}

/**
 * 다가오는 모든 기념일 + 정렬
 */
export function getUpcomingAnniversaries(settings, customAnniversaries = [], events = [], today = new Date()) {
  const list = []

  if (settings.notifications?.hundredDays) {
    const next100 = nextHundredDayAnniversary(settings.startDate, today)
    list.push({
      type: 'hundred',
      title: `우리 만난 지 ${next100.days}일`,
      date: next100.date,
      dDay: next100.dDay,
      special: true,
    })
  }

  if (settings.notifications?.anniversary) {
    const nextYear = nextYearAnniversary(settings.startDate, today)
    if (nextYear.years > 0) {
      list.push({
        type: 'year',
        title: `우리 만난 지 ${nextYear.years * 365}일 ✦ ${nextYear.years}주년`,
        date: nextYear.date,
        dDay: nextYear.dDay,
        special: true,
      })
    }
  }

  if (settings.notifications?.birthday) {
    const herBday = nextBirthday(settings.her?.birthday, today)
    if (herBday) {
      list.push({
        type: 'birthday',
        title: `${settings.her?.name || '여자친구'} 생일`,
        date: herBday.date,
        dDay: herBday.dDay,
        person: 'her',
      })
    }
    const himBday = nextBirthday(settings.him?.birthday, today)
    if (himBday) {
      list.push({
        type: 'birthday',
        title: `${settings.him?.name || '남자친구'} 생일`,
        date: himBday.date,
        dDay: himBday.dDay,
        person: 'him',
      })
    }
  }

  // 사용자 커스텀 기념일
  customAnniversaries.forEach(a => {
    const next = nextBirthday(a.date, today) // 매년 반복
    if (next) {
      list.push({
        type: 'custom',
        title: a.title,
        date: next.date,
        dDay: next.dDay,
      })
    }
  })

  // 직접 추가 일정 (1회성)
  events.forEach(e => {
    const d = dDay(e.date, today)
    if (d >= 0) {
      list.push({
        type: 'event',
        title: e.title,
        date: new Date(e.date),
        dDay: d,
        time: e.time,
        location: e.location,
      })
    }
  })

  return list.sort((a, b) => a.dDay - b.dDay)
}

/**
 * 날짜 포맷
 */
export function formatDate(date, format = 'full') {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const dayKr = days[d.getDay()]
  const daysEn = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const dayEn = daysEn[d.getDay()]

  switch (format) {
    case 'full': return `${year}.${month}.${day} ${dayEn}`
    case 'short': return `${month}.${day}`
    case 'kr': return `${parseInt(month)}월 ${parseInt(day)}일 · ${dayKr}요일`
    case 'iso': return `${year}-${month}-${day}`
    case 'monthEn': {
      const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']
      return `${months[d.getMonth()]} ${year}`
    }
    default: return `${year}.${month}.${day}`
  }
}

export function getDDayLabel(d) {
  if (d === 0) return 'TODAY'
  if (d > 0) return `D-${d}`
  return `D+${Math.abs(d)}`
}
