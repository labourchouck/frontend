import { apiRequest } from './http.js'

export function fetchAdminLabourCategoryTree() {
  return apiRequest('/admin/labour-category-groups')
}

export function createAdminLabourCategory(payload) {
  return apiRequest('/admin/labour-categories', { method: 'POST', body: payload })
}

export function patchAdminLabourCategory(id, payload) {
  return apiRequest(`/admin/labour-categories/${id}`, { method: 'PATCH', body: payload })
}

export function patchAdminLabourCategoryGroup(id, payload) {
  return apiRequest(`/admin/labour-category-groups/${id}`, { method: 'PATCH', body: payload })
}

export function createAdminLabourSubcategory(payload) {
  return apiRequest('/admin/labour-subcategories', { method: 'POST', body: payload })
}

export function updateAdminLabourSubcategory(id, payload) {
  return apiRequest(`/admin/labour-subcategories/${id}`, { method: 'PATCH', body: payload })
}

