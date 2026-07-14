import { apiClient } from './http.js'
import { ApiError } from './http.js'

function unwrapUploadResponse(res) {
  const json = res.data
  if (!json?.success) {
    throw new ApiError(json?.message || 'Upload failed', {
      status: res.status,
      code: json?.code,
    })
  }
  return json
}

export function uploadMedia(file, folder) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('folder', folder)
  return apiRequest('/uploads/media', { method: 'POST', body: fd })
}

/**
 * POST /uploads/document — Aadhaar / PAN scans, PDFs.
 * @param {File} file
 * @param {string} folder — e.g. UPLOAD_FOLDERS.KYC_DOCUMENTS
 */
export function uploadDocument(file, folder) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('folder', folder)
  return apiRequest('/uploads/document', { method: 'POST', body: fd })
}

/** GET /uploads/config */
export function fetchUploadConfig() {
  return apiRequest('/uploads/config')
}

/** @param {{ data?: { asset?: { url?: string } } }} envelope — api success body */
export function assetUrlFromUpload(envelope) {
  return envelope?.data?.asset?.url ?? ''
}
