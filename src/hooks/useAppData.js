import { useState, useEffect } from 'react'

/**
 * localStorage와 동기화되는 state hook
 * 1단계에서는 브라우저에만 저장.
 * 2단계에서 Cloudflare API 호출로 교체할 예정.
 */
export function useLocalStorage(key, initialValue) {
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
      localStorage.setItem(key, JSON.stringify(value))
    } catch (err) {
      console.error('localStorage 저장 실패:', err)
    }
  }, [key, value])

  return [value, setValue]
}

/**
 * 앱 전체 데이터 hook
 */
export function useAppData() {
  // 사용자 설정
  const [settings, setSettings] = useLocalStorage('diary_settings', {
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
  })

  // 일기 목록
  const [entries, setEntries] = useLocalStorage('diary_entries', [
    {
      id: 1,
      number: 87,
      author: 'her',
      title: '한강에서, 너와',
      content: '오늘 너랑 한강에서 본 노을이 너무 예뻤어. 분홍빛에서 보랏빛으로 천천히 변하는 하늘을 보면서, 옆에 있는 너의 옆모습이 더 예뻐서 자꾸 눈길이 갔어.',
      photos: [],
      mood: 'love',
      weather: 'sunny',
      location: '한강 뚝섬유원지',
      tags: ['데이트', '한강', '노을'],
      createdAt: '2026-04-24',
    },
    {
      id: 2,
      number: 86,
      author: 'him',
      title: '파스타 맛집',
      content: '오늘 너랑 먹은 파스타 진짜 맛있었음 ㅎㅎ',
      photos: [],
      mood: 'happy',
      weather: 'cloudy',
      location: '연남동',
      tags: ['데이트', '맛집'],
      createdAt: '2026-04-22',
    },
  ])

  // 사진 목록 (1단계는 base64로 localStorage)
  const [photos, setPhotos] = useLocalStorage('diary_photos', [])

  // 일정 (캘린더 직접 추가)
  // 카테고리: date(데이트), trip(여행), anniversary(기념일), meeting(약속), other(기타)
  const [events, setEvents] = useLocalStorage('diary_events', [
    { id: 1, date: '2026-05-02', endDate: '2026-05-02', title: '전시회 데이트', time: '14:00', location: '국립현대미술관', category: 'date' },
  ])

  // 직접 추가한 기념일
  const [customAnniversaries, setCustomAnniversaries] = useLocalStorage('diary_anniversaries', [])

  // 위시리스트
  const [wishlist, setWishlist] = useLocalStorage('diary_wishlist', [
    { id: 1, title: '같이 프로필 사진 찍기', author: 'her', completed: false, createdAt: '2026-04-20' },
    { id: 2, title: '동해 바다 보러가기', author: 'him', completed: false, createdAt: '2026-04-18' },
    { id: 3, title: '공유 주방에서 요리해주기', author: 'her', completed: true, createdAt: '2026-03-10', completedAt: '2026-04-15' },
    { id: 4, title: '길거리 분식 먹기', author: 'him', completed: false, createdAt: '2026-04-12' },
  ])

  // 로그인 상태
  const [auth, setAuth] = useLocalStorage('diary_auth', { isLoggedIn: false, user: null })

  // 사용자 계정 (변경된 ID/비번 저장)
  // 기본값: null = 아직 변경 안 함 → 로그인 후 강제 변경
  const [accounts, setAccounts] = useLocalStorage('diary_accounts', null)

  return {
    settings, setSettings,
    entries, setEntries,
    photos, setPhotos,
    events, setEvents,
    customAnniversaries, setCustomAnniversaries,
    wishlist, setWishlist,
    auth, setAuth,
    accounts, setAccounts,
  }
}
