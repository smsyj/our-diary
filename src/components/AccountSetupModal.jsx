import { useState } from 'react'

/**
 * 계정 설정 모달
 * - 첫 로그인 시 (forceMode=true): 본인 계정만 입력, 닫기 불가
 * - 일반 변경 시 (forceMode=false): 본인 계정만 변경, 닫기 가능
 *
 * 항상 본인(현재 로그인한 사람) 계정만 변경합니다.
 * 두 사람 다 각자 본인 PC/폰에서 따로 변경해야 함.
 */
export default function AccountSetupModal({ data, forceMode = false, onClose }) {
  const { auth, setAuth, accounts, setAccounts, settings } = data
  const currentRole = auth.user?.role || 'her'
  const isHer = currentRole === 'her'

  // 본인 정보 (현재 DB의 ID로 초기화, 변경 모드일 때만)
  const myCurrentAccount = accounts?.find(a => a.role === currentRole)
  const [myData, setMyData] = useState({
    id: forceMode ? '' : (myCurrentAccount?.id || ''),
    password: '',
    confirmPw: ''
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // 표시 이름
  const myName = isHer
    ? (settings.her.name?.replace('장', '') || '은진')
    : (settings.him.name?.replace('염', '') || '상명')
  const myColor = isHer ? 'var(--color-her)' : 'var(--color-him)'
  const myColorBg = isHer ? 'var(--color-her-bg)' : 'var(--color-him-bg)'

  function validate() {
    if (!myData.id.trim()) return 'ID를 입력해주세요.'
    if (myData.id.length < 3) return 'ID는 3자 이상이어야 해요.'

    // 상대방과 같은 ID 사용 못 함
    const otherAccount = accounts?.find(a => a.role !== currentRole)
    if (otherAccount && myData.id.trim() === otherAccount.id) {
      return '상대방과 같은 ID는 사용할 수 없어요.'
    }

    if (forceMode) {
      // 첫 설정은 비번 필수
      if (!myData.password) return '비밀번호를 입력해주세요.'
      if (myData.password.length < 4) return '비밀번호는 4자 이상이어야 해요.'
      if (myData.password !== myData.confirmPw) return '비밀번호가 일치하지 않아요.'
    } else {
      // 일반 변경 - 비번은 선택 (입력 시에만 변경)
      if (myData.password) {
        if (myData.password.length < 4) return '비밀번호는 4자 이상이어야 해요.'
        if (myData.password !== myData.confirmPw) return '비밀번호가 일치하지 않아요.'
      }
    }
    return null
  }

  async function handleSave() {
    const err = validate()
    if (err) {
      setError(err)
      return
    }

    setSaving(true)
    try {
      // 본인 계정 정보
      const myNewAccount = {
        id: myData.id.trim(),
        password: myData.password || (myCurrentAccount?.password || ''),
        name: isHer ? settings.her.name : settings.him.name,
        role: currentRole,
      }

      // accounts 배열 업데이트 (본인 것만)
      const otherAccount = accounts?.find(a => a.role !== currentRole)
      const newAccounts = otherAccount
        ? [myNewAccount, otherAccount]
        : [myNewAccount]

      await setAccounts(newAccounts)

      // 로그인 정보 업데이트
      setAuth({
        ...auth,
        isLoggedIn: true,
        user: { id: myNewAccount.id, name: myNewAccount.name, role: myNewAccount.role },
        isFirstLogin: false,
      })

      alert(
        forceMode
          ? '계정 설정 완료! 다음부터는 새로 설정한 계정으로 로그인하세요.'
          : '계정 정보가 수정되었어요!'
      )

      if (onClose) onClose()
    } catch (err) {
      setError('저장 실패: ' + err.message)
    } finally {
      setSaving(false)
    }
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
        maxWidth: '420px',
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
            <p className="meta" style={{ color: myColor, margin: '0 0 8px', letterSpacing: '3px' }}>
              ⚠ FIRST LOGIN
            </p>
          )}
          <p className="serif italic" style={{ fontSize: '24px', margin: '0 0 6px' }}>
            {forceMode ? '내 계정 설정' : '내 계정 변경'}
          </p>
          <p className="meta" style={{ color: 'var(--text-muted)', margin: 0 }}>
            {forceMode
              ? '본인이 사용할 ID와 비밀번호를 설정해주세요'
              : 'ID와 비밀번호를 변경할 수 있어요'}
          </p>
        </div>

        {forceMode && (
          <div className="card-warm" style={{ padding: '12px', marginBottom: '20px', transform: 'rotate(-0.3deg)' }}>
            <p className="serif italic" style={{ fontSize: '12px', color: 'var(--color-accent)', margin: 0, lineHeight: 1.6 }}>
              💡 둘만의 비밀스러운 다이어리를 위해<br />
              본인이 사용할 ID와 비번을 설정해주세요.<br />
              상대방은 본인의 PC/폰에서 따로 설정해요.
            </p>
          </div>
        )}

        {/* 본인 계정 입력 */}
        <div style={{
          border: `0.5px solid ${myColor}`,
          background: myColorBg,
          padding: '16px',
          borderRadius: '4px',
          marginBottom: '14px'
        }}>
          <p className="serif italic" style={{ fontSize: '15px', color: myColor, margin: '0 0 10px' }}>
            {myName}의 계정
          </p>
          <input
            type="text"
            placeholder="새 ID (3자 이상)"
            className="input-line"
            style={{ marginBottom: '8px', fontSize: '13px' }}
            value={myData.id}
            onChange={e => { setMyData({ ...myData, id: e.target.value }); setError('') }}
            autoComplete="username"
          />
          <input
            type="password"
            placeholder={forceMode ? '새 비밀번호 (4자 이상)' : '새 비밀번호 (변경 시에만 입력)'}
            className="input-line"
            style={{ marginBottom: '8px', fontSize: '13px' }}
            value={myData.password}
            onChange={e => { setMyData({ ...myData, password: e.target.value }); setError('') }}
            autoComplete="new-password"
          />
          <input
            type="password"
            placeholder="비밀번호 확인"
            className="input-line"
            style={{ fontSize: '13px' }}
            value={myData.confirmPw}
            onChange={e => { setMyData({ ...myData, confirmPw: e.target.value }); setError('') }}
            autoComplete="new-password"
          />
        </div>

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
              disabled={saving}
              style={{
                flex: 1,
                background: 'transparent',
                border: '0.5px solid var(--text-faint)',
                color: 'var(--text-muted)',
                padding: '12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '2px',
                cursor: saving ? 'not-allowed' : 'pointer',
                borderRadius: '4px',
                opacity: saving ? 0.5 : 1
              }}
            >취소</button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: forceMode ? 1 : 2,
              background: myColor,
              border: 'none',
              color: 'white',
              padding: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '2px',
              cursor: saving ? 'not-allowed' : 'pointer',
              borderRadius: '4px',
              fontWeight: 700,
              opacity: saving ? 0.5 : 1
            }}
          >{saving ? '저장중...' : (forceMode ? '✓ 설정 완료' : '저장')}</button>
        </div>
      </div>
    </div>
  )
}
