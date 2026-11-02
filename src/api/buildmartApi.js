import { apiRequest } from './http.js'

/** @param {object} payload */
export async function submitBuildMartQuote(payload) {
  const data = await apiRequest('/buildmart/quotes', { method: 'POST', body: payload })
  return data?.data?.lead ?? data?.lead ?? data
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

/** The signed-in user's own Mart requests, newest first, each with its list of updates. */
export async function fetchMyBuildMartQuotes() {
  const data = await apiRequest('/buildmart/quotes/me')
  return data?.data?.items ?? data?.items ?? []
}
