import { useRef } from 'react'
import { daysSince, getUpcomingAnniversaries, formatDate, getDDayLabel } from '../utils/dateUtils'
import { processPhoto } from '../utils/photoUtils'

export default function DashboardPage({ data, navigate, isDesktop }) {
  const { settings, setSettings, entries } = data
  const fileInputRef = useRef(null)

  const today = new Date()
  const days = daysSince(settings.startDate, today)
  const upcoming = getUpcomingAnniversaries(settings, data.customAnniversaries, data.events, today)
  const recentEntries = [...entries].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  )

  async function handleCoverPhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const photo = await processPhoto(file)
      setSettings({ ...settings, coverPhoto: photo.src })
    } catch (err) {
      console.error('대표 사진 업로드 실패:', err)
      alert('사진 업로드 실패: ' + err.message)
    } finally {
      e.target.value = ''
    }
  }

  if (isDesktop) {
    return <DashboardDesktop
      settings={settings}
      days={days}
      upcoming={upcoming}
      recentEntries={recentEntries}
      navigate={navigate}
      fileInputRef={fileInputRef}
      handleCoverPhotoChange={handleCoverPhotoChange}
      data={data}
    />
  }

  return <DashboardMobile
    settings={settings}
    days={days}
    upcoming={upcoming}
    recentEntries={recentEntries.slice(0, 2)}
    navigate={navigate}
    fileInputRef={fileInputRef}
    handleCoverPhotoChange={handleCoverPhotoChange}
  />
}

// ============= 데스크탑 ============= 
function DashboardDesktop({ settings, days, upcoming, recentEntries, navigate, fileInputRef, handleCoverPhotoChange, data }) {
  return (
    <>
      <div className="desktop-main-header">
        <div>
          <p className="desktop-main-subtitle">— TODAY · {formatDate(new Date(), 'full')} —</p>
          <p className="desktop-main-title">Welcome back, {settings.her.name.replace('장', '')} & {settings.him.name.replace('염', '')}</p>
        </div>
      </div>

      <div className="desktop-dashboard">
        {/* 왼쪽 - 대표 사진 + D+ */}
        <div>
          <div className="desktop-card" style={{ marginBottom: '24px' }}>
            <div className="desktop-card-tape"></div>

            <div className="polaroid"
              style={{ transform: 'rotate(-2.5deg)', cursor: 'pointer', maxWidth: '100%', margin: '8px auto' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="polaroid-tape"></div>
              {settings.coverPhoto ? (
                <div style={{ height: '220px', backgroundImage: `url(${settings.coverPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
              ) : (
                <div className="polaroid-inner" style={{ height: '220px' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                  <p className="meta" style={{ color: 'var(--text-muted)', margin: '8px 0 0' }}>+ CLICK TO ADD</p>
                </div>
              )}
              <p className="meta" style={{ color: 'var(--text-primary)', margin: '8px 0 0', textAlign: 'center' }}>
                {settings.coverPhoto ? '대표 사진' : '대표 사진을 추가해보세요'}
              </p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="file-input-hidden" onChange={handleCoverPhotoChange} />
          </div>

          <div className="desktop-card" style={{ textAlign: 'center' }}>
            <p className="label" style={{ letterSpacing: '3px', marginBottom: '4px' }}>
              TOGETHER SINCE {settings.startDate.replaceAll('-', '.')}
            </p>
            <p className="serif" style={{ fontSize: '48px', margin: 0, lineHeight: 1 }}>D+{days}</p>
            <p className="serif italic" style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '8px 0 0' }}>
              우리 만난 지 {days}일째
            </p>
          </div>
        </div>

        {/* 가운데 - 최근 일기 */}
        <div>
          <div className="desktop-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p className="label" style={{ letterSpacing: '2px', margin: 0 }}>▸ RECENT ENTRIES</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <p className="meta" style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => navigate('index')}>📑 목차</p>
                <p className="meta" style={{ color: 'var(--color-her)', cursor: 'pointer' }} onClick={() => navigate('write')}>+ 새 일기</p>
              </div>
            </div>

            {recentEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p className="serif italic" style={{ color: 'var(--text-faint)', margin: 0 }}>
                  아직 일기가 없어요
                </p>
                <p className="meta" style={{ color: 'var(--text-muted)', margin: '8px 0 0' }}>
                  첫 번째 이야기를 적어볼까요?
                </p>
              </div>
            ) : (
              recentEntries.slice(0, 5).map((entry, i) => (
                <div
                  key={entry.id}
                  className="desktop-entry-card"
                  style={{
                    background: 'var(--paper-cream)',
                    border: '0.5px solid var(--line-solid)',
                    padding: '14px 16px',
                    marginBottom: '10px',
                    transform: i % 2 === 0 ? 'rotate(0.3deg)' : 'rotate(-0.3deg)',
                    borderRadius: '4px'
                  }}
                  onClick={() => navigate('index', { viewEntry: entry })}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <p className="meta" style={{ color: entry.author === 'her' ? 'var(--color-her)' : 'var(--color-him)', letterSpacing: '1px' }}>
                      {entry.author === 'her' ? settings.her.name.replace('장', '') : settings.him.name.replace('염', '')} ✦ {formatDate(entry.createdAt, 'short')}
                    </p>
                    <p className="meta" style={{ color: '#8B7355', fontSize: '9px' }}>#{String(entry.number).padStart(3, '0')}</p>
                  </div>
                  {entry.title && (
                    <p className="serif italic" style={{ fontSize: '15px', margin: '0 0 6px' }}>{entry.title}</p>
                  )}
                  <p className="serif" style={{ fontSize: '13px', lineHeight: 1.7, margin: 0 }}>
                    {entry.content.length > 120 ? entry.content.slice(0, 120) + '...' : entry.content}
                  </p>
                  {entry.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {entry.tags.slice(0, 4).map(tag => (
                        <span key={tag} style={{
                          fontFamily: 'var(--font-mono)', fontSize: '9px',
                          color: 'var(--text-muted)'
                        }}>#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 오른쪽 - 다가오는 일정 + 통계 */}
        <div>
          <div className="desktop-card" style={{ marginBottom: '24px' }}>
            <p className="label" style={{ letterSpacing: '2px', margin: '0 0 14px' }}>✦ COMING UP</p>

            {upcoming.length === 0 ? (
              <p className="serif italic" style={{ fontSize: '13px', color: 'var(--text-faint)', textAlign: 'center', padding: '20px 0' }}>
                다가오는 일정이 없어요
              </p>
            ) : (
              upcoming.slice(0, 4).map((a, i) => (
                <div
                  key={i}
                  style={{
                    background: i === 0 && a.dDay <= 5 ? 'var(--paper-warm)' : 'var(--paper-cream)',
                    border: i === 0 && a.dDay <= 5 ? '0.5px solid var(--color-accent-border)' : '0.5px solid var(--line-solid)',
                    padding: '10px 12px',
                    marginBottom: '8px',
                    borderRadius: '4px',
                  }}
                >
                  <p className="serif" style={{ fontSize: '13px', margin: '0 0 2px' }}>{a.title}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <p className="meta" style={{ color: 'var(--text-muted)', margin: 0 }}>{formatDate(a.date, 'short')}</p>
                    <p className="serif italic" style={{ fontSize: '14px', color: 'var(--color-her)', margin: 0 }}>{getDDayLabel(a.dDay)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="desktop-card">
            <p className="label" style={{ letterSpacing: '2px', margin: '0 0 14px' }}>▸ OUR STATS</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <p className="serif" style={{ fontSize: '24px', margin: 0 }}>{recentEntries.length}</p>
                <p className="meta" style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>총 일기</p>
              </div>
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <p className="serif" style={{ fontSize: '24px', margin: 0 }}>
                  {recentEntries.reduce((sum, e) => sum + (e.photos?.length || 0), 0)}
                </p>
                <p className="meta" style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>사진</p>
              </div>
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <p className="serif" style={{ fontSize: '24px', margin: 0, color: 'var(--color-her)' }}>
                  {recentEntries.filter(e => e.author === 'her').length}
                </p>
                <p className="meta" style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>{settings.her.name.replace('장', '')}의 일기</p>
              </div>
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <p className="serif" style={{ fontSize: '24px', margin: 0, color: 'var(--color-him)' }}>
                  {recentEntries.filter(e => e.author === 'him').length}
                </p>
                <p className="meta" style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>{settings.him.name.replace('염', '')}의 일기</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ============= 모바일 (기존 그대로) ============= 
function DashboardMobile({ settings, days, upcoming, recentEntries, navigate, fileInputRef, handleCoverPhotoChange }) {
  const today = new Date()

  return (
    <div className="phone">
      <div className="paper">
        <div className="tape-top"></div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingTop: '8px' }}>
          <p className="label">{formatDate(today, 'full')}</p>
          <p className="meta" style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => navigate('settings')}>⚙ 설정</p>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <p className="serif italic" style={{ fontSize: '24px', margin: '0 0 4px' }}>
            {settings.her.name.replace('장', '')} & {settings.him.name.replace('염', '')}
          </p>
          <p className="label">— OUR DIARY —</p>
        </div>

        <div className="polaroid" style={{ transform: 'rotate(-2.5deg)', marginBottom: '20px', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
          <div className="polaroid-tape"></div>
          {settings.coverPhoto ? (
            <div style={{ height: '140px', backgroundImage: `url(${settings.coverPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
          ) : (
            <div className="polaroid-inner">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              <p className="meta" style={{ color: 'var(--text-muted)', margin: '8px 0 0' }}>+ TAP TO ADD</p>
            </div>
          )}
          <p className="meta" style={{ color: 'var(--text-primary)', margin: '8px 0 0', textAlign: 'center' }}>
            {settings.coverPhoto ? '대표 사진 변경하기' : '대표 사진을 추가해보세요'}
          </p>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="file-input-hidden" onChange={handleCoverPhotoChange} />

        <div style={{ textAlign: 'center', padding: '14px 0', borderTop: '0.5px dashed var(--line-dashed)', borderBottom: '0.5px dashed var(--line-dashed)', marginBottom: '1.25rem' }}>
          <p className="label" style={{ letterSpacing: '3px', marginBottom: '4px' }}>
            TOGETHER SINCE {settings.startDate.replaceAll('-', '.')}
          </p>
          <p className="serif" style={{ fontSize: '32px', margin: 0, lineHeight: 1 }}>D+{days}</p>
          <p className="serif italic" style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
            우리 만난 지 {days}일째
          </p>
        </div>

        {upcoming[0] && upcoming[0].dDay <= (settings.notifications.daysBefore || 5) && (
          <div className="card-warm" style={{ marginBottom: '1.25rem', transform: 'rotate(-0.4deg)' }}>
            <p className="meta" style={{ color: 'var(--color-accent)', margin: '0 0 4px' }}>✦ COMING UP</p>
            <p className="serif" style={{ fontSize: '14px', margin: 0 }}>{upcoming[0].title}</p>
            <p className="serif italic" style={{ fontSize: '22px', color: 'var(--color-her)', margin: '4px 0 0' }}>
              {getDDayLabel(upcoming[0].dDay)}
            </p>
          </div>
        )}

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <p className="label">▸ RECENT ENTRIES</p>
            <p className="meta" style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => navigate('calendar')}>전체 →</p>
          </div>

          {recentEntries.map((entry, i) => (
            <div
              key={entry.id}
              className="card"
              style={{
                marginBottom: i < recentEntries.length - 1 ? '10px' : 0,
                transform: i % 2 === 0 ? 'rotate(0.4deg)' : 'rotate(-0.6deg)',
                cursor: 'pointer'
              }}
              onClick={() => navigate('index', { viewEntry: entry })}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <p className="meta" style={{ color: entry.author === 'her' ? 'var(--color-her)' : 'var(--color-him)', letterSpacing: '1px' }}>
                  {entry.author === 'her' ? settings.her.name.replace('장', '') : settings.him.name.replace('염', '')} ✦ {formatDate(entry.createdAt, 'short')}
                </p>
                <p className="meta" style={{ color: '#8B7355', fontSize: '9px' }}>#{String(entry.number).padStart(3, '0')}</p>
              </div>
              {entry.title && (
                <p className="serif italic" style={{ fontSize: '13px', margin: '0 0 4px' }}>{entry.title}</p>
              )}
              <p className="serif" style={{ fontSize: '13px', lineHeight: 1.7, margin: 0 }}>
                {entry.content.length > 80 ? entry.content.slice(0, 80) + '...' : entry.content}
              </p>
            </div>
          ))}

          {recentEntries.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
              <p className="serif italic" style={{ color: 'var(--text-faint)', margin: 0 }}>
                아직 일기가 없어요. 첫 번째 이야기를 적어볼까요?
              </p>
            </div>
          )}
        </div>

        <div className="nav-bottom">
          <div className="nav-item" onClick={() => navigate('write')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" style={{ margin: '0 auto' }}>
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" />
            </svg>
            <p>WRITE</p>
          </div>
          <div className="nav-item" onClick={() => navigate('index')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" style={{ margin: '0 auto' }}>
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <p>INDEX</p>
          </div>
          <div className="nav-item" onClick={() => navigate('calendar')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" style={{ margin: '0 auto' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <p>CALENDAR</p>
          </div>
          <div className="nav-item" onClick={() => navigate('gallery')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" style={{ margin: '0 auto' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <p>GALLERY</p>
          </div>
          <div className="nav-item" onClick={() => navigate('wishlist')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" style={{ margin: '0 auto' }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <p>WISH</p>
          </div>
          <div className="nav-item" onClick={() => navigate('settings')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" style={{ margin: '0 auto' }}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <p>SETTING</p>
          </div>
        </div>
      </div>
    </div>
  )
}
