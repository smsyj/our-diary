import imageCompression from 'browser-image-compression'

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
 * File을 base64 data URL로 (1단계 임시 저장용)
 * 2단계에서는 이 부분을 R2 업로드 API 호출로 교체
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
 * 사진 업로드 처리 - 압축 후 base64로 반환
 */
export async function processPhoto(file) {
  const compressed = await compressPhoto(file)
  const base64 = await fileToBase64(compressed)
  return {
    id: Date.now() + Math.random(),
    src: base64,
    size: compressed.size,
    uploadedAt: new Date().toISOString(),
  }
}
