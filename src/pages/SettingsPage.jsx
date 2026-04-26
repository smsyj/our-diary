import { useState, useEffect } from 'react'
import { daysSince, nextYearAnniversary } from '../utils/dateUtils'
import AccountSetupModal from '../components/AccountSetupModal'
import { api } from '../utils/api'

export default function SettingsPage({ data, navigate, onLogout, isDesktop }) {
  const { settings, setSettings, accounts, auth } = data
  const isAdmin = auth?.isAdmin === true
  const [draft, setDraft] = useState(settings)
  const [showAddAnniv, setShowAddAnniv] = useState(false)
  const [newAnniv, setNewAnniv] = useState({ title: '', date: '' })
  const [showAccountModal, setShowAccountModal] = useState(false)

  const today = new Date()
  const days = daysSince(draft.startDate, today)
  const yearAnn = nextYearAnniversary(draft.startDate, today)

  // PWA 설치 가능 여부 추적
  const [installable, setInstallable] = useState(!!(typeof window !== 'undefined' && window.__deferredInstallPrompt))
  useEffect(() => {
    function onInstallable() { setInstallable(true) }
    function onInstalled() { setInstallable(false) }
    window.addEventListener('pwa-installable', onInstallable)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('pwa-installable', onInstallable)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function installCalendarWidget() {
    const promptEvent = window.__deferredInstallPrompt
    if (!promptEvent) {
      alert(
        '브라우저 설치 안내가 아직 준비되지 않았어요.\n\n' +
        '➊ Chrome / Edge 주소창 오른쪽의 "설치" 아이콘(⊕)을 클릭\n' +
        '➋ 또는 메뉴 → "앱 설치"를 선택해주세요.\n\n' +
        '설치 후 시작 메뉴/바탕화면에 아이콘이 생기고,\n' +
        '실행하면 캘린더만 작은 창으로 떠요 (Windows 위젯처럼 사용 가능).'
      )
      return
    }
    promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted') {
      window.__deferredInstallPrompt = null
      setInstallable(false)
      alert('설치 완료! 시작 메뉴에서 "Diary Cal"을 실행하면 캘린더만 작은 창으로 떠요.')
    }
  }

  function save() {
    setSettings(draft)
    alert('저장됐어요 ♡')
  }

  function exportData() {
    const exportObj = {
      settings: data.settings,
      entries: data.entries,
      events: data.events,
      customAnniversaries: data.customAnniversaries,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `our-diary-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 어드민 전용: 모든 데이터 초기화
  async function resetAllData() {
    if (!confirm('⚠️ 정말 모든 데이터를 초기화할까요?\n\n- 일기, 사진, 일정, 위시리스트 모두 삭제 (서버에서)\n- 사용자 계정 정보 삭제\n- 처음 사용 상태로 돌아감\n\n이 작업은 되돌릴 수 없어요!')) return
    if (!confirm('진짜로 진행할까요? 마지막 확인입니다.')) return

    try {
      // 모든 데이터 서버에서 삭제
      const [entries, events, wishlist, annivs, accounts] = await Promise.all([
        api.getEntries(),
        api.getEvents(),
        api.getWishlist(),
        api.getAnniversaries(),
        api.getAccounts(),
      ])

      // 일기 삭제
      for (const e of entries) {
        await api.deleteEntry(e.id)
      }
      // 일정 삭제
      for (const e of events) {
        await api.deleteEvent(e.id)
      }
      // 위시리스트 삭제
      for (const w of wishlist) {
        await api.deleteWish(w.id)
      }
      // 기념일 삭제
      for (const a of annivs) {
        await api.deleteAnniversary(a.id)
      }
      // 계정 전체 삭제
      await api.deleteAccounts()
      // 로그인 상태도 제거
      localStorage.removeItem('diary_auth')

      alert('초기화 완료! 페이지를 새로고침합니다.')
      window.location.reload()
    } catch (err) {
      alert('초기화 실패: ' + err.message)
    }
  }

  // 어드민 전용: 샘플 데이터 추가
  async function loadSampleData() {
    if (!confirm('샘플 일기/일정/위시 데이터를 추가할까요?\n(기존 데이터는 유지됨)')) return

    const today = new Date()
    const sampleEntries = [
      {
        author: 'her',
        title: '오늘의 카페 데이트 ☕',
        content: '오늘 날씨도 좋고 너랑 같이 카페 가서 너무 행복했어. 새로 생긴 라떼가 진짜 맛있더라!',
        photos: [],
        mood: 'love',
        weather: 'sunny',
        location: '연남동 카페',
        tags: ['데이트', '카페', '행복'],
        bMode: false,
        createdAt: new Date(today.getTime() - 86400000).toISOString().slice(0, 10),
      },
      {
        author: 'him',
        title: '한강 자전거',
        content: '오랜만에 자전거 빌려서 한강 따라 달렸다. 노을이 너무 예뻤음 ㅎㅎ',
        photos: [],
        mood: 'happy',
        weather: 'sunny',
        location: '한강공원',
        tags: ['데이트', '한강', '운동'],
        bMode: false,
        createdAt: new Date(today.getTime() - 172800000).toISOString().slice(0, 10),
      },
    ]

    try {
      for (const e of sampleEntries) {
        await data.addEntry(e)
      }
      alert('샘플 데이터 추가 완료!')
    } catch (err) {
      alert('샘플 추가 실패: ' + err.message)
    }
  }

  async function addAnniversary() {
    if (!newAnniv.title.trim() || !newAnniv.date) return
    try {
      await data.addAnniversary({ title: newAnniv.title.trim(), date: newAnniv.date })
      setNewAnniv({ title: '', date: '' })
      setShowAddAnniv(false)
    } catch (err) {
      console.error('기념일 추가 실패:', err)
    }
  }

  async function removeAnniversary(id) {
    try {
      await data.deleteAnniversary(id)
    } catch (err) {
      console.error('기념일 삭제 실패:', err)
    }
  }

  function toggleNotif(key) {
    setDraft({
      ...draft,
      notifications: { ...draft.notifications, [key]: !draft.notifications?.[key] }
    })
  }

  return (
    <div className={isDesktop ? '' : 'phone'} style={isDesktop ? { maxWidth: '720px', margin: '0 auto' } : {}}>
      <div className="paper">
        {!isDesktop && <div className="tape-top"></div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingTop: isDesktop ? 0 : '8px' }}>
          {!isDesktop && <p className="meta" style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => navigate('dashboard')}>← 홈</p>}
          <p className="serif italic" style={{ fontSize: isDesktop ? '24px' : '18px', margin: 0 }}>Settings</p>
          <p className="meta" style={{ color: 'var(--color-her)', cursor: 'pointer', fontWeight: 700 }} onClick={save}>저장</p>
        </div>

        <p className="label" style={{ margin: '0 0 8px' }}>▸ ABOUT US</p>
        <div className="card" style={{ padding: '14px', marginBottom: '16px' }}>
          <div style={{ marginBottom: '14px' }}>
            <label className="meta" style={{ display: 'block', color: 'var(--text-muted)', fontSize: '9px', marginBottom: '4px' }}>우리가 만난 날</label>
            <input type="date" className="input-line" value={draft.startDate} onChange={e => setDraft({ ...draft, startDate: e.target.value })} />
            <p className="meta" style={{ color: 'var(--color-her)', margin: '4px 0 0' }}>현재 D+{days} · {yearAnn.years}주년까지 D-{yearAnn.dDay}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
            <div>
              <label className="meta" style={{ display: 'block', color: 'var(--text-muted)', fontSize: '9px', marginBottom: '4px' }}>여자친구 이름</label>
              <input type="text" className="input-line" style={{ color: 'var(--color-her)' }} value={draft.her.name} onChange={e => setDraft({ ...draft, her: { ...draft.her, name: e.target.value } })} />
            </div>
            <div>
              <label className="meta" style={{ display: 'block', color: 'var(--text-muted)', fontSize: '9px', marginBottom: '4px' }}>남자친구 이름</label>
              <input type="text" className="input-line" style={{ color: 'var(--color-him)' }} value={draft.him.name} onChange={e => setDraft({ ...draft, him: { ...draft.him, name: e.target.value } })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="meta" style={{ display: 'block', color: 'var(--text-muted)', fontSize: '9px', marginBottom: '4px' }}>{draft.her.name.replace('장', '')} 생일</label>
              <input type="date" className="input-line" style={{ fontSize: '12px' }} value={draft.her.birthday || ''} onChange={e => setDraft({ ...draft, her: { ...draft.her, birthday: e.target.value } })} />
            </div>
            <div>
              <label className="meta" style={{ display: 'block', color: 'var(--text-muted)', fontSize: '9px', marginBottom: '4px' }}>{draft.him.name.replace('염', '')} 생일</label>
              <input type="date" className="input-line" style={{ fontSize: '12px' }} value={draft.him.birthday || ''} onChange={e => setDraft({ ...draft, him: { ...draft.him, birthday: e.target.value } })} />
            </div>
          </div>
        </div>

        <p className="label" style={{ margin: '0 0 8px' }}>▸ ANNIVERSARIES</p>
        <div className="card" style={{ padding: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
            <p className="serif" style={{ fontSize: '13px', margin: 0 }}>100일 단위 자동 알림</p>
            <div className={`toggle ${draft.notifications?.hundredDays ? 'active' : 'inactive'}`} onClick={() => toggleNotif('hundredDays')}></div>
          </div>
          <hr style={{ border: 0, borderTop: '0.5px solid var(--line-solid)', margin: '4px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
            <p className="serif" style={{ fontSize: '13px', margin: 0 }}>주년 자동 알림 (1년/2년...)</p>
            <div className={`toggle ${draft.notifications?.anniversary ? 'active' : 'inactive'}`} onClick={() => toggleNotif('anniversary')}></div>
          </div>
          <hr style={{ border: 0, borderTop: '0.5px solid var(--line-solid)', margin: '4px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
            <p className="serif" style={{ fontSize: '13px', margin: 0 }}>생일 자동 알림</p>
            <div className={`toggle ${draft.notifications?.birthday ? 'active' : 'inactive'}`} onClick={() => toggleNotif('birthday')}></div>
          </div>
          <hr style={{ border: 0, borderTop: '0.5px solid var(--line-solid)', margin: '4px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
            <div>
              <p className="serif" style={{ fontSize: '13px', margin: 0 }}>알림 시작일</p>
              <p className="meta" style={{ color: 'var(--text-muted)', margin: 0 }}>기념일 며칠 전부터</p>
            </div>
            <select
              style={{ background: 'transparent', border: '0.5px solid var(--text-faint)', padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-primary)', borderRadius: '2px' }}
              value={draft.notifications?.daysBefore || 5}
              onChange={e => setDraft({ ...draft, notifications: { ...draft.notifications, daysBefore: Number(e.target.value) } })}
            >
              <option value="3">3일 전</option>
              <option value="5">5일 전</option>
              <option value="7">7일 전</option>
              <option value="10">10일 전</option>
            </select>
          </div>

          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '0.5px dashed var(--line-dashed)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <p className="meta" style={{ color: 'var(--text-muted)', margin: 0 }}>+ 직접 추가한 기념일 ({data.customAnniversaries.length}개)</p>
              <p className="meta" style={{ color: 'var(--color-her)', cursor: 'pointer' }} onClick={() => setShowAddAnniv(!showAddAnniv)}>
                {showAddAnniv ? '취소' : '+ 추가'}
              </p>
            </div>

            {showAddAnniv && (
              <div style={{ marginBottom: '8px' }}>
                <input type="text" placeholder="기념일 이름" className="input-line" style={{ marginBottom: '4px', fontSize: '12px' }} value={newAnniv.title} onChange={e => setNewAnniv({ ...newAnniv, title: e.target.value })} />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type="date" className="input-line" style={{ flex: 1, fontSize: '12px' }} value={newAnniv.date} onChange={e => setNewAnniv({ ...newAnniv, date: e.target.value })} />
                  <button onClick={addAnniversary} style={{ background: 'var(--color-her)', color: 'white', border: 'none', padding: '4px 12px', fontFamily: 'var(--font-mono)', fontSize: '10px', cursor: 'pointer' }}>추가</button>
                </div>
              </div>
            )}

            {data.customAnniversaries.map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                <p className="serif italic" style={{ fontSize: '12px', margin: 0 }}>{a.title} · {a.date}</p>
                <span className="meta" style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => removeAnniversary(a.id)}>×</span>
              </div>
            ))}
          </div>
        </div>

        <p className="label" style={{ margin: '0 0 8px' }}>▸ ACCOUNT</p>
        <div className="card" style={{ padding: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', cursor: 'pointer' }} onClick={installCalendarWidget}>
            <div>
              <p className="serif" style={{ fontSize: '13px', margin: 0 }}>📅 캘린더 위젯 다운로드</p>
              <p className="meta" style={{ color: 'var(--text-muted)', margin: '2px 0 0', fontSize: '10px' }}>
                {installable ? 'Windows 바탕화면에서 캘린더를 작은 창으로 띄워요' : '주소창의 ⊕ 아이콘 또는 메뉴 → "앱 설치"'}
              </p>
            </div>
            <p className="meta" style={{ color: installable ? 'var(--color-her)' : 'var(--text-muted)', fontSize: '11px', fontWeight: installable ? 700 : 400 }}>
              {installable ? '↓ 설치' : 'ℹ️ 안내'}
            </p>
          </div>
          <hr style={{ border: 0, borderTop: '0.5px solid var(--line-solid)', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', cursor: 'pointer' }} onClick={exportData}>
            <p className="serif" style={{ fontSize: '13px', margin: 0 }}>데이터 백업/내보내기</p>
            <p className="meta" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>↓</p>
          </div>
          <hr style={{ border: 0, borderTop: '0.5px solid var(--line-solid)', margin: '4px 0' }} />
          {!isAdmin && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', cursor: 'pointer' }} onClick={() => setShowAccountModal(true)}>
                <div>
                  <p className="serif" style={{ fontSize: '13px', margin: 0 }}>🔐 내 ID / 비밀번호 변경</p>
                  <p className="meta" style={{ color: 'var(--text-muted)', margin: '2px 0 0', fontSize: '10px' }}>
                    {(() => {
                      const myAccount = accounts?.find(a => a.role === auth.user?.role)
                      return myAccount
                        ? `현재 ID: ${myAccount.id}`
                        : '아직 초기 계정 설정이 안 됐어요'
                    })()}
                  </p>
                </div>
                <p className="meta" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>→</p>
              </div>
              <hr style={{ border: 0, borderTop: '0.5px solid var(--line-solid)', margin: '4px 0' }} />
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', cursor: 'pointer' }} onClick={onLogout}>
            <p className="serif" style={{ fontSize: '13px', color: 'var(--color-her)', margin: 0 }}>로그아웃</p>
            <p className="meta" style={{ color: 'var(--color-her)', fontSize: '11px' }}>→</p>
          </div>
        </div>

        {/* 어드민 전용 섹션 */}
        {isAdmin && (
          <>
            <p className="label" style={{ margin: '0 0 8px', color: 'var(--color-her)' }}>▸ ADMIN ONLY ⚠️</p>
            <div className="card" style={{
              padding: '14px',
              marginBottom: '16px',
              border: '1px dashed var(--color-her)',
              background: 'rgba(212, 83, 126, 0.04)'
            }}>
              <p className="meta" style={{ color: 'var(--color-her)', margin: '0 0 10px', fontSize: '9px', letterSpacing: '1px' }}>
                ⚠ 이 메뉴는 admin 계정에서만 보여요
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', cursor: 'pointer' }} onClick={loadSampleData}>
                <div>
                  <p className="serif" style={{ fontSize: '13px', margin: 0 }}>📦 샘플 데이터 추가</p>
                  <p className="meta" style={{ color: 'var(--text-muted)', margin: '2px 0 0', fontSize: '10px' }}>
                    테스트용 일기 2개 추가
                  </p>
                </div>
                <p className="meta" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>+</p>
              </div>
              <hr style={{ border: 0, borderTop: '0.5px solid var(--line-solid)', margin: '4px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', cursor: 'pointer' }} onClick={resetAllData}>
                <div>
                  <p className="serif" style={{ fontSize: '13px', color: 'var(--color-her)', margin: 0 }}>🗑 모든 데이터 초기화</p>
                  <p className="meta" style={{ color: 'var(--text-muted)', margin: '2px 0 0', fontSize: '10px' }}>
                    일기/사진/계정 모두 삭제 (되돌릴 수 없음)
                  </p>
                </div>
                <p className="meta" style={{ color: 'var(--color-her)', fontSize: '11px' }}>⚠ Reset</p>
              </div>
            </div>
          </>
        )}

        <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '8px', letterSpacing: '3px', color: 'var(--text-faint)', margin: '1rem 0 0', textTransform: 'uppercase' }}>
          — Our Diary v1.0 · made with ♡ {isAdmin && ' · ADMIN MODE'} —
        </p>
      </div>

      {/* 계정 변경 모달 */}
      {showAccountModal && (
        <AccountSetupModal
          data={data}
          forceMode={false}
          onClose={() => setShowAccountModal(false)}
        />
      )}
    </div>
  )
}
