/**
 * Cloudflare Workers API 호출 헬퍼
 *
 * 사용법:
 *   import { api } from './utils/api'
 *   const entries = await api.getEntries()
 */

// API 베이스 URL (Cloudflare Workers 주소)
export const API_BASE = 'https://our-diary-api.smsyj.workers.dev'

// 공통 fetch 래퍼
async function request(path, options = {}) {
  const url = API_BASE + path
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  try {
    const res = await fetch(url, { ...options, headers })

    // 응답 파싱
    const contentType = res.headers.get('Content-Type') || ''
    let data
    if (contentType.includes('application/json')) {
      data = await res.json()
    } else {
      data = { error: await res.text() }
    }

    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`)
    }
    return data
  } catch (err) {
    console.error(`API ${options.method || 'GET'} ${path} 실패:`, err.message)
    throw err
  }
}

// 헬퍼: GET, POST, PUT, DELETE
function get(path) {
  return request(path)
}

function post(path, body) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

function put(path, body) {
  return request(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

function del(path) {
  return request(path, { method: 'DELETE' })
}

// ============================================
// API 함수들
// ============================================

export const api = {
  // 헬스체크
  async health() {
    return await get('/')
  },

  // ============ 인증 ============
  async login(id, password) {
    return await post('/api/login', { id, password })
  },

  async getAccounts() {
    const data = await get('/api/accounts')
    return data.accounts || []
  },

  async saveAccounts(accounts) {
    return await post('/api/accounts', { accounts })
  },

  async deleteAccounts() {
    return await del('/api/accounts')
  },

  // ============ 일기 ============
  async getEntries() {
    const data = await get('/api/entries')
    return data.entries || []
  },

  async createEntry(entry) {
    return await post('/api/entries', entry)
  },

  async updateEntry(id, entry) {
    return await put(`/api/entries/${id}`, entry)
  },

  async deleteEntry(id) {
    return await del(`/api/entries/${id}`)
  },

  // ============ 일정 ============
  async getEvents() {
    const data = await get('/api/events')
    return data.events || []
  },

  async createEvent(event) {
    return await post('/api/events', event)
  },

  async updateEvent(id, event) {
    return await put(`/api/events/${id}`, event)
  },

  async deleteEvent(id) {
    return await del(`/api/events/${id}`)
  },

  // ============ 위시리스트 ============
  async getWishlist() {
    const data = await get('/api/wishlist')
    return data.wishlist || []
  },

  async createWish(wish) {
    return await post('/api/wishlist', wish)
  },

  async updateWish(id, wish) {
    return await put(`/api/wishlist/${id}`, wish)
  },

  async deleteWish(id) {
    return await del(`/api/wishlist/${id}`)
  },

  // ============ 기념일 ============
  async getAnniversaries() {
    const data = await get('/api/anniversaries')
    return data.anniversaries || []
  },

  async createAnniversary(anniv) {
    return await post('/api/anniversaries', anniv)
  },

  async deleteAnniversary(id) {
    return await del(`/api/anniversaries/${id}`)
  },

  // ============ 설정 ============
  async getSettings() {
    const data = await get('/api/settings')
    return data.settings || {}
  },

  async saveSettings(settings) {
    return await post('/api/settings', { settings })
  },

  // ============ 사진 ============
  // 사진 업로드 (Base64 방식)
  // dataUrl: "data:image/jpeg;base64,/9j/4AAQ..."
  async uploadPhoto(dataUrl) {
    const result = await post('/api/photos', { data: dataUrl })
    // 사진 URL을 절대 경로로 변환
    return {
      ...result,
      url: API_BASE + result.url,
    }
  },

  async deletePhoto(key) {
    return await del(`/api/photos/${encodeURIComponent(key)}`)
  },

  // 사진 URL 만들기 (key → 전체 URL)
  photoUrl(key) {
    if (!key) return null
    if (key.startsWith('http') || key.startsWith('data:')) return key
    return `${API_BASE}/api/photos/${encodeURIComponent(key)}`
  },

  // ============ 사용량 ============
  async getStorageUsage() {
    return await get('/api/storage-usage')
  },

  async refreshStorageUsage() {
    return await post('/api/storage-usage/refresh', {})
  },
}

export default api
