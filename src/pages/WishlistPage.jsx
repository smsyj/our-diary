import { useState } from 'react'
import { formatDate } from '../utils/dateUtils'

export default function WishlistPage({ data, navigate, isDesktop }) {
  const { wishlist, setWishlist, settings, auth } = data
  const [filter, setFilter] = useState('all') // all, pending, completed
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')

  const filtered = wishlist.filter(w => {
    if (filter === 'pending') return !w.completed
    if (filter === 'completed') return w.completed
    return true
  }).sort((a, b) => {
    // 미완료 먼저, 그 다음 최신순
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  const stats = {
    total: wishlist.length,
    completed: wishlist.filter(w => w.completed).length,
    pending: wishlist.filter(w => !w.completed).length,
  }
  const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0

  function toggleComplete(id) {
    setWishlist(wishlist.map(w =>
      w.id === id
        ? {
            ...w,
            completed: !w.completed,
            completedAt: !w.completed ? formatDate(new Date(), 'iso') : null,
          }
        : w
    ))
  }

  function addWish() {
    if (!newTitle.trim()) return
    const author = auth.user?.role || 'her'
    setWishlist([
      ...wishlist,
      {
        id: Date.now(),
        title: newTitle.trim(),
        author,
        completed: false,
        createdAt: formatDate(new Date(), 'iso'),
      }
    ])
    setNewTitle('')
    setShowAdd(false)
  }

  function startEdit(item) {
    setEditingId(item.id)
    setEditTitle(item.title)
  }

  function saveEdit(id) {
    if (!editTitle.trim()) return
    setWishlist(wishlist.map(w => w.id === id ? { ...w, title: editTitle.trim() } : w))
    setEditingId(null)
    setEditTitle('')
  }

  function deleteWish(id) {
    if (confirm('이 위시를 삭제할까요?')) {
      setWishlist(wishlist.filter(w => w.id !== id))
    }
  }

  function getAuthorBadge(authorKey) {
    const isHer = authorKey === 'her'
    const name = isHer ? settings.her.name.replace('장', '') : settings.him.name.replace('염', '')
    const color = isHer ? 'var(--color-her)' : 'var(--color-him)'
    const bgColor = isHer ? 'var(--color-her-bg)' : 'var(--color-him-bg)'
    return { name, color, bgColor }
  }

  return (
    <div className={isDesktop ? '' : 'phone'} style={isDesktop ? { maxWidth: '720px', margin: '0 auto' } : {}}>
      <div className="paper">
        {!isDesktop && <div className="tape-top"></div>}

        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingTop: isDesktop ? 0 : '8px' }}>
          {!isDesktop && <p className="meta" style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => navigate('dashboard')}>← 홈</p>}
          <p className="serif italic" style={{ fontSize: isDesktop ? '24px' : '18px', margin: 0 }}>Our Wishlist</p>
          {!isDesktop && <span style={{ width: '20px' }}></span>}
        </div>

        {/* 진행률 카드 */}
        <div className="card-warm" style={{ marginBottom: '1.25rem', transform: 'rotate(-0.3deg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
            <p className="meta" style={{ color: 'var(--color-accent)', margin: 0 }}>✦ OUR PROGRESS</p>
            <p className="serif" style={{ fontSize: '14px', margin: 0 }}>
              <strong style={{ fontWeight: 500 }}>{stats.completed}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}> / {stats.total}</span>
            </p>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.6)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--color-her)',
              transition: 'width 0.3s'
            }}></div>
          </div>
          <p className="serif italic" style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '6px 0 0', textAlign: 'right' }}>
            {progress.toFixed(0)}% 함께 이뤘어요 ♡
          </p>
        </div>

        {/* 필터 탭 */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem' }}>
          {[
            { key: 'all', label: `전체 · ${stats.total}` },
            { key: 'pending', label: `진행중 · ${stats.pending}` },
            { key: 'completed', label: `달성 · ${stats.completed}` },
          ].map(f => (
            <span
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                flex: 1,
                textAlign: 'center',
                background: filter === f.key ? 'var(--text-primary)' : 'transparent',
                color: filter === f.key ? 'var(--paper-bg)' : 'var(--text-secondary)',
                border: filter === f.key ? 'none' : '0.5px solid var(--text-faint)',
                padding: '7px 10px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '1px'
              }}
            >{f.label}</span>
          ))}
        </div>

        {/* 위시 리스트 */}
        <div style={{ marginBottom: '1rem' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p className="serif italic" style={{ color: 'var(--text-faint)', margin: 0, fontSize: '14px' }}>
                {filter === 'completed'
                  ? '아직 달성한 위시가 없어요'
                  : filter === 'pending'
                  ? '진행 중인 위시가 없어요'
                  : '아직 위시가 없어요'}
              </p>
              <p className="meta" style={{ color: 'var(--text-muted)', margin: '8px 0 0' }}>
                둘이 함께 하고 싶은 일을 적어보세요
              </p>
            </div>
          ) : (
            filtered.map((item, i) => {
              const badge = getAuthorBadge(item.author)
              const isEditing = editingId === item.id
              return (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    marginBottom: '8px',
                    padding: '12px 14px',
                    transform: i % 2 === 0 ? 'rotate(0.2deg)' : 'rotate(-0.2deg)',
                    opacity: item.completed ? 0.6 : 1,
                    transition: 'opacity 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* 체크박스 */}
                    <div
                      onClick={() => toggleComplete(item.id)}
                      style={{
                        width: '20px', height: '20px',
                        borderRadius: '50%',
                        border: `1.5px solid ${item.completed ? 'var(--color-her)' : 'var(--text-faint)'}`,
                        background: item.completed ? 'var(--color-her)' : 'transparent',
                        cursor: 'pointer',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      {item.completed && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>

                    {/* 제목 + 정보 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {isEditing ? (
                        <input
                          type="text"
                          className="input-line"
                          style={{ fontSize: '13px', borderBottom: '0.5px solid var(--color-her)' }}
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEdit(item.id)
                            if (e.key === 'Escape') { setEditingId(null); setEditTitle('') }
                          }}
                          onBlur={() => saveEdit(item.id)}
                          autoFocus
                        />
                      ) : (
                        <p
                          className="serif"
                          style={{
                            fontSize: '14px',
                            margin: 0,
                            textDecoration: item.completed ? 'line-through' : 'none',
                            color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                            cursor: 'pointer'
                          }}
                          onClick={() => !item.completed && startEdit(item)}
                        >
                          {item.title}
                        </p>
                      )}
                      {item.completedAt && (
                        <p className="meta" style={{ fontSize: '8px', color: 'var(--color-her)', margin: '2px 0 0' }}>
                          ✓ {item.completedAt} 달성
                        </p>
                      )}
                    </div>

                    {/* 작성자 뱃지 */}
                    <div
                      style={{
                        width: '26px', height: '26px',
                        borderRadius: '50%',
                        background: badge.bgColor,
                        color: badge.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 500,
                        fontFamily: 'var(--font-serif)',
                        flexShrink: 0,
                        border: `0.5px solid ${badge.color}`,
                      }}
                      title={`${badge.name}이(가) 추가함`}
                    >
                      {badge.name.charAt(0)}
                    </div>

                    {/* 삭제 버튼 (호버시) */}
                    <span
                      style={{
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        flexShrink: 0,
                        opacity: 0.5
                      }}
                      onClick={() => deleteWish(item.id)}
                      title="삭제"
                    >×</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* 추가 입력 */}
        {showAdd ? (
          <div className="card" style={{ padding: '12px 14px', marginBottom: '12px', border: '0.5px solid var(--color-her)' }}>
            <input
              type="text"
              placeholder="둘이 같이 하고 싶은 일을 적어보세요..."
              className="input-line italic"
              style={{ fontSize: '14px', marginBottom: '10px' }}
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addWish()
                if (e.key === 'Escape') { setShowAdd(false); setNewTitle('') }
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => { setShowAdd(false); setNewTitle('') }}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '0.5px solid var(--text-faint)',
                  color: 'var(--text-muted)',
                  padding: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >취소</button>
              <button
                onClick={addWish}
                style={{
                  flex: 2,
                  background: 'var(--color-her)',
                  color: 'white',
                  border: 'none',
                  padding: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '2px',
                  cursor: 'pointer'
                }}
              >추가</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            style={{
              width: '100%',
              background: 'transparent',
              border: '0.5px dashed var(--line-dashed)',
              color: 'var(--text-muted)',
              padding: '14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '2px',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >+ 새로운 위시 추가</button>
        )}

        <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '8px', letterSpacing: '3px', color: 'var(--text-faint)', margin: '1.5rem 0 0', textTransform: 'uppercase' }}>
          — wishes &amp; dreams ♡ —
        </p>
      </div>
    </div>
  )
}
