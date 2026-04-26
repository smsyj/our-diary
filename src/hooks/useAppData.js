import { useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'

const DEFAULT_SETTINGS = {
  startDate: '2025-06-01',
  her: { name: '장은진', birthday: '2000-03-15' },
  him: { name: '염상명', birthday: '1999-08-20' },
  coverPhoto: null,
  notifications: {
    hundredDays: true,
    anniversary: true,
    birthday: true,
    daysBefore: 5,
  },
}

// localStorage hook (auth 상태만 저장)
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      if (value === null || value === undefined) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (err) {
      console.error('localStorage 저장 실패:', err)
    }
  }, [key, value])

  return [value, setValue]
}

/**
 * 앱 전체 데이터 hook (API 연동)
 *
 * 데이터 흐름:
 * - 로그인 후 모든 데이터 한번에 로드
 * - add/update/delete 메서드로 명시적 CRUD
 * - state는 메모리에만 (서버에서 가져옴)
 * - auth만 localStorage 사용
 *
 * 호환성:
 * - setEntries, setEvents 등 기존 setter도 노출 (Optimistic Update)
 *   - 단순히 state만 바꾸고, 호출 측이 add/update/delete 호출하는 패턴 권장
 */
export function useAppData() {
  // 로그인 상태
  const [auth, setAuthState] = useLocalStorage('diary_auth', { isLoggedIn: false, user: null })

  // 데이터
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS)
  const [entries, setEntriesState] = useState([])
  const [events, setEventsState] = useState([])
  const [wishlist, setWishlistState] = useState([])
  const [customAnniversaries, setCustomAnniversariesState] = useState([])
  const [accounts, setAccountsState] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 초기 데이터 로드
  const loadAllData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [
        settingsData,
        entriesData,
        eventsData,
        wishlistData,
        annivData,
        accountsData,
      ] = await Promise.all([
        api.getSettings().catch(() => ({})),
        api.getEntries().catch(() => []),
        api.getEvents().catch(() => []),
        api.getWishlist().catch(() => []),
        api.getAnniversaries().catch(() => []),
        api.getAccounts().catch(() => []),
      ])

      setSettingsState({ ...DEFAULT_SETTINGS, ...settingsData })
      setEntriesState(Array.isArray(entriesData) ? entriesData : [])
      setEventsState(Array.isArray(eventsData) ? eventsData : [])
      setWishlistState(Array.isArray(wishlistData) ? wishlistData : [])
      setCustomAnniversariesState(Array.isArray(annivData) ? annivData : [])
      setAccountsState(
        Array.isArray(accountsData) && accountsData.length > 0 ? accountsData : null
      )
    } catch (err) {
      setError(err.message || '데이터 로드 실패')
      console.error('데이터 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 로그인 시 자동 로드
  useEffect(() => {
    if (auth.isLoggedIn) {
      loadAllData()
    }
  }, [auth.isLoggedIn, loadAllData])

  // ============================================
  // Settings
  // ============================================

  const setSettings = useCallback(async (newSettings) => {
    const updated = typeof newSettings === 'function'
      ? newSettings(settings)
      : newSettings
    setSettingsState(updated)
    try {
      await api.saveSettings(updated)
    } catch (err) {
      console.error('설정 저장 실패:', err)
    }
  }, [settings])

  // ============================================
  // Entries (일기)
  // ============================================

  const addEntry = useCallback(async (entry) => {
    try {
      const result = await api.createEntry(entry)
      const newEntry = {
        ...entry,
        id: result.id,
        number: result.number,
      }
      setEntriesState(prev => [newEntry, ...prev])
      return newEntry
    } catch (err) {
      console.error('일기 추가 실패:', err)
      alert('일기 저장 실패: ' + err.message)
      throw err
    }
  }, [])

  const updateEntry = useCallback(async (id, entry) => {
    try {
      await api.updateEntry(id, entry)
      setEntriesState(prev => prev.map(e => e.id === id ? { ...entry, id } : e))
    } catch (err) {
      console.error('일기 수정 실패:', err)
      alert('일기 수정 실패: ' + err.message)
      throw err
    }
  }, [])

  const deleteEntry = useCallback(async (id) => {
    try {
      await api.deleteEntry(id)
      setEntriesState(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      console.error('일기 삭제 실패:', err)
      alert('일기 삭제 실패: ' + err.message)
      throw err
    }
  }, [])

  // 호환성: setEntries (Optimistic Update만, 서버 동기화 X)
  const setEntries = useCallback((newValue) => {
    const updated = typeof newValue === 'function' ? newValue(entries) : newValue
    setEntriesState(updated)
    console.warn('⚠️ setEntries 직접 호출됨. 서버 동기화 X. addEntry/updateEntry/deleteEntry 사용 권장')
  }, [entries])

  // ============================================
  // Events (일정)
  // ============================================

  const addEvent = useCallback(async (event) => {
    try {
      const result = await api.createEvent(event)
      const newEvent = { ...event, id: result.id }
      setEventsState(prev => [...prev, newEvent])
      return newEvent
    } catch (err) {
      console.error('일정 추가 실패:', err)
      alert('일정 저장 실패: ' + err.message)
      throw err
    }
  }, [])

  const updateEventApi = useCallback(async (id, event) => {
    try {
      await api.updateEvent(id, event)
      setEventsState(prev => prev.map(e => e.id === id ? { ...event, id } : e))
    } catch (err) {
      console.error('일정 수정 실패:', err)
      alert('일정 수정 실패: ' + err.message)
      throw err
    }
  }, [])

  const deleteEvent = useCallback(async (id) => {
    try {
      await api.deleteEvent(id)
      setEventsState(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      console.error('일정 삭제 실패:', err)
      alert('일정 삭제 실패: ' + err.message)
      throw err
    }
  }, [])

  // 호환성: setEvents (서버 미동기화)
  const setEvents = useCallback((newValue) => {
    const updated = typeof newValue === 'function' ? newValue(events) : newValue
    setEventsState(updated)
    console.warn('⚠️ setEvents 직접 호출됨. 서버 동기화 X')
  }, [events])

  // ============================================
  // Wishlist
  // ============================================

  const addWish = useCallback(async (wish) => {
    try {
      const result = await api.createWish(wish)
      const newWish = { ...wish, id: result.id }
      setWishlistState(prev => [newWish, ...prev])
      return newWish
    } catch (err) {
      console.error('위시 추가 실패:', err)
      alert('위시 저장 실패: ' + err.message)
      throw err
    }
  }, [])

  const updateWish = useCallback(async (id, wish) => {
    try {
      await api.updateWish(id, wish)
      setWishlistState(prev => prev.map(w => w.id === id ? { ...wish, id } : w))
    } catch (err) {
      console.error('위시 수정 실패:', err)
      alert('위시 수정 실패: ' + err.message)
      throw err
    }
  }, [])

  const deleteWish = useCallback(async (id) => {
    try {
      await api.deleteWish(id)
      setWishlistState(prev => prev.filter(w => w.id !== id))
    } catch (err) {
      console.error('위시 삭제 실패:', err)
      alert('위시 삭제 실패: ' + err.message)
      throw err
    }
  }, [])

  // 호환성: setWishlist
  const setWishlist = useCallback((newValue) => {
    const updated = typeof newValue === 'function' ? newValue(wishlist) : newValue
    setWishlistState(updated)
    console.warn('⚠️ setWishlist 직접 호출됨. 서버 동기화 X')
  }, [wishlist])

  // ============================================
  // Anniversaries
  // ============================================

  const addAnniversary = useCallback(async (anniv) => {
    try {
      const result = await api.createAnniversary(anniv)
      const newA = { ...anniv, id: result.id }
      setCustomAnniversariesState(prev => [...prev, newA])
      return newA
    } catch (err) {
      console.error('기념일 추가 실패:', err)
      alert('기념일 저장 실패: ' + err.message)
      throw err
    }
  }, [])

  const deleteAnniversary = useCallback(async (id) => {
    try {
      await api.deleteAnniversary(id)
      setCustomAnniversariesState(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error('기념일 삭제 실패:', err)
      alert('기념일 삭제 실패: ' + err.message)
      throw err
    }
  }, [])

  // 호환성: setCustomAnniversaries
  const setCustomAnniversaries = useCallback((newValue) => {
    const updated = typeof newValue === 'function'
      ? newValue(customAnniversaries)
      : newValue
    setCustomAnniversariesState(updated)
    console.warn('⚠️ setCustomAnniversaries 직접 호출됨. 서버 동기화 X')
  }, [customAnniversaries])

  // ============================================
  // Accounts
  // ============================================

  const setAccounts = useCallback(async (newAccounts) => {
    const updated = typeof newAccounts === 'function'
      ? newAccounts(accounts)
      : newAccounts
    setAccountsState(updated)

    try {
      if (updated && Array.isArray(updated) && updated.length > 0) {
        await api.saveAccounts(updated)
      }
    } catch (err) {
      console.error('계정 저장 실패:', err)
      alert('계정 저장 실패: ' + err.message)
    }
  }, [accounts])

  // ============================================
  // Auth
  // ============================================

  const setAuth = useCallback((newAuth) => {
    setAuthState(typeof newAuth === 'function' ? newAuth(auth) : newAuth)
  }, [auth, setAuthState])

  // 사진 호환성 (안 씀)
  const photos = []
  const setPhotos = () => {}

  return {
    // 데이터
    settings, setSettings,
    entries, setEntries,
    photos, setPhotos,
    events, setEvents,
    customAnniversaries, setCustomAnniversaries,
    wishlist, setWishlist,
    auth, setAuth,
    accounts, setAccounts,

    // CRUD 메서드 (서버 동기화) - 권장
    addEntry,
    updateEntry,
    deleteEntry,
    addEvent,
    updateEvent: updateEventApi,
    deleteEvent,
    addWish,
    updateWish,
    deleteWish,
    addAnniversary,
    deleteAnniversary,

    // 상태
    loading,
    error,
    reload: loadAllData,
  }
}
