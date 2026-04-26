import imageCompression from 'browser-image-compression'
import { api } from './api'

/**
 * 사진 자동 압축
 * 1920px, 1MB 이하로 압축
 */
export async function compressPhoto(file) {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg',
  }
  try {
    const compressed = await imageCompression(file, options)
    return compressed
  } catch (err) {
    console.error('압축 실패:', err)
    return file
  }
}

/**
 * File을 base64 data URL로
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 사진 업로드 처리 - 압축 후 R2에 업로드
 *
 * 반환값:
 * {
 *   id: 임시 ID (UI용)
 *   key: R2에 저장된 키
 *   src: 이미지 URL (R2)
 *   size: 압축 후 사이즈
 *   uploadedAt: 업로드 시각
 * }
 */
export async function processPhoto(file) {
  // 1. 압축
  const compressed = await compressPhoto(file)
  const base64 = await fileToBase64(compressed)

  // 2. R2 업로드 (API 호출)
  try {
    const result = await api.uploadPhoto(base64)
    return {
      id: result.key, // key를 id로 사용
      key: result.key,
      src: result.url, // R2 전체 URL
      size: result.size || compressed.size,
      uploadedAt: new Date().toISOString(),
    }
  } catch (err) {
    console.error('R2 업로드 실패:', err)
    // 실패 시 사용자에게 알림
    throw new Error(`사진 업로드 실패: ${err.message}`)
  }
}

/**
 * 사진 삭제 (R2)
 */
export async function deletePhotoFromR2(key) {
  if (!key) return
  try {
    await api.deletePhoto(key)
  } catch (err) {
    console.error('사진 삭제 실패:', err)
  }
}

/**
 * 사진 객체에서 표시 가능한 URL 가져오기
 * - 새 사진: photo.src (R2 URL)
 * - 기존 사진: photo.key를 URL로 변환
 * - 호환성: 옛날 base64 형식도 그대로 반환
 */
export function getPhotoUrl(photo) {
  if (!photo) return null
  if (typeof photo === 'string') {
    // 문자열이면 그대로 (URL 또는 base64)
    if (photo.startsWith('http') || photo.startsWith('data:')) return photo
    return api.photoUrl(photo)
  }
  // 객체인 경우
  if (photo.src) return photo.src
  if (photo.key) return api.photoUrl(photo.key)
  return null
}
