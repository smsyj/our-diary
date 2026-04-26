import { useState } from 'react'

/**
 * 계정 설정 모달
 * - 첫 로그인 시: forceMode=true → 닫기 불가, 두 사람 계정 모두 설정
 * - 일반 변경 시: forceMode=false → 닫기 가능, 본인 계정만 변경
 */
export default function AccountSetupModal({ data, forceMode = false, onClose }) {
  const { auth, setAuth, accounts, setAccounts, settings } = data
  const currentRole = auth.user?.role || 'her'
  const isHer = currentRole === 'her'

  // 첫 설정 모드: 두 사람 다 입력
  // 일반 변경 모드: 본인만 입력
  const [herData, setHerData] = useState({
    id: forceMode ? '' : (accounts?.find(a => a.role === 'her')?.id || ''),
    password: '',
    confirmPw: ''
  })
  const [himData, setHimData] = useState({
    id: forceMode ? '' : (accounts?.find(a => a.role === 'him')?.id || ''),
    password: '',
    confirmPw: ''
  })
  const [error, setError] = useState('')

  function validate() {
    if (forceMode) {
      // 두 사람 다 검증
      if (!herData.id.trim() || !himData.id.trim()) {
        return '두 사람의 ID를 모두 입력해주세요.'
      }
      if (herData.id.trim() === himData.id.trim()) {
        return '두 사람의 ID는 달라야 해요.'
      }
      if (herData.id.length < 3 || himData.id.length < 3) {
        return 'ID는 3자 이상이어야 해요.'
      }
      if (!herData.password || !himData.password) {
        return '두 사람의 비밀번호를 모두 입력해주세요.'
      }
      if (herData.password.length < 4 || himData.password.length < 4) {
        return '비밀번호는 4자 이상이어야 해요.'
      }
      if (herData.password !== herData.confirmPw) {
        return `${settings.her.name.replace('장', '')}의 비밀번호가 일치하지 않아요.`
      }
      if (himData.password !== himData.confirmPw) {
        return `${settings.him.name.replace('염', '')}의 비밀번호가 일치하지 않아요.`
      }
    } else {
      // 본인 계정만 검증
      const myData = isHer ? herData : himData
      const otherData = isHer
        ? accounts?.find(a => a.role === 'him')
        : accounts?.find(a => a.role === 'her')

      if (!myData.id.trim()) return 'ID를 입력해주세요.'
      if (myData.id.trim() === otherData?.id) return '상대방과 같은 ID는 사용할 수 없어요.'
      if (myData.id.length < 3) return 'ID는 3자 이상이어야 해요.'
      if (myData.password) {
        if (myData.password.length < 4) return '비밀번호는 4자 이상이어야 해요.'
        if (myData.password !== myData.confirmPw) return '비밀번호가 일치하지 않아요.'
      }
    }
    return null
  }

  function handleSave() {
    const err = validate()
    if (err) {
      setError(err)
      return
    }

    if (forceMode) {
      // 첫 설정 - 두 사람 다 저장
      const newAccounts = [
        {
          id: herData.id.trim(),
          password: herData.password,
          name: settings.her.name,
          role: 'her',
        },
        {
          id: himData.id.trim(),
          password: himData.password,
          name: settings.him.name,
          role: 'him',
        }
      ]
      setAccounts(newAccounts)

      // 현재 로그인한 사용자 정보도 새 계정으로 업데이트
      const myNewAccount = newAccounts.find(a => a.role === currentRole)
      setAuth({ isLoggedIn: true, user: myNewAccount, isFirstLogin: false })
      alert('계정 설정 완료! 다음부터는 새로 설정한 계정으로 로그인하세요.')
    } else {
      // 일반 변경 - 본인 계정만 변경
      const myData = isHer ? herData : himData
      const updatedAccounts = accounts.map(a => {
        if (a.role === currentRole) {
          return {
            ...a,
            id: myData.id.trim(),
            password: myData.password || a.password, // 비번 입력 안 했으면 기존 유지
          }
        }
        return a
      })
      setAccounts(updatedAccounts)

      const myNewAccount = updatedAccounts.find(a => a.role === currentRole)
      setAuth({ ...auth, user: myNewAccount })
      alert('계정 정보가 수정되었어요!')
    }

    if (onClose) onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      overflow: 'auto'
    }}>
      <div style={{
        background: 'var(--paper-bg)',
        backgroundImage:
          'radial-gradient(ellipse 600px 200px at 20% 0%, rgba(255,240,210,0.5), transparent 60%), repeating-linear-gradient(0deg, transparent 0 2px, rgba(140,100,60,0.012) 2px 3px), var(--paper-bg)',
        maxWidth: '440px',
        width: '100%',
        padding: '28px 24px',
        borderRadius: '8px',
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* 마스킹테이프 */}
        <div style={{
          position: 'absolute', top: '-8px', left: '50%',
          transform: 'translateX(-50%) rotate(-2deg)',
          width: '80px', height: '16px',
          background: 'var(--tape)',
          borderRadius: '1px'
        }}></div>

        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: '20px', paddingTop: '8px' }}>
          {forceMode && (
            <p className="meta" style={{ color: 'var(--color-her)', margin: '0 0 8px', letterSpacing: '3px' }}>
              ⚠ FIRST LOGIN
            </p>
          )}
          <p className="serif italic" style={{ fontSize: '24px', margin: '0 0 6px' }}>
            {forceMode ? '계정 초기 설정' : '계정 변경'}
          </p>
          <p className="meta" style={{ color: 'var(--text-muted)', margin: 0 }}>
            {forceMode
              ? '두 사람의 새로운 ID와 비밀번호를 설정해주세요'
              : '본인의 ID와 비밀번호를 변경할 수 있어요'}
          </p>
        </div>

        {forceMode && (
          <div className="card-warm" style={{ padding: '12px', marginBottom: '20px', transform: 'rotate(-0.3deg)' }}>
            <p className="serif italic" style={{ fontSize: '12px', color: 'var(--color-accent)', margin: 0, lineHeight: 1.6 }}>
              💡 둘만의 비밀스러운 다이어리를 위해<br />
              기본 계정 대신 본인들만의 ID와 비번을 설정해주세요.
            </p>
          </div>
        )}

        {/* 은진 (her) */}
        {(forceMode || isHer) && (
          <div style={{
            border: '0.5px solid var(--color-her)',
            background: 'var(--color-her-bg)',
            padding: '16px',
            borderRadius: '4px',
            marginBottom: '14px'
          }}>
            <p className="serif italic" style={{ fontSize: '15px', color: 'var(--color-her)', margin: '0 0 10px' }}>
              {settings.her.name.replace('장', '')} 계정
            </p>
            <input
              type="text"
              placeholder="새 ID (3자 이상)"
              className="input-line"
              style={{ marginBottom: '8px', fontSize: '13px' }}
              value={herData.id}
              onChange={e => { setHerData({ ...herData, id: e.target.value }); setError('') }}
            />
            <input
              type="password"
              placeholder={forceMode ? '새 비밀번호 (4자 이상)' : '새 비밀번호 (변경 시에만 입력)'}
              className="input-line"
              style={{ marginBottom: '8px', fontSize: '13px' }}
              value={herData.password}
              onChange={e => { setHerData({ ...herData, password: e.target.value }); setError('') }}
            />
            <input
              type="password"
              placeholder="비밀번호 확인"
              className="input-line"
              style={{ fontSize: '13px' }}
              value={herData.confirmPw}
              onChange={e => { setHerData({ ...herData, confirmPw: e.target.value }); setError('') }}
            />
          </div>
        )}

        {/* 상명 (him) */}
        {(forceMode || !isHer) && (
          <div style={{
            border: '0.5px solid var(--color-him)',
            background: 'var(--color-him-bg)',
            padding: '16px',
            borderRadius: '4px',
            marginBottom: '14px'
          }}>
            <p className="serif italic" style={{ fontSize: '15px', color: 'var(--color-him)', margin: '0 0 10px' }}>
              {settings.him.name.replace('염', '')} 계정
            </p>
            <input
              type="text"
              placeholder="새 ID (3자 이상)"
              className="input-line"
              style={{ marginBottom: '8px', fontSize: '13px' }}
              value={himData.id}
              onChange={e => { setHimData({ ...himData, id: e.target.value }); setError('') }}
            />
            <input
              type="password"
              placeholder={forceMode ? '새 비밀번호 (4자 이상)' : '새 비밀번호 (변경 시에만 입력)'}
              className="input-line"
              style={{ marginBottom: '8px', fontSize: '13px' }}
              value={himData.password}
              onChange={e => { setHimData({ ...himData, password: e.target.value }); setError('') }}
            />
            <input
              type="password"
              placeholder="비밀번호 확인"
              className="input-line"
              style={{ fontSize: '13px' }}
              value={himData.confirmPw}
              onChange={e => { setHimData({ ...himData, confirmPw: e.target.value }); setError('') }}
            />
          </div>
        )}

        {error && (
          <p style={{
            color: 'var(--color-her)',
            fontSize: '11px',
            textAlign: 'center',
            marginBottom: '12px',
            fontFamily: 'var(--font-mono)'
          }}>
            ⚠ {error}
          </p>
        )}

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {!forceMode && (
            <button
              onClick={onClose}
              style={{
                flex: 1,
                background: 'transparent',
                border: '0.5px solid var(--text-faint)',
                color: 'var(--text-muted)',
                padding: '12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '2px',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >취소</button>
          )}
          <button
            onClick={handleSave}
            style={{
              flex: forceMode ? 1 : 2,
              background: 'var(--color-her)',
              border: 'none',
              color: 'white',
              padding: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '2px',
              cursor: 'pointer',
              borderRadius: '4px',
              fontWeight: 700
            }}
          >{forceMode ? '✓ 설정 완료' : '저장'}</button>
        </div>
      </div>
    </div>
  )
}
