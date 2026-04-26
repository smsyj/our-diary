/**
 * B-MODE: 사진 + 텍스트 합성하여 이미지로 다운로드
 *
 * 합성 방식: HTML Canvas를 사용해 클라이언트에서 직접 PNG 생성
 * - 라이브러리 추가 없이 순수 Canvas API 사용
 */

/**
 * 이미지 URL을 HTMLImageElement로 로드
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * 텍스트를 여러 줄로 자동 줄바꿈
 */
function wrapText(ctx, text, maxWidth) {
  const lines = []
  const paragraphs = text.split('\n')

  for (const para of paragraphs) {
    if (!para) {
      lines.push('')
      continue
    }
    let line = ''
    for (const char of para) {
      const test = line + char
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line)
        line = char
      } else {
        line = test
      }
    }
    if (line) lines.push(line)
  }
  return lines
}

/**
 * B-MODE 이미지 생성
 * @param {Object} options - { photoSrc, text, date, location, watermark }
 * @returns {Promise<string>} - data URL (base64)
 */
export async function generateBModeImage({
  photoSrc,
  text = '',
  date = '',
  location = '',
  watermark = 'OUR DIARY',
}) {
  if (!photoSrc) throw new Error('사진이 없어요')

  const img = await loadImage(photoSrc)

  // 캔버스 크기 - 1080px 기준 (인스타 스토리 비율)
  const W = 1080
  const photoH = Math.round((img.height / img.width) * W)
  const textAreaH = 280 // 하단 텍스트 영역
  const H = photoH + textAreaH

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // 배경 (전체 크림색)
  ctx.fillStyle = '#FAF6EE'
  ctx.fillRect(0, 0, W, H)

  // 사진 그리기
  ctx.drawImage(img, 0, 0, W, photoH)

  // 워터마크 - 우하단에 작게, 반투명하게 (사진 가리지 않게)
  if (watermark) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'
    ctx.font = "600 14px 'Courier Prime', 'Courier New', monospace"
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
    ctx.shadowBlur = 4
    ctx.fillText(watermark, W - 20, photoH - 16)
    ctx.shadowBlur = 0
  }

  // 하단 텍스트 영역 - 흰 종이 느낌
  ctx.fillStyle = '#FFFEF8'
  ctx.fillRect(0, photoH, W, textAreaH)

  // 본문 텍스트
  ctx.fillStyle = '#3D2817'
  ctx.font = "400 32px 'Cormorant Garamond', 'Noto Serif KR', serif"
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  const padding = 60
  const maxTextW = W - padding * 2
  const lines = wrapText(ctx, text, maxTextW)
  const lineHeight = 48
  const textStartY = photoH + 50

  lines.slice(0, 3).forEach((line, i) => {
    ctx.fillText(line, padding, textStartY + i * lineHeight)
  })

  // 하단 우측 - 날짜 · 장소 · by
  const footerY = H - 50
  ctx.fillStyle = '#8B6F47'
  ctx.font = "italic 400 22px 'Cormorant Garamond', 'Noto Serif KR', serif"
  ctx.textAlign = 'right'
  let footer = ''
  if (date) {
    const d = new Date(date)
    footer += `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
  }
  if (location) footer += `, ${location}에서`
  if (footer) ctx.fillText(footer, W - padding, footerY)

  return canvas.toDataURL('image/png', 0.95)
}

/**
 * data URL을 파일로 다운로드 (모바일/PC 자동 분기)
 * - 모바일: Web Share API로 공유 시트 띄움 → "사진에 저장" 가능
 * - PC: 일반 다운로드
 */
export async function downloadDataUrl(dataUrl, filename = 'our-diary.png') {
  // dataURL을 Blob으로 변환
  const blob = await (await fetch(dataUrl)).blob()
  const file = new File([blob], filename, { type: blob.type })

  // 모바일에서 Web Share API 사용 가능하면 공유 시트 띄움
  // 이러면 "사진에 저장", "다른 앱에 공유" 등이 가능
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Our Diary',
      })
      return
    } catch (err) {
      // 사용자가 취소하면 그냥 종료
      if (err.name === 'AbortError') return
      // 그 외 에러는 폴백으로
      console.warn('공유 실패, 일반 다운로드로 폴백:', err)
    }
  }

  // PC 또는 Web Share API 미지원 → 일반 다운로드
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}
