import { useState, useMemo } from 'react'
import { formatDate, daysSince } from '../utils/dateUtils'

export default function IndexPage({ data, navigate, isDesktop, initialViewEntry }) {
  const { entries, settings } = data
  const [view, setView] = useState('list') // list, grid
  const [selectedEntry, setSelectedEntry] = useState(initialViewEntry || null)

  // 정렬: 최신순
  const sorted = useMemo(() =>
    [...entries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  , [entries])

  // 페이지 번호 계산 (오래된 순으로 1번부터)
  const pageMap = useMemo(() => {
    const oldestFirst = [...entries].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    const map = {}
    oldestFirst.forEach((e, i) => { map[e.id] = i + 1 })
    return map
  }, [entries])

  const totalPages = entries.length

  // ============ 게시판 뷰 (선택된 일기 보기) ============
  if (selectedEntry) {
    const e = selectedEntry
    const d = new Date(e.createdAt)
    const dateLabel = formatDate(d, 'kr')
    const isHer = e.author === 'her'
    const authorName = isHer ? settings.her.name.replace('장', '') : settings.him.name.replace('염', '')
    const pageNum = pageMap[e.id]

    return (
      <div className={isDesktop ? '' : 'phone'} style={isDesktop ? { maxWidth: '760px', margin: '0 auto' } : {}}>
        <div className="paper">
          {!isDesktop && <div className="tape-top"></div>}

          {/* 상단 버튼 영역 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingTop: isDesktop ? 0 : '8px', gap: '8px' }}>
            <button
              onClick={() => setSelectedEntry(null)}
              style={{
                background: 'transparent',
                border: '0.5px solid var(--text-faint)',
                color: 'var(--text-muted)',
                padding: '8px 14px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '2px',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >☰ 목록</button>
            <button
              onClick={() => navigate('write', { entry: e })}
              style={{
                background: 'var(--color-her)',
                border: 'none',
                color: 'white',
                padding: '8px 14px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '2px',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >✎ 수정하기</button>
          </div>

          {/* 게시판 헤더 */}
          <div style={{ borderBottom: '0.5px solid var(--text-faint)', paddingBottom: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{
                display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                background: isHer ? 'var(--color-her)' : 'var(--color-him)',
              }}></span>
              <p className="meta" style={{ color: 'var(--text-muted)', margin: 0 }}>
                #{String(e.number).padStart(3, '0')} · {authorName}
              </p>
              {e.bMode && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '8px',
                  background: 'var(--color-her-bg)', color: 'var(--color-her)',
                  padding: '2px 6px', borderRadius: '3px', fontWeight: 700, letterSpacing: '1px',
                }}>✦ B-MODE</span>
              )}
              <p className="meta" style={{ color: 'var(--text-muted)', margin: 0, marginLeft: 'auto' }}>
                {pageNum} p.
              </p>
            </div>
            <p className="serif italic" style={{ fontSize: isDesktop ? '22px' : '17px', margin: '4px 0 6px', color: 'var(--text-primary)' }}>
              {e.title || '제목 없음'}
            </p>
            <p className="meta" style={{ color: 'var(--text-muted)', margin: 0 }}>
              {dateLabel}
              {e.location && ` · ${e.location}`}
            </p>
          </div>

          {/* B-MODE 합성 이미지 */}
          {e.bMode && e.bModeImage && (
            <div style={{ marginBottom: '14px', textAlign: 'center' }}>
              <img src={e.bModeImage} alt="" style={{ maxWidth: '100%', display: 'inline-block', border: '0.5px solid var(--line-solid)' }} />
            </div>
          )}

          {/* 사진들 (일반 모드) */}
          {!e.bMode && e.photos && e.photos.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
              gap: '6px',
              marginBottom: '14px',
            }}>
              {e.photos.map(p => (
                <div key={p.id} style={{
                  aspectRatio: 1,
                  backgroundImage: `url(${p.src})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '0.5px solid var(--line-solid)',
                }}></div>
              ))}
            </div>
          )}

          {/* 본문 */}
          <div className="card lined-paper" style={{ padding: '14px', marginBottom: '14px', minHeight: '120px' }}>
            <p className="serif" style={{ fontSize: '14px', lineHeight: '24px', margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
              {e.bMode ? (e.bModeText || e.content) : (e.content || '내용이 없습니다.')}
            </p>
          </div>

          {/* 태그 */}
          {e.tags && e.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
              {e.tags.map(t => (
                <span key={t} style={{
                  background: 'var(--paper-warm)', color: 'var(--color-accent)',
                  padding: '3px 9px', borderRadius: '10px',
                  fontFamily: 'var(--font-mono)', fontSize: '9px',
                }}>#{t}</span>
              ))}
            </div>
          )}

          <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '8px', letterSpacing: '3px', color: 'var(--text-faint)', margin: '1rem 0 0', textTransform: 'uppercase' }}>
            — diary entry ♡ —
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={isDesktop ? '' : 'phone'} style={isDesktop ? { maxWidth: '900px', margin: '0 auto' } : {}}>
      <div className="paper">
        {!isDesktop && <div className="tape-top"></div>}

        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingTop: isDesktop ? 0 : '8px' }}>
          {!isDesktop && <p className="meta" style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => navigate('dashboard')}>← 홈</p>}
          <p className="serif italic" style={{ fontSize: isDesktop ? '24px' : '18px', margin: 0 }}>목차 · Index</p>

          {/* 보기 전환 토글 */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <span
              onClick={() => setView('list')}
              style={{
                background: view === 'list' ? 'var(--text-primary)' : 'transparent',
                color: view === 'list' ? 'var(--paper-bg)' : 'var(--text-muted)',
                border: view === 'list' ? 'none' : '0.5px solid var(--text-faint)',
                padding: '4px 8px', borderRadius: '4px', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px'
              }}
            >☰</span>
            <span
              onClick={() => setView('grid')}
              style={{
                background: view === 'grid' ? 'var(--text-primary)' : 'transparent',
                color: view === 'grid' ? 'var(--paper-bg)' : 'var(--text-muted)',
                border: view === 'grid' ? 'none' : '0.5px solid var(--text-faint)',
                padding: '4px 8px', borderRadius: '4px', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: '10px'
              }}
            >▦</span>
          </div>
        </div>

        {/* 통계 */}
        <div className="card-warm" style={{ marginBottom: '1rem', transform: 'rotate(-0.3deg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="meta" style={{ color: 'var(--color-accent)', margin: '0 0 2px' }}>총 {totalPages} 페이지</p>
            <p className="serif italic" style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              우리의 모든 이야기 ♡
            </p>
          </div>
          <p className="serif" style={{ fontSize: '24px', margin: 0, color: 'var(--text-primary)' }}>{totalPages}</p>
        </div>

        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p className="serif italic" style={{ color: 'var(--text-faint)', margin: 0 }}>
              아직 작성된 일기가 없어요
            </p>
            <p className="meta" style={{ color: 'var(--text-muted)', margin: '8px 0 0' }}>
              첫 번째 페이지를 채워볼까요?
            </p>
          </div>
        ) : view === 'list' ? (
          /* ============ 리스트 뷰 ============ */
          <div>
            {/* 표 헤더 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 50px',
              gap: '8px',
              padding: '8px 10px',
              borderBottom: '0.5px solid var(--text-faint)',
              marginBottom: '4px'
            }}>
              <p className="meta" style={{ color: 'var(--text-muted)', margin: 0, letterSpacing: '1.5px' }}>날짜</p>
              <p className="meta" style={{ color: 'var(--text-muted)', margin: 0, letterSpacing: '1.5px' }}>제목</p>
              <p className="meta" style={{ color: 'var(--text-muted)', margin: 0, letterSpacing: '1.5px', textAlign: 'right' }}>P.</p>
            </div>

            {/* 항목들 */}
            {sorted.map((entry, i) => {
              const d = new Date(entry.createdAt)
              const dateLabel = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
              const isHer = entry.author === 'her'

              return (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 50px',
                    gap: '8px',
                    padding: '12px 10px',
                    borderBottom: '0.5px dashed var(--line-dashed)',
                    cursor: 'pointer',
                    alignItems: 'center',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(184, 153, 104, 0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* 날짜 */}
                  <p className="serif" style={{ fontSize: '12px', margin: 0, color: 'var(--text-primary)' }}>
                    {dateLabel}
                  </p>

                  {/* 제목 + 정보 */}
                  <div style={{ minWidth: 0 }}>
                    <p
                      className="serif"
                      style={{
                        fontSize: '13px',
                        margin: 0,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.4,
                      }}
                    >
                      {entry.title || (entry.content && entry.content.slice(0, 30)) || '제목 없음'}
                    </p>
                    {/* 미니 메타 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                      {/* 작성자 점 */}
                      <span style={{
                        display: 'inline-block',
                        width: '6px', height: '6px',
                        borderRadius: '50%',
                        background: isHer ? 'var(--color-her)' : 'var(--color-him)',
                      }}></span>
                      {/* 사진 개수 */}
                      {entry.photos && entry.photos.length > 0 && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--text-muted)' }}>
                          📷 {entry.photos.length}
                        </span>
                      )}
                      {/* B-MODE */}
                      {entry.bMode && (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '7px',
                          background: 'var(--color-her-bg)',
                          color: 'var(--color-her)',
                          padding: '1px 4px', borderRadius: '3px',
                          fontWeight: 700,
                        }}>✦ B</span>
                      )}
                      {/* 위치 */}
                      {entry.location && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--text-muted)' }}>
                          · {entry.location.length > 8 ? entry.location.slice(0, 8) + '...' : entry.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 페이지 번호 */}
                  <p className="serif italic" style={{ fontSize: '12px', margin: 0, color: 'var(--text-muted)', textAlign: 'right' }}>
                    {pageMap[entry.id]} p.
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          /* ============ 그리드 뷰 ============ */
          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
            gap: '8px'
          }}>
            {sorted.map(entry => {
              const d = new Date(entry.createdAt)
              const dateLabel = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
              const firstPhoto = entry.photos?.[0]

              return (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  style={{
                    aspectRatio: '1',
                    background: firstPhoto ? `url(${firstPhoto.src}) center/cover` : 'var(--paper-cream)',
                    border: '0.5px solid var(--line-solid)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* 텍스트 그라데이션 배경 */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    background: firstPhoto ? 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' : 'transparent',
                    padding: '20px 6px 4px',
                    color: firstPhoto ? 'white' : 'var(--text-primary)',
                  }}>
                    <p className="serif italic" style={{ fontSize: '11px', margin: 0, fontWeight: 500 }}>{dateLabel}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '5px', height: '5px',
                        borderRadius: '50%',
                        background: entry.author === 'her' ? 'var(--color-her)' : 'var(--color-him)',
                      }}></span>
                      {entry.bMode && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', fontWeight: 700 }}>B-MODE</span>}
                    </div>
                  </div>

                  {/* 사진 없으면 제목 표시 */}
                  {!firstPhoto && (
                    <div style={{ padding: '10px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p className="serif italic" style={{
                        fontSize: '11px', margin: 0, textAlign: 'center',
                        color: 'var(--text-secondary)',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {entry.title || entry.content?.slice(0, 30)}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '8px', letterSpacing: '3px', color: 'var(--text-faint)', margin: '1.5rem 0 0', textTransform: 'uppercase' }}>
          — table of contents ♡ —
        </p>
      </div>
    </div>
  )
}
