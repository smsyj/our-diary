import { useState } from 'react'

// localStorage에서 대표 사진 가져오기
function getCoverPhoto() {
  try {
    const settings = JSON.parse(localStorage.getItem('diary_settings') || '{}')
    return settings.coverPhoto || null
  } catch {
    return null
  }
}

// 사용자가 계정을 설정했는지 확인
function hasCustomAccounts() {
  try {
    const accounts = JSON.parse(localStorage.getItem('diary_accounts') || 'null')
    return accounts && accounts.length > 0
  } catch {
    return false
  }
}

export default function LoginPage({ onLogin }) {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const coverPhoto = getCoverPhoto()
  const isInitialSetup = !hasCustomAccounts() // 처음 사용 (계정 안 만들었음)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!id || !password) {
      setError('아이디와 비밀번호를 입력해주세요.')
      return
    }
    const result = await onLogin(id, password)
    if (!result.success) {
      setError(result.message)
    }
  }

  return (
    <div className="phone">
      <div className="paper" style={{ padding: '2rem 1.5rem' }}>
        <div style={{ position: 'absolute', top: '-10px', left: '22%', width: '60px', height: '18px', background: 'var(--tape-pink)', transform: 'rotate(-6deg)', borderRadius: '1px' }}></div>
        <div style={{ position: 'absolute', top: '-8px', right: '18%', width: '50px', height: '16px', background: 'var(--tape-blue)', transform: 'rotate(8deg)', borderRadius: '1px' }}></div>

        <div style={{ textAlign: 'center', marginBottom: '1.75rem', paddingTop: '16px' }}>
          <p className="label" style={{ letterSpacing: '5px', marginBottom: '12px' }}>— EST. 2025 —</p>
          <p className="serif italic" style={{ fontSize: '38px', margin: 0, lineHeight: 1 }}>Our</p>
          <p className="serif italic" style={{ fontSize: '38px', margin: '-4px 0 0', lineHeight: 1 }}>Diary</p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', margin: '18px 0 8px' }}>
            <p className="serif italic" style={{ fontSize: '13px', color: 'var(--color-her)', margin: 0 }}>은진</p>
            <svg width="14" height="14" viewBox="0 0 24 24">
              <path d="M12 21s-7-4.35-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.65-7 10-7 10z" fill="#D4537E" opacity="0.7" />
            </svg>
            <p className="serif italic" style={{ fontSize: '13px', color: 'var(--color-him)', margin: 0 }}>상명</p>
          </div>
          <p className="label">SINCE 2025.06.01</p>
        </div>

        <div className="polaroid" style={{ transform: 'rotate(-1.5deg)', marginBottom: '1.5rem', maxWidth: '200px' }}>
          {coverPhoto ? (
            <div style={{
              height: '140px',
              backgroundImage: `url(${coverPhoto})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}></div>
          ) : (
            <div className="demo-tri" style={{ height: '100px' }}></div>
          )}
          <p className="meta" style={{ margin: '6px 0 0', textAlign: 'center', color: 'var(--text-primary)' }}>welcome home, love.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label className="meta" style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '6px' }}>▸ ID</label>
            <input
              type="text"
              placeholder="아이디"
              className="input-line"
              value={id}
              onChange={e => { setId(e.target.value); setError('') }}
              autoComplete="username"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label className="meta" style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '6px' }}>▸ PASSWORD</label>
            <input
              type="password"
              placeholder="••••••••"
              className="input-line"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p style={{ color: 'var(--color-her)', fontSize: '11px', textAlign: 'center', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary">Open the diary</button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '20px 0 0' }}>
          <div style={{ width: '30px', height: '0.5px', background: 'var(--text-faint)' }}></div>
          <p className="meta" style={{ fontSize: '8px', letterSpacing: '3px', color: 'var(--text-faint)', margin: 0 }}>FOR US ONLY</p>
          <div style={{ width: '30px', height: '0.5px', background: 'var(--text-faint)' }}></div>
        </div>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-faint)', textAlign: 'center', marginTop: '20px', opacity: 0.7 }}>
          {isInitialSetup
            ? '🔑 첫 사용 시 임시 계정: eunjin / 0601 또는 sangmyeong / 0601'
            : '— 두 분만의 비밀스러운 공간 ✦ —'}
        </p>
      </div>
    </div>
  )
}
