import { useState, useRef, useEffect } from 'react'
import { daysSince, getUpcomingAnniversaries, formatDate, dDay, getDDayLabel } from '../utils/dateUtils'
import { EVENT_CATEGORIES, getCategoryByKey, getEventsForDate, getEventPosition } from '../utils/eventUtils'

export default function CalendarPage({ data, navigate, initialDate, isDesktop }) {
  const { settings, entries, events, setEvents, customAnniversaries } = data

  // 커스텀 기념일을 현재 보고있는 연도에 투영하여 캘린더용 가상 이벤트로 변환 (매년 반복)
  function buildAnnivEvents(year) {
    if (!customAnniversaries) return []
    return customAnniversaries.map(a => {
      const orig = new Date(a.date)
      const m = String(orig.getMonth() + 1).padStart(2, '0')
      const d = String(orig.getDate()).padStart(2, '0')
      const dateStr = `${year}-${m}-${d}`
      return {
        id: `anniv-${a.id}-${year}`,
        title: a.title,
        date: dateStr,
        endDate: dateStr,
        category: 'anniversary',
        isAnniv: true,
      }
    })
  }
  const [viewDate, setViewDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date())
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [newEvent, setNewEvent] = useState({ title: '', date: '', endDate: '', time: '', location: '', category: 'date' })
  const eventFormRef = useRef(null)
  const titleInputRef = useRef(null)

  useEffect(() => {
    if (showAddEvent && eventFormRef.current) {
      // 폼이 열릴 때 상단으로 스크롤 (키보드/뷰포트 밖에 가려지지 않도록)
      setTimeout(() => {
        eventFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        titleInputRef.current?.focus({ preventScroll: true })
      }, 50)
    }
  }, [showAddEvent, editingEvent])

  const today = new Date()
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  // 정규 이벤트 + 현재/전후 연도의 커스텀 기념일 (월 경계 안전)
  const allEvents = [
    ...events,
    ...buildAnnivEvents(year - 1),
    ...buildAnnivEvents(year),
    ...buildAnnivEvents(year + 1),
  ]
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const startDate = new Date(settings.startDate)

  function getMilestoneForDate(d) {
    const days = Math.floor((d - startDate) / (1000 * 60 * 60 * 24)) + 1
    if (days > 0 && days % 100 === 0) return `${days}D`
    if (d.getMonth() === startDate.getMonth() && d.getDate() === startDate.getDate() && d > startDate) {
      const yearsSince = d.getFullYear() - startDate.getFullYear()
      if (yearsSince > 0) return `${yearsSince}Y`
    }
    return null
  }

  const cells = []
  for (let i = 0; i < startWeekday; i++) {
    const d = new Date(year, month, -startWeekday + i + 1)
    cells.push({ date: d, faded: true })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i)
    const milestone = getMilestoneForDate(d)
    const dateStr = formatDate(d, 'iso')
    const dayEntries = entries.filter(e => e.createdAt === dateStr)
    const dayEvents = getEventsForDate(allEvents, dateStr)
    const isToday = d.toDateString() === today.toDateString()
    const isSelected = d.toDateString() === selectedDate.toDateString()
    cells.push({ date: d, dateStr, milestone, entries: dayEntries, events: dayEvents, isToday, isSelected })
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date
    const d = new Date(last)
    d.setDate(d.getDate() + 1)
    cells.push({ date: d, faded: true })
  }

  function handleDateClick(cell) {
    if (cell.faded) return
    setSelectedDate(cell.date)
    setShowAddEvent(false)
    setEditingEvent(null)
  }

  function openAddEvent() {
    setEditingEvent(null)
    const dateStr = formatDate(selectedDate, 'iso')
    setNewEvent({ title: '', date: dateStr, endDate: dateStr, time: '', location: '', category: 'date' })
    setShowAddEvent(true)
  }

  function openEditEvent(event) {
    if (event.isAnniv) {
      // 커스텀 기념일은 설정에서만 편집 가능
      alert('이 기념일은 설정 메뉴에서 편집할 수 있어요')
      return
    }
    setEditingEvent(event.id)
    setNewEvent({
      title: event.title,
      date: event.date,
      endDate: event.endDate || event.date,
      time: event.time || '',
      location: event.location || '',
      category: event.category || 'date',
    })
    setShowAddEvent(true)
  }

  function handleSaveEvent() {
    if (!newEvent.title.trim()) return
    const dateStr = editingEvent ? newEvent.date : formatDate(selectedDate, 'iso')
    const eventData = {
      title: newEvent.title.trim(),
      date: dateStr,
      endDate: dateStr,
      time: newEvent.time,
      location: newEvent.location.trim(),
      category: newEvent.category,
    }
    if (editingEvent) {
      setEvents(events.map(e => e.id === editingEvent ? { ...e, ...eventData } : e))
    } else {
      setEvents([...events, { id: Date.now(), ...eventData }])
    }
    setNewEvent({ title: '', date: '', endDate: '', time: '', location: '', category: 'date' })
    setShowAddEvent(false)
    setEditingEvent(null)
  }

  function deleteEvent(id) {
    if (confirm('이 일정을 삭제할까요?')) {
      setEvents(events.filter(e => e.id !== id))
    }
  }

  const selectedDateStr = formatDate(selectedDate, 'iso')
  const selectedEntries = entries.filter(e => e.createdAt === selectedDateStr)
  const selectedEvents = getEventsForDate(allEvents, selectedDateStr)
  const upcoming = getUpcomingAnniversaries(settings, data.customAnniversaries, events, today).slice(0, isDesktop ? 6 : 3)

  // 이번 달의 모든 일정을 행별로 정렬 (일정 바 겹침 방지)
  // 각 일정에 트랙 번호 할당
  const monthEvents = allEvents.filter(e => {
    const eventStart = new Date(e.date)
    const eventEnd = new Date(e.endDate || e.date)
    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0)
    return eventStart <= monthEnd && eventEnd >= monthStart
  }).sort((a, b) => new Date(a.date) - new Date(b.date))

  // 트랙 할당 (각 일정이 캘린더에서 몇 번째 줄에 그려질지)
  const eventTracks = {}
  monthEvents.forEach(event => {
    const start = new Date(event.date)
    const end = new Date(event.endDate || event.date)
    let track = 0
    while (true) {
      const conflict = Object.entries(eventTracks).some(([eId, info]) => {
        if (info.track !== track) return false
        const eStart = new Date(info.start)
        const eEnd = new Date(info.end)
        return start <= eEnd && end >= eStart
      })
      if (!conflict) break
      track++
    }
    eventTracks[event.id] = { track, start: event.date, end: event.endDate || event.date }
  })

  const calendarBlock = (
    <div className="paper">
      {!isDesktop && <div className="tape-top"></div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingTop: isDesktop ? 0 : '8px' }}>
        {!isDesktop && <p className="meta" style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => navigate('dashboard')}>← 홈</p>}
        <p className="serif italic" style={{ fontSize: isDesktop ? '24px' : '18px', margin: 0, cursor: 'pointer' }} onClick={() => setViewDate(new Date())}>
          {formatDate(viewDate, 'monthEn')}
        </p>
        <div>
          <span className="meta" style={{ color: 'var(--text-muted)', cursor: 'pointer', marginRight: 8 }} onClick={() => setViewDate(new Date(year, month - 1, 1))}>←</span>
          <span className="meta" style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setViewDate(new Date(year, month + 1, 1))}>→</span>
        </div>
      </div>

      <div className="cal-grid" style={{ marginBottom: '6px' }}>
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
          <p key={d} className="meta" style={{
            fontSize: '9px',
            color: i === 0 ? 'var(--color-her)' : i === 6 ? 'var(--color-him)' : 'var(--text-muted)',
            textAlign: 'center', margin: 0
          }}>{d}</p>
        ))}
      </div>

      <div className="cal-grid cal-grid-events" style={{ marginBottom: '1rem' }}>
        {cells.map((cell, i) => {
          const dayNum = cell.date.getDate()
          const dayOfWeek = cell.date.getDay()
          const classes = ['cal-cell-v2']
          if (cell.faded) classes.push('faded')
          else if (dayOfWeek === 0) classes.push('sun')
          else if (dayOfWeek === 6) classes.push('sat')
          if (cell.isToday) classes.push('today')
          if (cell.milestone) classes.push('anniv')

          // 이 셀의 일정들 (트랙 순으로 정렬)
          const cellEvents = (cell.events || []).map(e => ({
            ...e,
            track: eventTracks[e.id]?.track ?? 0,
            position: getEventPosition(e, cell.dateStr),
          })).sort((a, b) => a.track - b.track)

          // 첫 사진과 해당 일기
          const photoEntry = cell.entries?.find(e => e.photos?.length > 0)
          const firstPhoto = photoEntry?.photos?.[0]
          const photoCount = cell.entries?.reduce((sum, e) => sum + (e.photos?.length || 0), 0) || 0

          return (
            <div
              key={i}
              className={classes.join(' ')}
              style={cell.isSelected && !cell.faded ? { boxShadow: 'inset 0 0 0 1.5px var(--color-her)' } : {}}
              onClick={() => handleDateClick(cell)}
            >
              {/* 날짜 숫자 */}
              <div className="cal-date-num">
                {cell.milestone ? (
                  <>
                    <span style={{ color: 'var(--color-her)', fontWeight: 500 }}>{dayNum}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', color: 'var(--color-accent)', display: 'block', marginTop: '-2px' }}>{cell.milestone}</span>
                  </>
                ) : (
                  <span className={cell.isToday ? 'today-num' : ''}>{dayNum}</span>
                )}
              </div>

              {/* 폴라로이드 사진 (있을 때만) */}
              {firstPhoto && (
                <div
                  className="cal-photo"
                  style={{
                    transform: `rotate(${((dayNum * 7) % 5) - 2}deg)`,
                    cursor: 'pointer',
                  }}
                  onClick={(ev) => {
                    ev.stopPropagation()
                    if (photoEntry) navigate('index', { viewEntry: photoEntry })
                  }}
                >
                  <div style={{
                    backgroundImage: `url(${firstPhoto.src})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    width: '100%',
                    height: '100%',
                  }}></div>
                  {photoCount > 1 && (
                    <span className="cal-photo-count">+{photoCount - 1}</span>
                  )}
                </div>
              )}

              {/* 일정 바 (트랙별) */}
              <div className="cal-events">
                {cellEvents.slice(0, 3).map(event => {
                  const cat = getCategoryByKey(event.category)
                  return (
                    <div
                      key={event.id}
                      className={`cal-event-bar pos-${event.position}`}
                      style={{
                        background: cat.color,
                        color: cat.textColor,
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedDate(cell.date)
                        openEditEvent(event)
                      }}
                      title={event.title}
                    >
                      {(event.position === 'start' || event.position === 'single') && (
                        <span>{cat.icon} {event.title}</span>
                      )}
                    </div>
                  )
                })}
                {cellEvents.length > 3 && (
                  <div className="cal-event-more">+{cellEvents.length - 3}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 선택된 날짜 카드 */}
      <div ref={eventFormRef} className="card" style={{ transform: 'rotate(-0.3deg)', position: 'relative', marginBottom: isDesktop ? 0 : '1rem', scrollMarginTop: '12px' }}>
        <div style={{ position: 'absolute', top: '-6px', right: '14px', width: '30px', height: '12px', background: 'rgba(212, 165, 116, 0.55)', borderRadius: '1px' }}></div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <p className="serif italic" style={{ fontSize: '14px', margin: 0 }}>{formatDate(selectedDate, 'kr')}</p>
          <p className="meta" style={{ color: 'var(--color-her)', cursor: 'pointer' }} onClick={() => showAddEvent ? setShowAddEvent(false) : openAddEvent()}>
            {showAddEvent ? '× 취소' : '+ 일정 추가'}
          </p>
        </div>

        {showAddEvent && (
          <div
            style={{ borderTop: '0.5px dashed var(--line-solid)', paddingTop: '10px', marginBottom: '10px' }}
            onFocus={(e) => {
              if (e.target.tagName === 'INPUT') {
                setTimeout(() => {
                  e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }, 250)
              }
            }}
          >
            <input
              ref={titleInputRef}
              type="text" placeholder="일정 제목" className="input-line"
              style={{ marginBottom: '8px', fontSize: '13px' }}
              value={newEvent.title}
              onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
            />

            {/* 카테고리 선택 */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {EVENT_CATEGORIES.map(cat => (
                <span
                  key={cat.key}
                  onClick={() => setNewEvent({ ...newEvent, category: cat.key })}
                  style={{
                    background: newEvent.category === cat.key ? cat.color : 'transparent',
                    color: newEvent.category === cat.key ? cat.textColor : 'var(--text-muted)',
                    border: `0.5px solid ${newEvent.category === cat.key ? cat.color : 'var(--text-faint)'}`,
                    padding: '3px 9px', borderRadius: '10px', cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', fontSize: '10px',
                  }}
                >{cat.icon} {cat.label}</span>
              ))}
            </div>

            {/* 날짜는 캘린더에서 선택한 날짜로 자동 지정 */}
            <p className="meta" style={{ color: 'var(--text-muted)', fontSize: '9px', margin: '0 0 8px' }}>
              ▸ {formatDate(selectedDate, 'kr')} 일정으로 추가됩니다
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '8px' }}>
              <input type="time" className="input-line" style={{ fontSize: '12px' }} value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} />
              <input type="text" placeholder="장소 (선택)" className="input-line" style={{ fontSize: '12px' }} value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {editingEvent && (
                <button
                  onClick={() => { deleteEvent(editingEvent); setShowAddEvent(false); setEditingEvent(null) }}
                  style={{ flex: 1, background: 'transparent', color: 'var(--color-her)', border: '0.5px solid var(--color-her)', padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px', cursor: 'pointer' }}
                >삭제</button>
              )}
              <button
                onClick={handleSaveEvent}
                style={{ flex: 2, background: 'var(--color-her)', color: 'white', border: 'none', padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px', cursor: 'pointer' }}
              >{editingEvent ? '수정' : '저장'}</button>
            </div>
          </div>
        )}

        <div style={{ borderTop: '0.5px dashed var(--line-solid)', paddingTop: '8px' }}>
          <p className="meta" style={{ color: 'var(--text-muted)', margin: '0 0 8px' }}>
            ▸ {selectedDate.toDateString() === today.toDateString() ? 'TODAY' : 'THIS DAY'}
          </p>

          {selectedEntries.map(entry => (
            <div key={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px', cursor: 'pointer' }} onClick={() => navigate('index', { viewEntry: entry })}>
              <div style={{ width: '4px', height: '4px', background: entry.author === 'her' ? 'var(--color-her)' : 'var(--color-him)', borderRadius: '50%', marginTop: '6px' }}></div>
              <div>
                <p className="serif" style={{ fontSize: '12px', margin: 0 }}>
                  {entry.author === 'her' ? settings.her.name.replace('장', '') : settings.him.name.replace('염', '')}의 일기 #{String(entry.number).padStart(3, '0')}
                </p>
                <p className="meta" style={{ color: 'var(--text-muted)', margin: 0 }}>{entry.title || entry.content.slice(0, 30)}</p>
              </div>
            </div>
          ))}

          {selectedEvents.map(event => {
            const cat = getCategoryByKey(event.category)
            return (
              <div key={event.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px', cursor: 'pointer' }} onClick={() => openEditEvent(event)}>
                <div style={{ width: '8px', height: '8px', background: cat.color, borderRadius: '2px', marginTop: '5px', flexShrink: 0 }}></div>
                <div style={{ flex: 1 }}>
                  <p className="serif" style={{ fontSize: '12px', margin: 0 }}>
                    <span style={{ color: cat.textColor }}>{cat.icon}</span> {event.title}
                  </p>
                  <p className="meta" style={{ color: 'var(--text-muted)', margin: 0 }}>
                    {event.time && `${event.time} · `}
                    {event.location}
                    {event.endDate && event.endDate !== event.date && ` · ~ ${event.endDate}`}
                  </p>
                </div>
              </div>
            )
          })}

          {selectedEntries.length === 0 && selectedEvents.length === 0 && !showAddEvent && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('write', { date: selectedDateStr })}>
              <div style={{ width: '4px', height: '4px', background: 'transparent', border: '1px solid var(--text-faint)', borderRadius: '50%', marginTop: '6px' }}></div>
              <p className="serif italic" style={{ fontSize: '12px', color: 'var(--text-faint)', margin: 0 }}>이 날의 기록 추가하기...</p>
            </div>
          )}
        </div>
      </div>

      {/* 카테고리 범례 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '0.5px dashed var(--line-dashed)' }}>
        {EVENT_CATEGORIES.map(cat => (
          <div key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '4px', background: cat.color, borderRadius: '2px' }}></div>
            <p className="meta" style={{ fontSize: '8px', color: 'var(--text-muted)', margin: 0 }}>{cat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )

  const upcomingBlock = (
    <div style={{ padding: isDesktop ? '0' : '12px 0', borderTop: isDesktop ? 'none' : '0.5px dashed var(--line-dashed)', marginBottom: '1rem' }}>
      <p className="label" style={{ margin: '0 0 12px' }}>▸ UPCOMING ANNIVERSARIES</p>

      {upcoming.length === 0 ? (
        <p className="serif italic" style={{ fontSize: '12px', color: 'var(--text-faint)', textAlign: 'center', padding: '12px' }}>다가오는 기념일이 없어요</p>
      ) : (
        upcoming.map((a, i) => (
          <div key={i} className={i === 0 && a.dDay <= 5 ? 'card-warm' : 'card'} style={{ marginBottom: '8px', transform: i === 0 && a.dDay <= 5 ? 'rotate(-0.3deg)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="serif" style={{ fontSize: '13px', margin: 0 }}>{a.title}</p>
                <p className="meta" style={{ color: i === 0 && a.dDay <= 5 ? 'var(--color-accent)' : 'var(--text-muted)', margin: '2px 0 0' }}>
                  {formatDate(a.date, 'full')}
                  {a.dDay === 0 && ' · TODAY ✦'}
                  {a.dDay === 1 && ' · TOMORROW ✦'}
                </p>
              </div>
              <p className="serif italic" style={{ fontSize: i === 0 && a.dDay <= 5 ? '18px' : '14px', color: i === 0 && a.dDay <= 5 ? 'var(--color-her)' : 'var(--text-secondary)', margin: 0 }}>
                {getDDayLabel(a.dDay)}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  )

  if (isDesktop) {
    return (
      <div className="desktop-calendar">
        <div>{calendarBlock}</div>
        <div>
          <div className="paper" style={{ padding: '24px' }}>
            {upcomingBlock}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="phone">
      {calendarBlock}
      <div style={{ padding: '0 20px 20px' }}>
        {upcomingBlock}
      </div>
    </div>
  )
}
