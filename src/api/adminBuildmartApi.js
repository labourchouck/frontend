import { apiRequest } from './http.js'

export async function fetchAdminBuildMartLeads({ page = 1, limit = 20, status = 'all', search = '' } = {}) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (status && status !== 'all') params.set('status', status)
  if (search) params.set('search', search)

  const data = await apiRequest(`/admin/buildmart/leads?${params}`)
  return data?.data ?? data
}

export async function updateBuildMartLeadStatus(id, status) {
  const data = await apiRequest(`/admin/buildmart/leads/${id}`, { method: 'PATCH', body: { status } })
  return data?.data?.lead ?? data?.lead ?? data
}

export function buildWhatsAppLeadUrl(lead) {
  const phone = import.meta.env.VITE_BUILDMART_ADMIN_WHATSAPP?.replace(/\D/g, '')
  if (!phone) return null
  const text = [
    'BuildMart quote lead',
    `Product: ${lead.productName}`,
    lead.variantLabel ? `Variant: ${lead.variantLabel}` : null,
    `Name: ${lead.name}`,
    `Phone: ${lead.phone}`,
    `Site: ${lead.siteLocation}`,
    `Qty: ${lead.quantity}`,
    lead.deliveryDate ? `Delivery: ${lead.deliveryDate}` : null,
    lead.notes ? `Notes: ${lead.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n')
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

export async function fetchAdminMartCategories() {
  const data = await apiRequest('/buildmart/admin/categories');
  return data;
}
export async function createAdminMartCategory(payload) {
  const data = await apiRequest('/buildmart/admin/categories', { method: 'POST', body: payload });
  return data;
}
export async function updateAdminMartCategory(id, payload) {
  const data = await apiRequest('/buildmart/admin/categories/' + id, { method: 'PUT', body: payload });
  return data;
}
export async function deleteAdminMartCategory(id) {
  const data = await apiRequest('/buildmart/admin/categories/' + id, { method: 'DELETE' });
  return data;
}

export async function fetchAdminMartProducts() {
  const data = await apiRequest('/buildmart/admin/products');
  return data;
}
export async function createAdminMartProduct(payload) {
  const data = await apiRequest('/buildmart/admin/products', { method: 'POST', body: payload });
  return data;
}
export async function updateAdminMartProduct(id, payload) {
  const data = await apiRequest('/buildmart/admin/products/' + id, { method: 'PUT', body: payload });
  return data;
}
export async function deleteAdminMartProduct(id) {
  const data = await apiRequest('/buildmart/admin/products/' + id, { method: 'DELETE' });
  return data;
}

export async function fetchAdminMartBanners() {
  const data = await apiRequest('/buildmart/admin/banners');
  return data;
}
export async function createAdminMartBanner(payload) {
  const data = await apiRequest('/buildmart/admin/banners', { method: 'POST', body: payload });
  return data;
}
export async function updateAdminMartBanner(id, payload) {
  const data = await apiRequest('/buildmart/admin/banners/' + id, { method: 'PUT', body: payload });
  return data;
}
export async function deleteAdminMartBanner(id) {
  const data = await apiRequest('/buildmart/admin/banners/' + id, { method: 'DELETE' });
  return data;
}

export async function fetchAppMartCategories() {
  const data = await apiRequest('/buildmart/app/categories');
  return data;
}
export async function fetchAppMartProducts() {
  const data = await apiRequest('/buildmart/app/products');
  return data;
}
export async function fetchAppMartBanners() {
  const data = await apiRequest('/buildmart/app/banners');
  return data;
}
