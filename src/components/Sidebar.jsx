import { daysSince, getUpcomingAnniversaries, getDDayLabel, formatDate } from '../utils/dateUtils'

export default function Sidebar({ data, currentPage, navigate, onLogout }) {
  const { settings } = data
  const today = new Date()
  const days = daysSince(settings.startDate, today)
  const upcoming = getUpcomingAnniversaries(settings, data.customAnniversaries, data.events, today).slice(0, 4)

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: 'home' },
    { key: 'write', label: 'Write Diary', icon: 'pen' },
    { key: 'index', label: 'Index', icon: 'list' },
    { key: 'calendar', label: 'Calendar', icon: 'cal' },
    { key: 'gallery', label: 'Gallery', icon: 'img' },
    { key: 'wishlist', label: 'Wishlist', icon: 'heart' },
    { key: 'settings', label: 'Settings', icon: 'gear' },
  ]

  return (
    <aside className="sidebar">
      {/* 로고 */}
      <div className="sidebar-header">
        <div className="sidebar-tape"></div>
        <p className="sidebar-est">— EST. 2025 —</p>
        <p className="sidebar-title">Our<br />Diary</p>
        <div className="sidebar-couple">
          <p style={{ color: 'var(--color-her)' }}>{settings.her.name.replace('장', '')}</p>
          <svg width="12" height="12" viewBox="0 0 24 24">
            <path d="M12 21s-7-4.35-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.65-7 10-7 10z" fill="#D4537E" opacity="0.7" />
          </svg>
          <p style={{ color: 'var(--color-him)' }}>{settings.him.name.replace('염', '')}</p>
        </div>
      </div>

      {/* D+ 카운터 */}
      <div className="sidebar-counter">
        <p className="sidebar-counter-label">TOGETHER FOR</p>
        <p className="sidebar-counter-num">D+{days}</p>
        <p className="sidebar-counter-since">since {settings.startDate.replaceAll('-', '.')}</p>
      </div>

      {/* 메뉴 */}
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <div
            key={item.key}
            className={`sidebar-item ${currentPage === item.key ? 'active' : ''}`}
            onClick={() => navigate(item.key)}
          >
            <SidebarIcon name={item.icon} />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* 다가오는 일정 */}
      {upcoming.length > 0 && (
        <div className="sidebar-upcoming">
          <p className="sidebar-section-label">▸ UPCOMING</p>
          {upcoming.map((a, i) => (
            <div key={i} className={`sidebar-upcoming-item ${i === 0 && a.dDay <= 5 ? 'highlight' : ''}`}>
              <div className="sidebar-upcoming-info">
                <p className="sidebar-upcoming-title">{a.title}</p>
                <p className="sidebar-upcoming-date">{formatDate(a.date, 'short')}</p>
              </div>
              <p className="sidebar-upcoming-dday">{getDDayLabel(a.dDay)}</p>
            </div>
          ))}
        </div>
      )}

      {/* 로그아웃 */}
      <div className="sidebar-footer">
        <p className="sidebar-logout" onClick={onLogout}>Logout →</p>
        <p className="sidebar-version">— Our Diary v1.0 —</p>
      </div>
    </aside>
  )
}

function SidebarIcon({ name }) {
  const icons = {
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></>,
    pen: <><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
    list: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>,
    cal: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    img: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
    heart: <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  )
}
