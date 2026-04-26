import { useState, useEffect } from 'react'
import { useAppData } from './hooks/useAppData'
import { api } from './utils/api'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import WritePage from './pages/WritePage'
import CalendarPage from './pages/CalendarPage'
import GalleryPage from './pages/GalleryPage'
import WishlistPage from './pages/WishlistPage'
import IndexPage from './pages/IndexPage'
import SettingsPage from './pages/SettingsPage'
import Sidebar from './components/Sidebar'
import AccountSetupModal from './components/AccountSetupModal'

// 인증은 모두 Cloudflare Workers API에서 처리
// (admin / eunjin / sangmyeong 계정 검증은 서버에서 함)

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 1024
  )
  useEffect(() => {
    function check() { setIsDesktop(window.innerWidth >= 1024) }
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isDesktop
}

function isWidgetMode() {
  if (typeof window === 'undefined') return false
  // 1. ?widget=calendar (쿼리 스트링)
  const params = new URLSearchParams(window.location.search)
  if (params.get('widget') === 'calendar') return true
  // 2. #widget=calendar 또는 #/widget/calendar (해시)
  const hash = window.location.hash || ''
  if (hash.includes('widget=calendar') || hash.includes('widget/calendar')) return true
  return false
}

export default function App() {
  const data = useAppData()
  const widgetMode = isWidgetMode()
  const [page, setPage] = useState(widgetMode ? 'calendar' : 'login')
  const [editingEntry, setEditingEntry] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [viewEntry, setViewEntry] = useState(null)
  const isDesktop = useIsDesktop()

  useEffect(() => {
    document.body.classList.add('app-mode')
    return () => document.body.classList.remove('app-mode')
  }, [])

  // 위젯 모드일 때 데이터 자동 로드 (로그인 상태 무관)
  useEffect(() => {
    if (widgetMode) {
      data.reload()
    }
  }, [widgetMode])

  useEffect(() => {
    if (data.auth.isLoggedIn && page === 'login') {
      setPage('dashboard')
    }
  }, [data.auth.isLoggedIn])

  async function handleLogin(id, password) {
    try {
      const result = await api.login(id, password)
      if (result.success) {
        data.setAuth({
          isLoggedIn: true,
          user: result.user,
          isFirstLogin: result.isFirstLogin || false,
          isAdmin: result.isAdmin || false,
        })
        setPage('dashboard')
        return { success: true }
      }
      return { success: false, message: result.error || '로그인 실패' }
    } catch (err) {
      return {
        success: false,
        message: err.message || '서버 연결 실패. 인터넷을 확인해주세요.',
      }
    }
  }

  function handleLogout() {
    api.logout() // 토큰 삭제
    data.setAuth({ isLoggedIn: false, user: null })
    setPage('login')
  }

  function navigate(targetPage, options = {}) {
    if (options.entry) setEditingEntry(options.entry)
    else if (targetPage === 'write') setEditingEntry(null)
    if (options.date) setSelectedDate(options.date)
    setViewEntry(options.viewEntry || null)
    setPage(targetPage)
    window.scrollTo(0, 0)
  }

  if (!data.auth.isLoggedIn && !widgetMode) {
    return <LoginPage onLogin={handleLogin} />
  }

  // 데이터 로딩 중
  if (data.loading && !widgetMode) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--paper-bg, #f5ede0)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        zIndex: 9999,
      }}>
        <p className="serif italic" style={{ fontSize: '32px', margin: 0 }}>Our Diary</p>
        <p className="meta" style={{ color: 'var(--text-muted)', margin: 0 }}>
          데이터를 불러오는 중...
        </p>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid rgba(0,0,0,0.1)',
          borderTopColor: 'var(--color-her)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // 에러 화면
  if (data.error && !widgetMode && !data.loading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--paper-bg, #f5ede0)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '20px',
        textAlign: 'center',
      }}>
        <p className="serif" style={{ fontSize: '20px', color: 'var(--color-her)', margin: 0 }}>
          ⚠ 서버 연결 실패
        </p>
        <p className="meta" style={{ color: 'var(--text-muted)', margin: 0, maxWidth: '400px' }}>
          {data.error}
        </p>
        <button
          onClick={() => data.reload()}
          style={{
            padding: '10px 20px',
            background: 'var(--color-her)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            letterSpacing: '2px',
          }}
        >다시 시도</button>
      </div>
    )
  }

  if (widgetMode) {
    // 캘린더 위젯 전용 모드 - 사이드바/네비게이션 없이 캘린더만
    return (
      <div className="widget-mode" style={{ minHeight: '100vh', background: 'var(--paper-bg, #f5ede0)' }}>
        <CalendarPage data={data} navigate={() => {}} initialDate={selectedDate} isDesktop={false} />
      </div>
    )
  }

  // 첫 로그인 감지 - 본인(현재 로그인한 role)의 계정이 DB에 아직 없으면 모달 띄움
  // 어드민은 모달 안 뜸
  const myRole = data.auth.user?.role
  const myAccountExists = data.accounts?.some(a => a.role === myRole)
  const needsAccountSetup = data.auth.isLoggedIn &&
    data.auth.isFirstLogin &&
    !data.auth.isAdmin &&
    !myAccountExists

  const pageContent = (
    <div className="page-enter" key={page}>
      {page === 'dashboard' && (
        <DashboardPage data={data} navigate={navigate} isDesktop={isDesktop} />
      )}
      {page === 'write' && (
        <WritePage data={data} navigate={navigate} editingEntry={editingEntry} isDesktop={isDesktop} />
      )}
      {page === 'calendar' && (
        <CalendarPage data={data} navigate={navigate} initialDate={selectedDate} isDesktop={isDesktop} />
      )}
      {page === 'gallery' && (
        <GalleryPage data={data} navigate={navigate} isDesktop={isDesktop} />
      )}
      {page === 'wishlist' && (
        <WishlistPage data={data} navigate={navigate} isDesktop={isDesktop} />
      )}
      {page === 'index' && (
        <IndexPage data={data} navigate={navigate} isDesktop={isDesktop} initialViewEntry={viewEntry} />
      )}
      {page === 'settings' && (
        <SettingsPage data={data} navigate={navigate} onLogout={handleLogout} isDesktop={isDesktop} />
      )}
    </div>
  )

  if (isDesktop) {
    return (
      <>
        <div className="desktop-layout">
          <Sidebar data={data} currentPage={page} navigate={navigate} onLogout={handleLogout} />
          <main className="desktop-main">{pageContent}</main>
        </div>
        {needsAccountSetup && <AccountSetupModal data={data} forceMode={true} />}
      </>
    )
  }

  return (
    <>
      {pageContent}
      {needsAccountSetup && <AccountSetupModal data={data} forceMode={true} />}
    </>
  )
}
