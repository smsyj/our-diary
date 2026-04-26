import { useState, useEffect } from 'react'
import { useAppData } from './hooks/useAppData'
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

const DEFAULT_ACCOUNTS = [
  { id: 'eunjin', password: '0601', name: '장은진', role: 'her' },
  { id: 'sangmyeong', password: '0601', name: '염상명', role: 'him' },
]

// 어드민 계정 (테스트 전용)
// - 항상 로그인 가능 (커스텀 계정 만들어도 살아있음)
// - 첫 로그인 모달 안 뜸
// - 설정에서 데이터 초기화 가능
const ADMIN_ACCOUNT = { id: 'admin', password: '1234', name: 'Admin', role: 'admin' }

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

  useEffect(() => {
    if (data.auth.isLoggedIn && page === 'login') {
      setPage('dashboard')
    }
  }, [data.auth.isLoggedIn])

  function handleLogin(id, password) {
    // 0. 어드민 계정 우선 검증 (항상 로그인 가능, 모달 안 뜸)
    if (id === ADMIN_ACCOUNT.id && password === ADMIN_ACCOUNT.password) {
      data.setAuth({ isLoggedIn: true, user: ADMIN_ACCOUNT, isFirstLogin: false, isAdmin: true })
      setPage('dashboard')
      return { success: true }
    }

    // 1. 사용자가 변경한 계정이 있으면 그걸로 검증
    const customAccounts = data.accounts
    if (customAccounts && customAccounts.length > 0) {
      const account = customAccounts.find(a => a.id === id && a.password === password)
      if (account) {
        data.setAuth({ isLoggedIn: true, user: account, isFirstLogin: false, isAdmin: false })
        setPage('dashboard')
        return { success: true }
      }
      return { success: false, message: '아이디 또는 비밀번호가 틀렸어요.' }
    }

    // 2. 사용자 계정 없으면 기본 계정으로 검증 (= 첫 로그인)
    const account = DEFAULT_ACCOUNTS.find(a => a.id === id && a.password === password)
    if (account) {
      data.setAuth({ isLoggedIn: true, user: account, isFirstLogin: true, isAdmin: false })
      setPage('dashboard')
      return { success: true }
    }
    return { success: false, message: '아이디 또는 비밀번호가 틀렸어요.' }
  }

  function handleLogout() {
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

  if (widgetMode) {
    // 캘린더 위젯 전용 모드 - 사이드바/네비게이션 없이 캘린더만
    return (
      <div className="widget-mode" style={{ minHeight: '100vh', background: 'var(--paper-bg, #f5ede0)' }}>
        <CalendarPage data={data} navigate={() => {}} initialDate={selectedDate} isDesktop={false} />
      </div>
    )
  }

  // 첫 로그인 감지 - 사용자 계정이 없는데 로그인된 상태
  // 어드민은 모달 안 뜸
  const needsAccountSetup = data.auth.isLoggedIn &&
    data.auth.isFirstLogin &&
    !data.auth.isAdmin &&
    (!data.accounts || data.accounts.length === 0)

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
