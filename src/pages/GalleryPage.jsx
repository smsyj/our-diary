import { useState, useMemo } from 'react'
import { formatDate } from '../utils/dateUtils'
import { downloadDataUrl } from '../utils/bModeUtils'

export default function GalleryPage({ data, navigate, isDesktop }) {
  const { entries, settings } = data
  const [filter, setFilter] = useState('all')
  const [viewPhoto, setViewPhoto] = useState(null)

  const allPhotos = useMemo(() => {
    const list = []
    entries.forEach(entry => {
      // B-MODE 사진은 합성 이미지로 표시
      if (entry.bMode && entry.bModeImage) {
        list.push({
          id: `bmode-${entry.id}`,
          src: entry.bModeImage, // 합성된 이미지
          originalSrc: entry.bModePhoto?.src, // 원본 사진
          isBMode: true,
          author: entry.author,
          date: entry.createdAt,
          entryId: entry.id,
          favorite: false,
          text: entry.bModeText,
        })
      } else {
        // 일반 사진들
        (entry.photos || []).forEach(photo => {
          list.push({
            ...photo,
            author: entry.author,
            date: entry.createdAt,
            entryId: entry.id,
            favorite: photo.favorite || false,
          })
        })
      }
    })
    return list.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [entries])

  const filteredPhotos = useMemo(() => {
    if (filter === 'all') return allPhotos
    if (filter === 'favorite') return allPhotos.filter(p => p.favorite)
    if (filter === 'bmode') return allPhotos.filter(p => p.isBMode)
    return allPhotos.filter(p => p.author === filter)
  }, [allPhotos, filter])

  const grouped = useMemo(() => {
    const groups = {}
    filteredPhotos.forEach(photo => {
      const d = new Date(photo.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!groups[key]) groups[key] = []
      groups[key].push(photo)
    })
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredPhotos])

  const totalSize = allPhotos.reduce((sum, p) => sum + (p.size || 0), 0)
  const totalSizeGB = (totalSize / 1024 / 1024 / 1024).toFixed(2)
  const usedPercent = Math.min((totalSize / (10 * 1024 * 1024 * 1024)) * 100, 100)

  function downloadPhoto(photo) {
    const filename = photo.isBMode
      ? `our-diary-bmode-${photo.date}.png`
      : `our-diary-${photo.date}.jpg`
    downloadDataUrl(photo.src, filename)
  }

  function getMonthLabel(key) {
    const [year, month] = key.split('-')
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December']
    return `${year} · ${months[parseInt(month) - 1]}`
  }

  return (
    <div className={isDesktop ? '' : 'phone'}>
      <div className="paper">
        {!isDesktop && <div className="tape-top"></div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingTop: isDesktop ? 0 : '8px' }}>
          {!isDesktop && <p className="meta" style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => navigate('dashboard')}>← 홈</p>}
          <p className="serif italic" style={{ fontSize: isDesktop ? '24px' : '18px', margin: 0 }}>Our Gallery</p>
          {!isDesktop && <p className="meta" style={{ color: 'var(--text-muted)' }}>⌕</p>}
          {isDesktop && <p className="meta" style={{ color: 'var(--text-muted)' }}>{allPhotos.length} photos · {totalSizeGB} GB</p>}
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem', overflowX: 'auto' }}>
          {[
            { key: 'all', label: `ALL · ${allPhotos.length}` },
            { key: 'her', label: settings.her.name.replace('장', '') },
            { key: 'him', label: settings.him.name.replace('염', '') },
            { key: 'bmode', label: '✦ B-MODE' },
            { key: 'favorite', label: '즐겨찾기' },
          ].map(f => (
            <span
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                background: filter === f.key ? 'var(--text-primary)' : 'transparent',
                color: filter === f.key ? 'var(--paper-bg)' : 'var(--text-secondary)',
                border: filter === f.key ? 'none' : '0.5px solid var(--text-faint)',
                padding: '5px 12px', borderRadius: '12px', cursor: 'pointer',
                flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '1px'
              }}
            >{f.label}</span>
          ))}
        </div>

        {grouped.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p className="serif italic" style={{ color: 'var(--text-faint)', margin: 0 }}>아직 사진이 없어요</p>
            <p className="meta" style={{ color: 'var(--text-muted)', margin: '8px 0 0' }}>일기를 작성하면서 사진을 추가해보세요</p>
          </div>
        ) : (
          grouped.map(([key, photos]) => (
            <div key={key} style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                <p className="serif italic" style={{ fontSize: '16px', margin: 0 }}>{getMonthLabel(key)}</p>
                <div style={{ flex: 1, height: '0.5px', background: 'var(--text-faint)' }}></div>
                <p className="meta" style={{ color: 'var(--text-muted)' }}>{photos.length} PHOTOS</p>
              </div>

              <div className="gallery-grid">
                {photos.map(photo => (
                  <div
                    key={photo.id}
                    className="photo-tile"
                    style={{ backgroundImage: `url(${photo.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    onClick={() => setViewPhoto(photo)}
                  >
                    <p className="photo-tag" style={{ color: photo.author === 'her' ? 'var(--color-her)' : 'var(--color-him)' }}>
                      {formatDate(photo.date, 'short')}
                    </p>
                    {photo.favorite && (
                      <svg className="photo-fav" width="10" height="10" viewBox="0 0 24 24" fill="white">
                        <path d="M12 21s-7-4.35-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.65-7 10-7 10z" />
                      </svg>
                    )}
                    {photo.isBMode && (
                      <span style={{
                        position: 'absolute',
                        bottom: 4, left: 4,
                        background: 'rgba(183, 62, 95, 0.95)',
                        color: 'white',
                        fontSize: '8px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        letterSpacing: '1px',
                      }}>✦ B-MODE</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        <div className="card" style={{ padding: '12px', marginTop: '1rem' }}>
          <p className="label" style={{ margin: '0 0 8px' }}>▸ STORAGE</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '4px', background: 'var(--paper-shadow)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${usedPercent}%`, background: 'var(--color-her)' }}></div>
            </div>
            <p className="meta" style={{ color: 'var(--text-primary)' }}>{totalSizeGB} / 10 GB</p>
          </div>
          <p className="meta" style={{ color: 'var(--text-muted)', margin: '6px 0 0' }}>
            {allPhotos.length}장 저장됨 · 자동 압축 ON
          </p>
        </div>

        {viewPhoto && (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 100, padding: '20px', flexDirection: 'column', gap: '16px'
            }}
            onClick={() => setViewPhoto(null)}
          >
            <img src={viewPhoto.src} alt="" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />

            <div style={{ display: 'flex', gap: '12px' }} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => downloadPhoto(viewPhoto)}
                style={{
                  background: 'var(--color-her)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 24px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '2px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
              >↓ 다운로드</button>
              <button
                onClick={() => setViewPhoto(null)}
                style={{
                  background: 'transparent',
                  color: 'white',
                  border: '0.5px solid white',
                  padding: '10px 24px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '2px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
              >닫기</button>
            </div>

            <p
              style={{ position: 'absolute', top: '20px', right: '20px', color: 'white', fontFamily: 'var(--font-mono)', fontSize: '20px', cursor: 'pointer', padding: '10px' }}
              onClick={() => setViewPhoto(null)}
            >×</p>
          </div>
        )}
      </div>
    </div>
  )
}
