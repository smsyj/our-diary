import { useState, useRef, useEffect } from 'react'
import { daysSince, formatDate } from '../utils/dateUtils'
import { processPhoto } from '../utils/photoUtils'
import { EVENT_CATEGORIES } from '../utils/eventUtils'
import { generateBModeImage, downloadDataUrl } from '../utils/bModeUtils'

const MOOD_OPTIONS = [
  { key: 'sunny', icon: '☀' },
  { key: 'love', icon: '♡' },
  { key: 'happy', icon: '✿' },
  { key: 'rainy', icon: '☂' },
  { key: 'calm', icon: '☾' },
]

const WEATHER_OPTIONS = [
  { key: 'sunny', icon: '☀' },
  { key: 'cloudy', icon: '☁' },
  { key: 'rainy', icon: '☂' },
  { key: 'snowy', icon: '❄' },
  { key: 'storm', icon: '⚡' },
]

export default function WritePage({ data, navigate, editingEntry, isDesktop }) {
  const { settings, entries, setEntries, events, setEvents } = data
  const fileInputRef = useRef(null)
  const bModePhotoRef = useRef(null)
  const isEditing = !!editingEntry

  const [author, setAuthor] = useState(editingEntry?.author || data.auth.user?.role || 'her')
  const [title, setTitle] = useState(editingEntry?.title || '')
  const [content, setContent] = useState(editingEntry?.content || '')
  const [photos, setPhotos] = useState(editingEntry?.photos || [])
  const [mood, setMood] = useState(editingEntry?.mood || 'love')
  const [weather, setWeather] = useState(editingEntry?.weather || 'sunny')
  const [location, setLocation] = useState(editingEntry?.location || '')
  const [tags, setTags] = useState(editingEntry?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [entryDate, setEntryDate] = useState(editingEntry?.createdAt || formatDate(new Date(), 'iso'))

  // B-MODE: 감성샷 모드
  const [bMode, setBMode] = useState(editingEntry?.bMode || false)
  const [bModePhoto, setBModePhoto] = useState(editingEntry?.bModePhoto || null) // 단일 사진
  const [bModeText, setBModeText] = useState(editingEntry?.bModeText || '')
  const [bModePreview, setBModePreview] = useState(editingEntry?.bModeImage || null) // 합성된 이미지
  const [generatingPreview, setGeneratingPreview] = useState(false)

  // 일정 추가 옵션
  const [addEvent, setAddEvent] = useState(false)
  const [eventData, setEventData] = useState({
    title: '',
    category: 'date',
    endDate: '',
    time: '',
  })

  const dayNumber = daysSince(settings.startDate, new Date())
  const entryNumber = isEditing ? editingEntry.number : (entries.length + 1)
  const photoLimit = isDesktop ? 12 : 9

  // B-MODE 미리보기 자동 생성 (사진 + 텍스트 변경 시)
  useEffect(() => {
    if (!bMode || !bModePhoto) {
      setBModePreview(null)
      return
    }
    // entryDate가 변경되면 미리보기에 새 날짜 반영
    const timer = setTimeout(async () => {
      setGeneratingPreview(true)
      try {
        const img = await generateBModeImage({
          photoSrc: bModePhoto.src,
          text: bModeText || '오늘의 한 줄...',
          date: entryDate,
          location,
          watermark: '3LINEDIARY',
        })
        setBModePreview(img)
      } catch (err) {
        console.error('미리보기 생성 실패:', err)
      } finally {
        setGeneratingPreview(false)
      }
    }, 400) // 디바운스
    return () => clearTimeout(timer)
  }, [bMode, bModePhoto, bModeText, location, entryDate])

  async function handleBModePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const processed = await processPhoto(file)
    setBModePhoto(processed)
    e.target.value = ''
  }

  function downloadBModeImage() {
    if (!bModePreview) return
    const dateStr = entryDate
    downloadDataUrl(bModePreview, `our-diary-${dateStr}.png`)
  }


  async function handlePhotoUpload(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    try {
      const newPhotos = await Promise.all(
        files.slice(0, photoLimit - photos.length).map(processPhoto)
      )
      setPhotos([...photos, ...newPhotos])
    } catch (err) {
      console.error('사진 업로드 실패:', err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function removePhoto(id) {
    setPhotos(photos.filter(p => p.id !== id))
  }

  function addTag() {
    const t = tagInput.trim().replace(/^#/, '')
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  function removeTag(tag) {
    setTags(tags.filter(t => t !== tag))
  }

  function handleSave() {
    // B-MODE면 사진+텍스트만 있어도 OK
    if (bMode) {
      if (!bModePhoto) {
        alert('사진을 추가해주세요!')
        return
      }
      if (!bModeText.trim()) {
        alert('감성 문구를 적어주세요!')
        return
      }
    } else {
      if (!content.trim()) {
        alert('내용을 적어주세요!')
        return
      }
    }

    const entry = {
      id: editingEntry?.id || Date.now(),
      number: entryNumber,
      author,
      title: title.trim(),
      content: bMode ? bModeText.trim() : content.trim(),
      photos: bMode && bModePhoto ? [bModePhoto] : photos,
      mood, weather,
      location: location.trim(),
      tags,
      bMode,
      bModePhoto: bMode ? bModePhoto : null,
      bModeText: bMode ? bModeText.trim() : '',
      bModeImage: bMode ? bModePreview : null, // 합성된 이미지
      createdAt: entryDate || formatDate(new Date(), 'iso'),
      updatedAt: formatDate(new Date(), 'iso'),
    }
    if (isEditing) setEntries(entries.map(e => e.id === entry.id ? entry : e))
    else setEntries([...entries, entry])

    // 일정도 함께 추가
    if (addEvent && eventData.title.trim()) {
      const newEvt = {
        id: Date.now() + 1,
        title: eventData.title.trim(),
        date: entry.createdAt,
        endDate: eventData.endDate || entry.createdAt,
        time: eventData.time,
        location: location.trim(),
        category: eventData.category,
      }
      setEvents([...events, newEvt])
    }

    navigate('dashboard')
  }

  function handleDelete() {
    if (!isEditing) return
    if (confirm('이 일기를 삭제할까요?')) {
      setEntries(entries.filter(e => e.id !== editingEntry.id))
      navigate('dashboard')
    }
  }

  const tagColors = ['her', 'him', 'accent']
  const tagStyles = {
    her: { background: 'var(--color-her-bg)', color: 'var(--color-her)' },
    him: { background: 'var(--color-him-bg)', color: 'var(--color-him)' },
    accent: { background: 'var(--paper-warm)', color: 'var(--color-accent)' }
  }

  return (
    <div className={isDesktop ? 'desktop-write' : 'phone'}>
      <div className="paper">
        {!isDesktop && <div className="tape-top"></div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingTop: isDesktop ? 0 : '8px' }}>
          {!isDesktop && (
            <p className="meta" style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => navigate('dashboard')}>← 취소</p>
          )}
          {isDesktop && (
            <div>
              <p className="serif italic" style={{ fontSize: '24px', margin: 0 }}>
                {isEditing ? 'Edit Diary' : 'Write a New Diary'}
              </p>
              <p className="meta" style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>
                — {isEditing ? 'EDIT' : 'NEW'} ENTRY #{String(entryNumber).padStart(3, '0')} · DAY {dayNumber} —
              </p>
            </div>
          )}
          {!isDesktop && <p className="label">— {isEditing ? 'EDIT' : 'NEW'} ENTRY #{String(entryNumber).padStart(3, '0')} —</p>}
          <div style={{ display: 'flex', gap: '12px' }}>
            {isDesktop && (
              <button
                onClick={() => navigate('dashboard')}
                style={{ background: 'transparent', border: '0.5px solid var(--text-faint)', color: 'var(--text-muted)', padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px', cursor: 'pointer' }}
              >취소</button>
            )}
            <button
              onClick={handleSave}
              style={{ background: 'var(--text-primary)', color: 'var(--paper-bg)', border: 'none', padding: '8px 20px', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px', cursor: 'pointer', textTransform: 'uppercase' }}
            >저장</button>
          </div>
        </div>

        {/* B-MODE 토글 */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '1.25rem',
          padding: '4px',
          background: 'var(--paper-cream)',
          border: '0.5px solid var(--line-solid)',
          borderRadius: '20px'
        }}>
          <button
            onClick={() => setBMode(false)}
            style={{
              flex: 1,
              background: !bMode ? 'var(--text-primary)' : 'transparent',
              color: !bMode ? 'var(--paper-bg)' : 'var(--text-muted)',
              border: 'none',
              padding: '10px 4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '1px',
              cursor: 'pointer',
              borderRadius: '16px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >📔 일반 모드</button>
          <button
            onClick={() => setBMode(true)}
            style={{
              flex: 1,
              background: bMode ? 'var(--color-her)' : 'transparent',
              color: bMode ? 'white' : 'var(--text-muted)',
              border: 'none',
              padding: '10px 4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '1px',
              cursor: 'pointer',
              borderRadius: '16px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >✦ B-MODE</button>
        </div>

        {/* 날짜 지정 (일반/B-MODE 공용) - 캘린더에 반영될 날짜 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '10px 12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-her)" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p className="label" style={{ margin: 0 }}>▸ DIARY DATE</p>
          </div>
          <input
            type="date"
            className="input-line"
            style={{ fontSize: '13px', textAlign: 'right', flex: 1, maxWidth: '180px' }}
            value={entryDate}
            max={formatDate(new Date(), 'iso')}
            onChange={e => setEntryDate(e.target.value || formatDate(new Date(), 'iso'))}
          />
        </div>

        {/* ============ B-MODE 화면 ============ */}
        {bMode && (
          <div style={isDesktop ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' } : {}}>
            {/* 미리보기 영역 */}
            <div>
              <p className="label" style={{ margin: '0 0 8px' }}>▸ PREVIEW</p>
              <div style={{
                background: 'var(--paper-cream)',
                border: '0.5px solid var(--line-solid)',
                padding: '12px',
                marginBottom: '14px',
                position: 'relative'
              }}>
                {bModePreview ? (
                  <img
                    src={bModePreview}
                    alt="감성샷 미리보기"
                    style={{ width: '100%', display: 'block' }}
                  />
                ) : bModePhoto ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div className="loading-dot"></div>
                    <div className="loading-dot"></div>
                    <div className="loading-dot"></div>
                    <p className="meta" style={{ color: 'var(--text-muted)', margin: '12px 0 0' }}>
                      미리보기 만드는 중...
                    </p>
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    border: '0.5px dashed var(--line-dashed)',
                  }}>
                    <p className="serif italic" style={{ color: 'var(--text-faint)', margin: 0 }}>
                      사진을 추가하면<br />미리보기가 나타나요
                    </p>
                  </div>
                )}
                {generatingPreview && bModePreview && (
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(245, 237, 224, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <p className="meta" style={{ color: 'var(--text-muted)' }}>업데이트 중...</p>
                  </div>
                )}
              </div>

              {/* 다운로드 버튼 */}
              {bModePreview && (
                <button
                  onClick={downloadBModeImage}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: '0.5px solid var(--text-primary)',
                    color: 'var(--text-primary)',
                    padding: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '2px',
                    cursor: 'pointer',
                    marginBottom: '14px',
                    textTransform: 'uppercase'
                  }}
                >↓ 이미지로 다운로드</button>
              )}
            </div>

            {/* 입력 영역 */}
            <div>
              {/* 사진 업로드 */}
              <p className="label" style={{ margin: '0 0 8px' }}>▸ PHOTO</p>
              <div
                onClick={() => bModePhotoRef.current?.click()}
                style={{
                  background: 'var(--paper-cream)',
                  border: '0.5px dashed var(--line-dashed)',
                  padding: bModePhoto ? '8px' : '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  marginBottom: '14px',
                }}
              >
                {bModePhoto ? (
                  <div>
                    <img
                      src={bModePhoto.src}
                      alt=""
                      style={{ maxWidth: '100%', maxHeight: '200px', display: 'block', margin: '0 auto' }}
                    />
                    <p className="meta" style={{ color: 'var(--text-muted)', margin: '8px 0 0' }}>
                      클릭해서 다른 사진으로 변경
                    </p>
                  </div>
                ) : (
                  <>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ margin: '0 auto' }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                    <p className="meta" style={{ color: 'var(--text-muted)', margin: '12px 0 0' }}>+ 사진 선택</p>
                  </>
                )}
              </div>
              <input
                ref={bModePhotoRef}
                type="file"
                accept="image/*"
                className="file-input-hidden"
                onChange={handleBModePhotoUpload}
              />

              {/* 감성 문구 */}
              <p className="label" style={{ margin: '0 0 8px' }}>▸ TEXT</p>
              <div className="card" style={{ padding: '14px', marginBottom: '14px' }}>
                <textarea
                  placeholder="오늘의 감성 문구를 적어주세요...&#10;(최대 3줄)"
                  style={{
                    width: '100%', minHeight: '100px', boxSizing: 'border-box',
                    background: 'transparent', border: 'none', outline: 'none', resize: 'vertical',
                    fontFamily: 'var(--font-serif)', fontSize: '14px', lineHeight: '24px',
                    color: 'var(--text-primary)'
                  }}
                  value={bModeText}
                  onChange={e => setBModeText(e.target.value)}
                  maxLength={150}
                />
                <p className="meta" style={{ color: 'var(--text-muted)', margin: '6px 0 0', textAlign: 'right' }}>
                  {bModeText.length} / 150
                </p>
              </div>

              {/* 장소 */}
              <p className="label" style={{ margin: '0 0 8px' }}>▸ LOCATION</p>
              <div className="card" style={{ padding: '10px 12px', marginBottom: '14px' }}>
                <input
                  type="text"
                  placeholder="예: 연희동 카페"
                  className="serif italic"
                  style={{ fontSize: '13px', width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)' }}
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>

              {/* 작성자 */}
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
                <p className="meta" style={{ color: 'var(--text-secondary)', fontSize: '9px' }}>FROM</p>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span
                    className={author === 'her' ? 'badge-her' : 'badge-him outline'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setAuthor('her')}
                  >{settings.her.name.replace('장', '')}</span>
                  <span
                    className={author === 'him' ? 'badge-him' : 'badge-him outline'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setAuthor('him')}
                  >{settings.him.name.replace('염', '')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ 일반 모드 화면 ============ */}
        {!bMode && (
        <div style={isDesktop ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' } : {}}>
          <div>
            {/* 사진 */}
            <div className="polaroid" style={{ padding: '8px 8px 14px', transform: 'rotate(-1.5deg)', marginBottom: '1rem', maxWidth: isDesktop ? '100%' : '280px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : '1fr 1fr 1fr', gap: '4px', marginBottom: '8px' }}>
                {photos.map(p => (
                  <div
                    key={p.id}
                    style={{ aspectRatio: 1, backgroundImage: `url(${p.src})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', cursor: 'pointer' }}
                    onClick={() => removePhoto(p.id)}
                  >
                    <div style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', color: 'white', width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>×</div>
                  </div>
                ))}
                {photos.length < photoLimit && (
                  <div
                    style={{ background: 'var(--paper-shadow)', border: '0.5px dashed var(--line-dashed)', aspectRatio: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <p className="meta" style={{ fontSize: '16px', color: 'var(--text-muted)', margin: 0 }}>{uploading ? '...' : '+'}</p>
                  </div>
                )}
              </div>
              <p className="meta" style={{ color: 'var(--text-primary)', margin: 0, textAlign: 'center' }}>
                {photos.length}/{photoLimit} PHOTOS
              </p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="file-input-hidden" onChange={handlePhotoUpload} />

            {/* 작성자 + Day */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', padding: '8px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <p className="meta" style={{ color: 'var(--text-secondary)', fontSize: '9px' }}>FROM</p>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span
                    className={author === 'her' ? 'badge-her' : 'badge-him outline'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setAuthor('her')}
                  >{settings.her.name.replace('장', '')}</span>
                  <span
                    className={author === 'him' ? 'badge-him' : 'badge-him outline'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setAuthor('him')}
                  >{settings.him.name.replace('염', '')}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <p className="meta" style={{ color: 'var(--text-secondary)', fontSize: '9px' }}>DAY</p>
                <p className="serif italic" style={{ fontSize: '12px', margin: 0 }}>{dayNumber}</p>
              </div>
            </div>

            {/* 기분 + 날씨 - 모바일에서는 세로, PC에서는 가로 */}
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '8px', marginBottom: '12px' }}>
              <div className="card" style={{ padding: '10px 12px' }}>
                <p className="label" style={{ margin: '0 0 8px' }}>▸ MOOD</p>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                  {MOOD_OPTIONS.map(m => (
                    <span
                      key={m.key}
                      style={{
                        fontSize: '18px',
                        color: mood === m.key ? 'var(--color-her)' : 'var(--text-faint)',
                        background: mood === m.key ? 'var(--color-her-bg)' : 'transparent',
                        padding: '4px 8px', borderRadius: '6px', cursor: 'pointer',
                        minWidth: '36px', textAlign: 'center'
                      }}
                      onClick={() => setMood(m.key)}
                    >{m.icon}</span>
                  ))}
                </div>
              </div>
              <div className="card" style={{ padding: '10px 12px' }}>
                <p className="label" style={{ margin: '0 0 8px' }}>▸ WEATHER</p>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                  {WEATHER_OPTIONS.map(w => (
                    <span
                      key={w.key}
                      style={{
                        fontSize: '16px', cursor: 'pointer', padding: '4px 8px',
                        background: weather === w.key ? 'var(--paper-warm)' : 'transparent',
                        borderRadius: '6px', opacity: weather === w.key ? 1 : 0.4,
                        minWidth: '36px', textAlign: 'center'
                      }}
                      onClick={() => setWeather(w.key)}
                    >{w.icon}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* 장소 */}
            <div className="card" style={{ padding: '10px 12px', marginBottom: '8px' }}>
              <p className="label" style={{ margin: '0 0 8px' }}>▸ LOCATION</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-her)" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <input
                  type="text"
                  placeholder="장소를 적어주세요"
                  className="serif italic"
                  style={{ fontSize: '13px', flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)' }}
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>
            </div>

            {/* 태그 */}
            <div className="card" style={{ padding: '10px 12px' }}>
              <p className="label" style={{ margin: '0 0 8px' }}>▸ TAGS</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {tags.map((tag, i) => {
                  const colorKey = tagColors[i % tagColors.length]
                  return (
                    <span
                      key={tag}
                      style={{ ...tagStyles[colorKey], padding: '3px 9px', borderRadius: '10px', fontFamily: 'var(--font-mono)', fontSize: '9px', cursor: 'pointer' }}
                      onClick={() => removeTag(tag)}
                    >#{tag} ×</span>
                  )
                })}
                <input
                  type="text"
                  placeholder="+ 태그"
                  style={{ background: 'transparent', border: '0.5px dashed var(--line-dashed)', padding: '3px 9px', borderRadius: '10px', fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', width: '70px', outline: 'none' }}
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
                  }}
                  onBlur={addTag}
                />
              </div>
            </div>
          </div>

          <div>
            {/* 제목 */}
            <div style={{ marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="제목을 적어주세요..."
                className="input-line italic"
                style={{ fontSize: isDesktop ? '20px' : '16px' }}
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            {/* 본문 */}
            <div className="card lined-paper" style={{ padding: '14px', minHeight: isDesktop ? '400px' : '140px', marginBottom: '14px' }}>
              <textarea
                placeholder="오늘의 이야기를 적어봐..."
                style={{
                  width: '100%', minHeight: isDesktop ? '380px' : '120px', boxSizing: 'border-box',
                  background: 'transparent', border: 'none', outline: 'none', resize: 'vertical',
                  fontFamily: 'var(--font-serif)', fontSize: '14px', lineHeight: '24px',
                  color: 'var(--text-primary)'
                }}
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>

            {/* 일정 추가 (편집 모드에서도 표시) */}
            <div className="card" style={{ padding: '12px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: addEvent ? '10px' : 0 }}>
                  <p className="label" style={{ margin: 0 }}>▸ ADD TO CALENDAR</p>
                  <div
                    className={`toggle ${addEvent ? 'active' : 'inactive'}`}
                    onClick={() => setAddEvent(!addEvent)}
                  ></div>
                </div>

                {addEvent && (
                  <div style={{ borderTop: '0.5px dashed var(--line-solid)', paddingTop: '10px' }}>
                    <input
                      type="text"
                      placeholder="일정 제목 (예: 한강 데이트)"
                      className="input-line"
                      style={{ marginBottom: '10px', fontSize: '13px' }}
                      value={eventData.title}
                      onChange={e => setEventData({ ...eventData, title: e.target.value })}
                    />

                    {/* 카테고리 */}
                    <p className="meta" style={{ color: 'var(--text-muted)', margin: '0 0 6px', fontSize: '9px' }}>카테고리</p>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {EVENT_CATEGORIES.map(cat => (
                        <span
                          key={cat.key}
                          onClick={() => setEventData({ ...eventData, category: cat.key })}
                          style={{
                            background: eventData.category === cat.key ? cat.color : 'transparent',
                            color: eventData.category === cat.key ? cat.textColor : 'var(--text-muted)',
                            border: `0.5px solid ${eventData.category === cat.key ? cat.color : 'var(--text-faint)'}`,
                            padding: '3px 9px', borderRadius: '10px', cursor: 'pointer',
                            fontFamily: 'var(--font-mono)', fontSize: '10px',
                          }}
                        >{cat.icon} {cat.label}</span>
                      ))}
                    </div>

                    <div>
                      <label className="meta" style={{ display: 'block', color: 'var(--text-muted)', fontSize: '9px', marginBottom: '2px' }}>시간 (선택)</label>
                      <input
                        type="time" className="input-line" style={{ fontSize: '12px' }}
                        value={eventData.time}
                        onChange={e => setEventData({ ...eventData, time: e.target.value })}
                      />
                    </div>

                    <p className="meta" style={{ color: 'var(--text-muted)', margin: '8px 0 0', fontSize: '8px', fontStyle: 'italic' }}>
                      ※ 일기를 저장하면 캘린더에도 일정이 자동 추가됩니다
                    </p>
                  </div>
                )}
              </div>
          </div>
        </div>
        )}

        {isEditing && (
          <button
            onClick={handleDelete}
            style={{
              width: '100%', background: 'transparent', border: '0.5px solid var(--color-her)',
              color: 'var(--color-her)', padding: '10px',
              fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '3px',
              cursor: 'pointer', textTransform: 'uppercase', marginTop: '14px'
            }}
          >Delete entry</button>
        )}
      </div>
    </div>
  )
}
